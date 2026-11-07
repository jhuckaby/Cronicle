// Private queue and detached plugin regression tests.
// Run with the normal suite, or in a disposable Linux container as root to also
// exercise real access checks between the daemon and an unprivileged account.

var assert = require('assert');
var cp = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var Class = require('pixl-class');
var Tools = require('pixl-tools');
var Engine = require('./engine.js');
var App = Class.create({ __mixins: [require('./job.js'), require('./queue.js')] });

module.exports = function testPrivateQueue(test) {
	async function run() {
		var temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cronicle-private-queue-'));
		var app = new App();
		var queue_dir = path.join(temp_dir, 'queue');
		var config = { log_dir: temp_dir, queue_dir: queue_dir };
		var stop = new Error('Stop after directory setup');
		var helper = null;
		var temp_file = null;
		var other_user = (process.getuid() === 0) ? Tools.getpwnam('nobody', true) : null;
		
		// Stop startup immediately after its real directory initialization.  No
		// sockets, storage services or scheduler are needed for these checks.
		app.server = {
			debug: true,
			hostname: 'queue-test',
			config: { get: function(key) { return config[key]; } },
			Storage: { addRecordType: function() { throw stop; } }
		};
		app.logDebug = function() {};
		app.logError = function(code, message) { throw new Error(message); };
		app.deleteExpiredJobData = function() {};
		var startup = function() {
			assert.throws(function() { Engine.prototype.startup.call(app, function() {}); }, function(err) { return err === stop; });
		};
		var waitFor = async function(check) {
			var deadline = Date.now() + 10000;
			while (!check()) {
				assert(Date.now() < deadline, 'Timed out waiting for detached helper');
				await new Promise(function(resolve) { setTimeout(resolve, 25); });
			}
		};
		
		try {
			// The parent remains traversable so a denied access comes from the queue
			// itself, rather than from mkdtemp's private parent directory.
			fs.chmodSync(temp_dir, 0o755);
			startup();
			test.ok((fs.statSync(queue_dir).mode & 0o777) === 0o700, 'New queue is daemon-private');
			fs.chmodSync(queue_dir, 0o777);
			startup();
			test.ok((fs.statSync(queue_dir).mode & 0o777) === 0o700, 'Startup tightens an existing world-writable queue');
			
			if (process.getuid() === 0) {
				// This branch runs in the Linux container, using nobody as the local
				// attacker and as the optional configured daemon account.
				config.uid = 'nobody';
				app.server.debug = false;
				startup();
				test.ok(fs.statSync(queue_dir).uid === other_user.uid, 'Queue ownership follows the configured daemon UID');
				var access_script = "require('fs').writeFileSync(process.argv[1] + '/allowed.tmp', 'ok')";
				var result = cp.spawnSync(process.execPath, ['-e', access_script, queue_dir], { uid: other_user.uid, gid: other_user.gid });
				test.ok(result.status === 0, 'Configured daemon account can write its queue after dropping privileges');
				fs.unlinkSync(path.join(queue_dir, 'allowed.tmp'));
				delete config.uid;
				app.server.debug = true;
				startup();
				
				result = cp.spawnSync(process.execPath, ['-e', access_script, queue_dir], { uid: other_user.uid, gid: other_user.gid });
				test.ok(result.status !== 0 && /EACCES/.test(result.stderr.toString()), 'Another local account cannot plant queue files');
			}
			
			// Check normal daemon writes, restart persistence and delayed dispatch
			// through the real queue methods, without launching an arbitrary command.
			app.internalQueue = { saved: { action: 'queueTestAction', when: 1, value: 'saved' } };
			var received = null;
			app.queueTestAction = function(task) { received = task.value; };
			app.shutdownQueue();
			await waitFor(function() { return fs.readdirSync(queue_dir).some(function(file) { return /\.json$/.test(file); }); });
			app.internalQueue = {};
			app.monitorExternalQueue();
			await waitFor(function() { return Object.keys(app.internalQueue).length > 0; });
			app.monitorInternalQueue();
			test.ok(received === 'saved', 'Persisted delayed queue task is recovered and dispatched');
			
			// A plugin preload records its UID.  It must run only inside the plugin,
			// never inside the helper, which retains the daemon's privileges.
			var marker = path.join(temp_dir, 'preload.log');
			var preload = path.join(temp_dir, 'preload.js');
			var plugin = path.join(temp_dir, 'plugin.js');
			fs.writeFileSync(marker, '', { mode: 0o666 });
			fs.chmodSync(marker, 0o666);
			fs.writeFileSync(preload, "require('fs').appendFileSync(" + JSON.stringify(marker) + ", process.getuid() + '\\n');\n");
			fs.writeFileSync(plugin, [
				"var fs = require('fs');",
				"var job = JSON.parse(fs.readFileSync(0, 'utf8'));",
				"var data = { uid: process.getuid(), gid: process.getgid(), cwd: process.cwd(), token: process.env.TOKEN, arg: process.argv[2], job: job.id };",
				"process.stdout.write('plugin stdout\\n');",
				"process.stderr.write('plugin stderr\\n');",
				"process.stdout.write(JSON.stringify({ complete: 1, code: 0, description: JSON.stringify(data) }) + '\\n');"
			].join('\n'));
			
			var job = {
				id: 'private-queue-detached', detached: 1, cwd: temp_dir,
				command: process.execPath + ' ' + plugin + ' $TOKEN',
				env: { PATH: '/nonexistent', NODE_OPTIONS: '--require=' + preload },
				params: { token: 'plugin-parameter' }
			};
			if (other_user) { job.uid = other_user.username; job.gid = other_user.gid; }
			app.multi = { master: false };
			
			// Inspect the private handoff and helper options, then invoke the actual
			// spawn.  Restore immediately so no unrelated process launch is affected.
			var spawn = cp.spawn;
			cp.spawn = function(command, args, options) {
				test.ok(command === process.execPath, 'Helper uses the daemon Node executable');
				test.ok(!options.env && !options.cwd && !('uid' in options) && !('gid' in options), 'Helper inherits the daemon identity, environment and working directory');
				temp_file = args[2];
				test.ok((fs.statSync(temp_file).mode & 0o777) === 0o600, 'Helper job file is private');
				if (process.getuid() === 0) {
					var denied = cp.spawnSync(process.execPath, ['-e', "require('fs').readFileSync(process.argv[1])", temp_file], { uid: other_user.uid, gid: other_user.gid });
					test.ok(denied.status !== 0 && /EACCES/.test(denied.stderr.toString()), 'Plugin account cannot read or replace the private helper job');
				}
				helper = spawn.apply(cp, arguments);
				return helper;
			};
			try { app.launchLocalJob(job); }
			finally { cp.spawn = spawn; }
			
			var completion = path.join(queue_dir, job.id + '-complete.json');
			await waitFor(function() { return fs.existsSync(completion); });
			var update = JSON.parse(fs.readFileSync(completion, 'utf8'));
			test.ok(update.action === 'detachedJobUpdate' && update.complete && update.code === 0, 'Detached helper writes successful completion into the private queue');
			var data = JSON.parse(update.description);
			var plugin_uid = other_user ? other_user.uid : process.getuid();
			test.ok(data.uid === plugin_uid, 'Plugin keeps its configured UID');
			test.ok(data.gid === (other_user || Tools.getpwnam(process.getuid(), true)).gid, 'Plugin keeps its configured GID');
			test.ok(data.cwd === fs.realpathSync(temp_dir) && data.token === 'plugin-parameter' && data.arg === data.token && data.job === job.id, 'Plugin keeps its working directory, environment, parameters, argument expansion and job input');
			test.ok(fs.readFileSync(marker, 'utf8') === plugin_uid + '\n', 'Plugin NODE_OPTIONS runs only under the plugin account');
			var log = fs.readFileSync(job.log_file, 'utf8');
			test.ok(/plugin stdout/.test(log) && /plugin stderr/.test(log), 'Detached stdout and stderr still reach the job log');
			test.ok(!fs.existsSync(temp_file), 'Detached helper removes its private handoff file');
		}
		finally {
			if (helper) { try { helper.kill('SIGTERM'); } catch (err) {} }
			if (temp_file) fs.rmSync(temp_file, { force: true });
			fs.rmSync(temp_dir, { recursive: true, force: true });
		}
	}
	
	run().then(function() { test.done(); }, function(err) {
		test.ok(false, err.stack || String(err));
		test.done();
	});
};
