// Chain reaction authorization regression tests.
// These use the real API, scheduler and job methods with disposable in-memory
// storage and a captured process boundary.  No jobs or shell commands execute.

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var Class = require('pixl-class');
var Tools = require('pixl-tools');
var User = require('pixl-server-user');
var Engine = Class.create({
	__mixins: [require('./api.js'), require('./scheduler.js'), require('./job.js')]
});

function copy(value) {
	return JSON.parse(JSON.stringify(value));
}

function fixture(kind, limits) {
	// Only identity lookup is simulated: all actual privilege checks run.
	var app = new Engine();
	var user = {
		username: 'limited', active: 1,
		privileges: Object.assign({ create_events: 1, edit_events: 1, run_events: 1, cat_allowed: 1, grp_allowedgrp: 1 }, limits)
	};
	if (kind == 'key') Object.assign(user, { key: 'testonly', id: 'testkey', title: 'Test Key' });
	app.loadSession = function(args, done) {
		done(null, user.key ? { type: 'api' } : { username: user.username }, user);
	};
	app.usermgr = {
		requireParams: User.prototype.requireParams,
		doError: function(code, description, done) { done({ code: code, description: description }); return false; }
	};
	app.multi = { master: true };
	app.tz = 'UTC';
	app.state = { cursors: {}, stats: {} };
	app.eventQueue = {};
	app.activeJobs = {};
	app.deadJobs = {};
	app.kids = {};
	app.internalQueue = {};
	app.server = { hostname: 'allowedhost', config: { get: function(key) { return key == 'allow_event_updates_from_jobs'; } } };
	app.defaultWebHookTextTemplates = {};
	app.slaves = {
		allowedhost: { hostname: 'allowedhost', master: true },
		restrictedhost: { hostname: 'restrictedhost', master: true }
	};
	var sequence = 0;
	app.getUniqueID = function(prefix) { return prefix + (++sequence); };
	['logDebug', 'logTransaction', 'logActivity', 'updateClientData', 'authSocketEmit'].forEach(function(name) {
		app[name] = function() {};
	});
	var warnings = [];
	app.logError = function(code, message) { warnings.push(message); };
	app.getClientInfo = function() { return {}; };
	app.getAllActiveJobs = function() {
		var jobs = Object.assign({}, app.activeJobs, app.internalQueue);
		Object.keys(app.slaves).forEach(function(hostname) { Object.assign(jobs, app.slaves[hostname].active_jobs); });
		return jobs;
	};
	var launches = [];
	app.launchLocalJob = function(job) { launches.push(job); app.activeJobs[job.id] = job; };
	var base = { title: 'Source', enabled: 1, category: 'allowed', target: 'allowedgrp', plugin: 'shellplug', params: { script: 'exit 0' } };
	var records = {
		'global/schedule': [Object.assign(copy(base), { id: 'target', title: 'Target', category: 'restricted', target: 'restrictedgrp' })],
		'global/plugins': [{ id: 'shellplug', title: 'Shell', enabled: 1, command: 'bin/shell-plugin.js', params: [{ id: 'script', type: 'textarea' }] }],
		'global/categories': [{ id: 'allowed', enabled: 1 }, { id: 'restricted', enabled: 1 }],
		'global/server_groups': [{ id: 'allowedgrp', regexp: '^allowedhost$' }, { id: 'restrictedgrp', regexp: '^restrictedhost$' }]
	};
	app.storage = {
		lock: function(key, wait, done) { done(); },
		unlock: function() {},
		listFind: function(key, criteria, done) {
			var item = (records[key] || []).find(function(item) {
				return Object.keys(criteria).every(function(name) { return item[name] === criteria[name]; });
			});
			done(null, item ? copy(item) : null);
		},
		listUnshift: function(key, item, done) { (records[key] || (records[key] = [])).unshift(copy(item)); if (done) done(null); },
		listPush: function(key, item, done) { (records[key] || (records[key] = [])).push(copy(item)); if (done) done(null); },
		listFindUpdate: function(key, criteria, changes, done) {
			var item = records[key].find(function(item) { return item.id == criteria.id; });
			Object.assign(item, copy(changes));
			done(null, copy(item));
		},
		enqueue: function(task) { task({}, function() {}); },
		put: function(key, data, done) { records[key] = copy(data); done(); },
		expire: function() {}
	};
	return {
		app: app, user: user, base: base, records: records, launches: launches, warnings: warnings,
		event: function(id) { return records['global/schedule'].find(function(item) { return item.id == id; }); },
		call: function(method, params) {
			return new Promise(function(resolve) {
				app['api_' + method]({ params: copy(params), query: {}, server_groups: records['global/server_groups'] }, resolve);
			});
		},
		launch: function(event) {
			return new Promise(function(resolve, reject) {
				app.launchOrQueueJob(copy(event), function(err, jobs) { if (err) reject(err); else resolve(jobs); });
			});
		}
	};
}

module.exports = function testPermanentChainAuthorization(test) {
	async function run() {
		// Both authentication types and either limit independently prohibit chains.
		for (var kind of ['user', 'key']) {
			for (var limits of [{ cat_limit: 1 }, { grp_limit: 1 }, { cat_limit: 1, grp_limit: 1 }]) {
				var f = fixture(kind, limits);
				var label = kind + ' ' + JSON.stringify(limits);
				test.ok((await f.call('run_event', { id: 'target' })).code != 0, label + ': direct restricted run denied');
				test.ok((await f.call('update_event', { id: 'target', title: 'Denied' })).code != 0, label + ': direct restricted edit denied');
				for (var field of ['chain', 'chain_error', 'chain_params']) {
					var value = field == 'chain_params' ? { script: 'untrusted' } : 'target';
					var rejected = await f.call('create_event', Object.assign(copy(f.base), { [field]: value }));
					test.ok(rejected.code != 0, label + ': create rejects ' + field);
				}
				
				var created = await f.call('create_event', Object.assign(copy(f.base), { chain_disabled: false }));
				assert.strictEqual(created.code, 0);
				var id = created.id;
				test.ok(f.event(id).chain_disabled === true, label + ': create sets permanent flag');
				for (var field of ['chain', 'chain_error', 'chain_params']) {
					var value = field == 'chain_params' ? { script: 'untrusted' } : 'target';
					var rejected = await f.call('update_event', { id: id, [field]: value, chain_disabled: false });
					test.ok(rejected.code != 0, label + ': update rejects ' + field);
				}
				
				// Broad allowlists do not restore chain privileges.
				f.user.privileges.cat_restricted = f.user.privileges.grp_restrictedgrp = 1;
				test.ok((await f.call('update_event', { id: id, chain: 'target' })).code != 0, label + ': all categories/groups still restricted');
				
				// An administrator cannot clear the marker with any JSON value or omission.
				f.user.privileges.admin = 1;
				for (var value of [false, null, 0, '', '-1', true]) {
					assert.strictEqual((await f.call('update_event', { id: id, chain_disabled: value })).code, 0);
					test.ok(f.event(id).chain_disabled === true, label + ': admin cannot clear flag with ' + JSON.stringify(value));
				}
				assert.strictEqual((await f.call('update_event', { id: id, title: 'Still restricted' })).code, 0);
				test.ok(f.event(id).chain_disabled === true, label + ': omitted flag survives admin edit');
				test.ok((await f.call('update_event', { id: id, chain: 'target' })).code != 0, label + ': admin cannot chain flagged event');
				test.ok((await f.call('create_event', Object.assign(copy(f.base), { id: id }))).code != 0, label + ': duplicate ID cannot shadow flag');
				
				// Scheduler and admin launches inherit the marker; plugin output cannot
				// replace it, including detached responses and nested Event updates.
				var jobs = await f.launch(f.event(id));
				var job = jobs[0];
				test.ok(job.chain_disabled === true, label + ': scheduled job inherits restriction');
				f.app.handleChildResponse(job, {}, {
					chain_disabled: false, chain: 'target', chain_error: 'target', chain_params: { script: 'untrusted' },
					update_event: { id: 'target', chain_disabled: false, chain: 'target', chain_error: 'target', chain_params: { script: 'untrusted' }, title: 'Plugin edit' }
				});
				test.ok(job.chain_disabled === true && !job.chain && !job.chain_error && !job.chain_params, label + ': plugin chains blocked');
				test.ok(job.update_event.chain_disabled === true && !job.update_event.id && !job.update_event.chain && !job.update_event.chain_error, label + ': nested update preserves policy');
				test.ok(job.update_event.title == 'Plugin edit', label + ': ordinary plugin updates survive');
				f.app.detachedJobUpdate({ id: job.id, in_progress: true, chain_disabled: false, chain: 'target' });
				test.ok(job.chain_disabled === true && !job.chain, label + ': detached response cannot restore chains');
				
				// The final guard must also reject forged settings and launch-failure
				// pseudo-jobs, before looking up or queuing any target.
				for (var code of [0, 1, 'job_launch_failure']) {
					var count = f.launches.length;
					f.app.chainReaction(Object.assign(copy(job), { code: code, chain: 'target', chain_error: 'target' }), 'target');
					test.ok(f.launches.length == count, label + ': final guard blocks code ' + code);
				}
				test.ok(f.warnings.length > 0, label + ': blocked runtime attempts are logged');
			}
		}
		
		// Editing an unrestricted Event makes it permanently restricted, even
		// when the edit does not mention chains or the server-owned flag.
		var f = fixture('user', { cat_limit: 1 });
		f.records['global/schedule'].push(Object.assign(copy(f.base), { id: 'existing', chain: 'target' }));
		assert.strictEqual((await f.call('update_event', { id: 'existing', title: 'Edited' })).code, 0);
		test.ok(f.event('existing').chain_disabled === true, 'Restricted edit flags existing Event');
		assert.strictEqual((await f.call('update_event', { id: 'existing', chain: '', chain_error: '', chain_params: {} })).code, 0);
		test.ok(f.event('existing').chain_disabled === true && !f.event('existing').chain, 'Clearing chains is permitted without clearing marker');
		
		// Manual restrictions are job-only unless that job subsequently edits
		// its Event.  Even read-only runners may not activate saved chains.
		for (var read_only of [0, 1]) {
			var f = fixture('key', { grp_limit: 1, job_read_only: read_only });
			f.records['global/schedule'].push(Object.assign(copy(f.base), { id: 'manual' }));
			for (var field of ['chain', 'chain_error']) {
				f.event('manual')[field] = 'target';
				test.ok((await f.call('run_event', { id: 'manual' })).code != 0, 'Restricted runner cannot trigger saved ' + field);
				delete f.event('manual')[field];
			}
			assert.strictEqual((await f.call('run_event', { id: 'manual', chain_disabled: false })).code, 0);
			var job = f.launches[0];
			test.ok(job.chain_disabled === true && !f.event('manual').chain_disabled, 'Manual run flags only job (read-only ' + read_only + ')');
			f.app.handleChildResponse(job, {}, { update_event: { chain_disabled: false, title: 'Saved by restricted job' } });
			job.code = 0;
			f.app.finishJob(job);
			test.ok(f.event('manual').chain_disabled === true, 'Job-driven Event edit persists restriction');
		}
		
		// Job updates have a fixed property boundary for users and API keys,
		// including administrators.  Capture remote messages instead of executing
		// processes, and include a pending job in each bulk selection.
		for (var kind of ['user', 'key']) {
			for (var admin of [0, 1]) {
				for (var method of ['update_job', 'update_jobs']) {
					var f = fixture(kind, { admin: admin });
					var label = method + ' ' + kind + ' admin=' + admin;
					var job = Object.assign(copy(f.base), { id: 'active', event: 'source', hostname: 'allowedhost', command: 'original', log_file: '/original.log' });
					var pending = Object.assign(copy(job), { id: 'pending', action: 'launchLocalJob' });
					var remote = Object.assign(copy(job), { id: 'remote', hostname: 'remotehost' });
					var messages = [];
					f.app.activeJobs[job.id] = job;
					f.app.internalQueue[pending.id] = pending;
					f.app.slaves.remotehost = {
						active_jobs: { remote: remote },
						socket: { emit: function(name, data) { messages.push(copy(data)); } }
					};
					var update = function(data, id) {
						return f.call(method, method == 'update_job' ? Object.assign(Object.create(null), { id: id || job.id }, data) : { event: 'source', updates: data });
					};
					var snapshot = function() { return JSON.stringify([job, pending, remote, messages]); };
					var before = snapshot();
					var forbidden = {
						event: 'target', category: 'restricted', target: 'restrictedgrp', plugin: 'other', params: { script: 'untrusted' },
						command: 'untrusted', env: { PATH: '/untrusted' }, uid: 0, gid: 0, cwd: '/untrusted',
						log_file: '/untrusted.log', update_event: { title: '<b>Untrusted</b>', plugin: 'other' },
						complete: 1, code: 0, progress: 1, pid: 123, hostname: 'otherhost', action: 'otherAction',
						chain_disabled: false, chain_params: {}, something_custom: 'untrusted', constructor: {}, prototype: {}
					};
					if (method == 'update_jobs') Object.assign(forbidden, { id: 'otherjob', api_key: 'untrusted', session_id: 'untrusted' });
					for (var key of Object.keys(forbidden)) {
						var response = await update({ timeout: 99, [key]: forbidden[key] });
						test.ok(response.code != 0 && snapshot() === before, label + ': rejects ' + key + ' without changing or forwarding any jobs');
					}
					var response = await update(JSON.parse('{"timeout":99,"__proto__":{"command":"untrusted"}}'));
					test.ok(response.code != 0 && snapshot() === before, label + ': rejects __proto__');
					
					// Supported names still need value checks, particularly title HTML.
					for (var invalid of [{ title: '<b>Bad</b>' }, { title: '' }, { timeout: '60' }, { retries: -1 }, { memory_limit: 1.5 }, { chain: '../target' }, { notify_fail: [] }, { web_hook: 'file:///tmp/log' }]) {
						var response = await update(invalid);
						test.ok(response.code != 0 && snapshot() === before, label + ': rejects malformed ' + Object.keys(invalid)[0]);
					}
					
					// Exercise every supported field through local, pending and remote
					// updates.  Zeroes and empty strings must remain usable to clear limits.
					var allowed = {
						title: 'Updated title', timeout: 0, retries: 0, retry_delay: 0, chain: '', chain_error: '',
						notify_success: '', notify_fail: 'test@example.com', web_hook: '', cpu_limit: 0,
						cpu_sustain: 0, memory_limit: 0, memory_sustain: 0, log_max_size: 0
					};
					for (var id of (method == 'update_job' ? ['active', 'pending', 'remote'] : ['active'])) {
						var response = await update(allowed, id);
						test.ok(response.code === 0 && (method == 'update_job' || response.count === 3), label + ': accepts allowed updates');
					}
					test.ok(messages.length === 1 && JSON.stringify(messages[0]) === JSON.stringify(Object.assign(copy(allowed), { id: remote.id })), label + ': forwards only allowed updates and job ID');
					f.app.activeJobs[remote.id] = remote;
					f.app.updateLocalJob(messages[0]);
					for (var target of [job, pending, remote]) {
						test.ok(Object.keys(allowed).every(function(key) { return target[key] === allowed[key]; }), label + ': applied allowed fields to ' + target.id);
						
						// The local boundary also ignores unexpected fields from a peer.
						var saved = JSON.stringify(target);
						f.app.updateLocalJob(Object.assign({}, forbidden, { id: target.id }));
						test.ok(JSON.stringify(target) === saved, label + ': local guard preserves internal fields on ' + target.id);
					}
				}
			}
		}
		
		// Single and bulk job APIs must validate before updating, and preserve
		// restrictions even when a different, unrestricted user edits the job.
		for (var method of ['update_job', 'update_jobs']) {
			var f = fixture('key', { cat_limit: 1 });
			f.records['global/schedule'].push(Object.assign(copy(f.base), { id: 'active' }));
			var job = (await f.launch(f.event('active')))[0];
			var update = function(data) {
				return f.call(method, method == 'update_job' ? Object.assign({ id: job.id }, data) : { id: job.id, updates: data });
			};
			for (var field of ['chain', 'chain_error', 'chain_params', 'update_event']) {
				var value = field == 'chain_params' ? { script: 'untrusted' } : (field == 'update_event' ? { chain: 'target' } : 'target');
				test.ok((await update({ [field]: value })).code != 0, method + ': rejects ' + field);
			}
			test.ok((await update({ timeout: 99, chain_disabled: false })).code != 0, method + ': rejects client chain_disabled');
			assert.strictEqual((await update({ timeout: 99 })).code, 0);
			test.ok(job.chain_disabled === true && job.timeout == 99, method + ': ordinary restricted edit flags job');
			f.user.privileges = { admin: 1 };
			test.ok((await update({ chain_disabled: false, chain: '', chain_error: '' })).code != 0, method + ': admin cannot submit chain_disabled');
			assert.strictEqual((await update({ chain: '', chain_error: '' })).code, 0);
			test.ok(job.chain_disabled === true, method + ': admin cannot clear flag');
			test.ok((await update({ chain: 'target' })).code != 0, method + ': admin cannot restore chains');
		}
		
		// A stale plugin completion may edit an Event flagged after it started,
		// but must not clear its current restriction via nested update_event.
		var f = fixture('user', { admin: 1 });
		f.records['global/schedule'].push(Object.assign(copy(f.base), { id: 'stale' }));
		var job = (await f.launch(f.event('stale')))[0];
		f.event('stale').chain_disabled = true;
		var count = f.launches.length;
		f.app.chainReaction(job, 'target');
		test.ok(f.launches.length == count, 'Current source flag blocks a job launched before the restricted edit');
		f.app.handleChildResponse(job, {}, { update_event: { chain_disabled: false, title: 'Stale completion' } });
		job.code = 0;
		f.app.finishJob(job);
		test.ok(f.event('stale').chain_disabled === true, 'Older unflagged job cannot clear saved restriction');
		
		// Bulk validation must be atomic when only some matching jobs are flagged.
		var f = fixture('user', { admin: 1 });
		f.records['global/schedule'].push(Object.assign(copy(f.base), { id: 'mixed' }));
		var first = (await f.launch(f.event('mixed')))[0];
		var second = (await f.launch(Object.assign(copy(f.event('mixed')), { chain_disabled: true })))[0];
		test.ok((await f.call('update_jobs', { event: 'mixed', updates: { chain: 'target', timeout: 42 } })).code != 0, 'Mixed bulk chain update rejected');
		test.ok(!first.chain && first.timeout != 42 && second.timeout != 42, 'Rejected bulk update changes no jobs');
		assert.strictEqual((await f.call('update_jobs', { event: 'mixed', updates: { timeout: 42 } })).code, 0);
		test.ok(!first.chain_disabled && second.chain_disabled === true, 'Bulk update preserves individual restrictions');
		
		// Pending jobs use the same permanent guard, before a process exists.
		delete f.app.activeJobs[second.id];
		second.action = 'launchLocalJob';
		f.app.internalQueue[second.id] = second;
		f.app.updateLocalJob({ id: second.id, chain_disabled: false, chain: 'target' });
		test.ok(second.chain_disabled === true && !second.chain, 'Pending job update cannot clear restriction');
		
		// A remote completion can already be in flight when a restricted API
		// update is accepted.  The master must retain its decision independently
		// of the worker's older completion and status snapshots.
		var f = fixture('key', { grp_limit: 1 });
		var messages = [];
		f.app.server.hostname = 'masterhost';
		f.app.slaves.allowedhost.master = false;
		f.app.slaves.allowedhost.socket = { emit: function(name, data) { messages.push({ name: name, data: copy(data) }); } };
		f.records['global/schedule'].push(Object.assign(copy(f.base), { id: 'remote' }));
		var job = (await f.launch(f.event('remote')))[0];
		var completion = Object.assign(copy(job), { code: 0, chain: 'target', chain_disabled: false });
		assert.strictEqual((await f.call('update_job', { id: job.id, timeout: 99 })).code, 0);
		test.ok(messages[1].name == 'update_job' && messages[1].data.chain_disabled === true, 'Restriction is forwarded to remote worker');
		f.app.finishJob(completion);
		test.ok(completion.chain_disabled === true && !completion.chain, 'Older worker completion cannot bypass restriction');
		test.ok(!f.app.state.chainDisabledJobs[job.id], 'Completed remote restriction tracking is cleaned up');
		test.ok(messages.length == 2 && !f.launches.length, 'Remote completion launches no chain target');
		
		// A job-only restriction survives queue serialization, launch, retries
		// and shutdown reruns, without relying on the saved Event being flagged.
		var f = fixture('key', { grp_limit: 1 });
		f.records['global/schedule'].push(Object.assign(copy(f.base), { id: 'queued', queue: 1 }));
		var launch = f.app.launchJob;
		f.app.launchJob = function(event, done) { done(new Error('Simulated concurrency limit')); };
		assert.strictEqual((await f.call('run_event', { id: 'queued' })).code, 0);
		f.app.launchJob = launch;
		var queued = f.records['global/event_queue/queued'][0];
		test.ok(queued.chain_disabled === true && !f.event('queued').chain_disabled, 'Queue stores job-only restriction');
		var job = (await f.launch(queued))[0];
		test.ok(job.chain_disabled === true, 'Dequeued launch preserves restriction');
		f.app.runJobAgain(job);
		test.ok(f.launches[f.launches.length - 1].chain_disabled === true, 'Shutdown rerun preserves restriction');
		var temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cronicle-chain-test-'));
		try {
			job.log_file = path.join(temp_dir, 'retry.log');
			job.code = 1;
			job.retries = 1;
			job.retry_delay = 1;
			f.app.finishLocalJob(job);
			test.ok(f.launches[f.launches.length - 1].chain_disabled === true && job.when, 'Delayed retry preserves restriction');
		}
		finally { fs.rmSync(temp_dir, { recursive: true, force: true }); }
		
		// An old queue snapshot must also inherit a newly flagged saved Event.
		f.event('queued').chain_disabled = true;
		var stale = Object.assign(copy(f.event('queued')), { chain_disabled: false });
		test.ok((await f.launch(stale))[0].chain_disabled === true, 'Stale queue snapshot cannot override current saved flag');
		
		// Positive controls: unrestricted users, keys and administrators keep
		// both chains and parameter passing.  Flagged targets may run, but cannot
		// initiate another chain of their own.
		for (var privileges of [{}, { admin: 1, cat_limit: 1, grp_limit: 1 }]) {
			for (var kind of ['user', 'key']) {
				var f = fixture(kind, privileges);
				var created = await f.call('create_event', Object.assign(copy(f.base), { chain: 'target', chain_error: 'target' }));
				assert.strictEqual(created.code, 0);
				test.ok(!f.event(created.id).chain_disabled, 'Unrestricted create retains chain support');
				for (var code of [0, 1]) {
					assert.strictEqual((await f.call('run_event', { id: created.id })).code, 0);
					var job = f.launches[f.launches.length - 1];
					f.app.handleChildResponse(job, {}, { chain: 'target', chain_error: 'target', chain_params: { script: 'echo allowed' } });
					job.code = code;
					f.app.chainReaction(job, code ? job.chain_error : job.chain);
					var target = f.launches[f.launches.length - 1];
					test.ok(target.event == 'target' && target.params.script == 'echo allowed', 'Unrestricted chain and params preserved, code ' + code);
				}
				f.event('target').chain_disabled = true;
				f.app.chainReaction(job, 'target');
				test.ok(f.launches[f.launches.length - 1].chain_disabled === true, 'Flagged target can run but carries restriction');
			}
		}
	}
	
	run().then(function() { test.done(); }, function(err) {
		test.ok(false, err.stack || String(err));
		test.done();
	});
};
