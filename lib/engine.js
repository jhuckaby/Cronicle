// Cronicle Server Component
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var assert = require("assert");
var fs = require("fs");
var mkdirp = require('mkdirp');
var async = require('async');
var glob = require('glob');
var jstz = require('jstimezonedetect');

var Class = require("pixl-class");
var Component = require("pixl-server/component");
var Tools = require("pixl-tools");
var Request = require("pixl-request");

module.exports = Class.create({
	
	__name: 'Cronicle',
	__parent: Component,
	__mixins: [ 
		require('./api.js'),       // API Layer Mixin
		require('./comm.js'),      // Communication Layer Mixin
		require('./scheduler.js'), // Scheduler Mixin
		require('./job.js'),       // Job Management Layer Mixin
		require('./queue.js'),     // Queue Layer Mixin
		require('./discovery.js')  // Discovery Layer Mixin
	],
	
	activeJobs: null,
	deadJobs: null,
	eventQueue: null,
	kids: null,
	state: null,
	
	defaultWebHookTextTemplates: {
		"job_start": "Job started on [hostname]: [event_title] [job_details_url]",
		"job_complete": "Job completed successfully on [hostname]: [event_title] [job_details_url]",
		"job_failure": "Job failed on [hostname]: [event_title]: Error [code]: [description] [job_details_url]",
		"job_launch_failure": "Failed to launch scheduled event: [event_title]: [description] [edit_event_url]"
	},
	
	startup: function(callback) {
		// start cronicle service
		var self = this;
		this.logDebug(3, "Cronicle engine starting up", process.argv );
		
		// create a few extra dirs we'll need
		try { mkdirp.sync( this.server.config.get('log_dir') + '/jobs' ); }
		catch (e) {
			throw new Error("FATAL ERROR: Log directory could not be created: " + this.server.config.get('log_dir') + "/jobs: " + e);
		}
		try { mkdirp.sync( this.server.config.get('queue_dir') ); }
		catch (e) {
			throw new Error("FATAL ERROR: Queue directory could not be created: " + this.server.config.get('queue_dir') + ": " + e);
		}
		
		// dirs should be writable by all users
		fs.chmodSync( this.server.config.get('log_dir') + '/jobs', "777" );
		fs.chmodSync( this.server.config.get('queue_dir'), "777" );
		
		// keep track of jobs
		this.activeJobs = {};
		this.deadJobs = {};
		this.eventQueue = {};
		this.kids = {};
		this.state = { enabled: true, cursors: {}, stats: {}, flagged_jobs: {} };
		
		// we'll need these components frequently
		this.storage = this.server.Storage;
		this.web = this.server.WebServer;
		this.api = this.server.API;
		this.usermgr = this.server.User;
		
		// register custom storage type for dual-metadata-log delete
		this.storage.addRecordType( 'cronicle_job', {
			'delete': this.deleteExpiredJobData.bind(this)
		} );
		
		// multi-server cluster / failover system
		this.multi = {
			cluster: false,
			master: false,
			slave: false,
			masterHostname: '',
			eligible: false,
			lastPingReceived: 0,
			lastPingSent: 0,
			data: {}
		};
		
		// construct http client for web hooks and uploading logs
		this.request = new Request( "Cronicle " + this.server.__version );
		
		// optionally bypass all ssl cert validation
		if (this.server.config.get('ssl_cert_bypass') || this.server.config.get('web_hook_ssl_cert_bypass')) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		}
		
		// register our class as an API namespace
		this.api.addNamespace( "app", "api_", this );
		
		// register a handler for HTTP OPTIONS (for CORS AJAX preflight)
		this.web.addMethodHandler( "OPTIONS", "CORS Preflight", this.corsPreflight.bind(this) );
		
		// start socket.io server, attach to http/https
		this.startSocketListener();
		
		// start auto-discovery listener (UDP)
		this.setupDiscovery();
		
		// add uncaught exception handler
		require('uncatch').on('uncaughtException', this.emergencyShutdown.bind(this));
		
		// listen for ticks so we can broadcast status
		this.server.on('tick', this.tick.bind(this));
		
		// register hooks for when users are created / deleted
		this.usermgr.registerHook( 'after_create', this.afterUserChange.bind(this, 'user_create') );
		this.usermgr.registerHook( 'after_update', this.afterUserChange.bind(this, 'user_update') );
		this.usermgr.registerHook( 'after_delete', this.afterUserChange.bind(this, 'user_delete') );
		this.usermgr.registerHook( 'after_login', this.afterUserLogin.bind(this) );
		
		// intercept user login and session resume, to merge in extra data
		this.usermgr.registerHook( 'before_login', this.beforeUserLogin.bind(this) );
		this.usermgr.registerHook( 'before_resume_session', this.beforeUserLogin.bind(this) );
		
		// monitor active jobs (for timeouts, etc.)
		this.server.on('minute', function() {
			// force gc 10s after the minute
			// (only if global.gc is exposed by node CLI arg)
			if (global.gc) {
				self.gcTimer = setTimeout( function() {
					delete self.gcTimer;
					self.logDebug(10, "Forcing garbage collection now", process.memoryUsage());
					global.gc();
					self.logDebug(10, "Garbage collection complete", process.memoryUsage());
				}, 10 * 1000 );
			}
		} );
		
		// archive logs daily at midnight
		this.server.on('day', function() {
			self.archiveLogs();
		} );
		
		// determine master server eligibility
		this.checkMasterEligibility( function() {
			// master mode (CLI option) -- force us to become master right away
			if (self.server.config.get('master') && self.multi.eligible) self.goMaster();
			
			// reset the failover counter
			self.multi.lastPingReceived = Tools.timeNow(true);
			
			// startup complete
			callback();
		} );
	},
	
	checkMasterEligibility: function(callback) {
		// determine master server eligibility
		var self = this;
		
		this.storage.listGet( 'global/servers', 0, 0, function(err, servers) {
			if (err) {
				// this may happen on slave servers that have no access to storage -- silently fail
				servers = [];
			}
			
			if (!Tools.findObject(servers, { hostname: self.server.hostname }) && !self.multi.cluster) {
				// we were not found in server list
				self.multi.eligible = false;
				if (!self.multi.slave) {
					self.logDebug(4, "Server not found in cluster -- waiting for a master server to contact us");
				}
				if (callback) callback();
				return;
			}
			
			// found server in cluster, good
			self.multi.cluster = true;
			
			// now check server groups
			self.storage.listGet( 'global/server_groups', 0, 0, function(err, groups) {
				if (err) {
					// this may happen on slave servers that have no access to storage -- silently fail
					groups = [];
				}
				
				// scan all master groups for our hostname
				var eligible = false;
				var group_title = '';
				
				for (var idx = 0, len = groups.length; idx < len; idx++) {
					var group = groups[idx];
					
					var regexp = null;
					try { regexp = new RegExp( group.regexp ); }
					catch (e) {
						self.logError('master', "Invalid group regular expression: " + group.regexp + ": " + e);
						regexp = null;
					}
					
					if (group.master && regexp && self.server.hostname.match(regexp)) {
						eligible = true;
						group_title = group.title;
						idx = len;
					}
				}
				
				if (eligible) {
					self.logDebug(4, "Server is eligible to become master (" + group_title + ")");
					self.multi.eligible = true;
				}
				else {
					self.logDebug(4, "Server is not eligible for master -- it will be a slave only");
					self.multi.eligible = false;
				}
				
				if (callback) callback();
				
			} ); // global/server_groups
		} ); // global/servers
	},
	
	tick: function() {
		// called every second
		var self = this;
		var now = Tools.timeNow(true);
		
		if (this.numSocketClients) {
			var status = {
				epoch: Tools.timeNow(),
				master: this.multi.master,
				master_hostname: this.multi.masterHostname
			};
			if (this.multi.master) {
				// web client connection to master
				// send additional information only needed by UI
				status.active_jobs = this.getAllActiveJobs(true);
				status.servers = this.getAllServers();
			}
			else {
				// we are a slave, so just send our own jobs and misc server health stats
				status.active_jobs = this.activeJobs;
				status.queue = this.internalQueue || {};
				status.data = this.multi.data;
				status.uptime = now - (this.server.started || now);
			}
			
			// this.io.emit( 'status', status );
			this.authSocketEmit( 'status', status );
		}
		
		// monitor master health
		if (!this.multi.master) {
			var delta = now - this.multi.lastPingReceived;
			if (delta >= this.server.config.get('master_ping_timeout')) {
				if (this.multi.eligible) this.masterFailover();
				else if (this.multi.slave) this.slaveFailover();
			}
		}
		
		// as master, broadcast pings every N seconds
		if (this.multi.master) {
			var delta = now - this.multi.lastPingSent;
			if (delta >= this.server.config.get('master_ping_freq')) {
				this.sendMasterPings();
				this.multi.lastPingSent = now;
			}
		}
		
		// monitor server resources every N seconds (or 1 min if no local jobs)
		var msr_freq = Tools.numKeys(this.activeJobs) ? (this.server.config.get('monitor_res_freq') || 10) : 60;
		if (!this.lastMSR || (now - this.lastMSR >= msr_freq)) {
			this.lastMSR = now;
			
			this.monitorServerResources( function(err) {
				// nicer to do this after gathering server resources
				self.monitorAllActiveJobs();
			} );
		}
		
		// auto-discovery broadcast pings
		this.discoveryTick();
	},
	
	authSocketEmit: function(key, data) {
		// Only emit to authenticated clients
		for (var id in this.sockets) {
			var socket = this.sockets[id];
			if (socket._pixl_auth) socket.emit( key, data );
		}
	},
	
	masterSocketEmit: function() {
		// Only emit to master server -- and make sure this succeeds
		// Internally queue upon failure
		var count = 0;
		var key = '';
		var data = null;
		
		if (arguments.length == 2) {
			key = arguments[0];
			data = arguments[1];
		}
		else if (arguments.length == 1) {
			key = arguments[0].key;
			data = arguments[0].data;
		}
		
		for (var id in this.sockets) {
			var socket = this.sockets[id];
			if (socket._pixl_master) {
				socket.emit( key, data );
				count++;
			}
		}
		
		if (!count) {
			// enqueue this for retry
			this.logDebug(8, "No master server socket connection available, will retry");
			this.enqueueInternal({
				action: 'masterSocketEmit',
				key: key,
				data: data,
				when: Tools.timeNow(true) + 10
			});
		}
	},
	
	updateClientData: function(name) {
		// broadcast global list update to all clients
		// name should be one of: plugins, categories, server_groups, schedule
		assert( name != 'users' );
		
		var self = this;
		this.storage.listGet( 'global/' + name, 0, 0, function(err, items) {
			if (err) {
				self.logError('storage', "Failed to fetch list: global/" + name + ": " + err);
				return;
			}
			var data = {};
			data[name] = items;
			// self.io.emit( 'update', data );
			self.authSocketEmit( 'update', data );
		} );
	},
	
	beforeUserLogin: function(args, callback) {
		// infuse data into user login client response
		var self = this;
		
		args.resp = {
			epoch: Tools.timeNow(),
			servers: this.getAllServers(),
			nearby: this.nearbyServers,
			activeJobs: this.getAllActiveJobs(true),
			eventQueue: this.eventQueue,
			state: this.state
		};
		
		// load essential data lists in parallel (these are, or will be, cached in RAM)
		async.each( ['schedule', 'categories', 'plugins', 'server_groups'], 
			function(name, callback) {
				self.storage.listGet( 'global/' + name, 0, 0, function(err, items) {
					args.resp[ name ] = items || [];
					callback();
				} );
			},
			callback
		); // each
	},
	
	afterUserLogin: function(args) {
		// log the login
		this.logActivity('user_login', { user: args.user }, args);
	},
	
	afterUserChange: function(action, args) {
		// user data has changed, notify all connected clients
		// Note: user data is not actually sent here -- this just triggers a client redraw if on the user list page
		// this.io.emit( 'update', { users: {} } );
		this.authSocketEmit( 'update', { users: {} } );
		
		// add to activity log in the background
		this.logActivity(action, { user: args.user }, args);
	},
	
	logActivity: function(action, orig_data, args) {
		// add event to activity logs async
		var self = this;
		if (!args) args = {};
		
		assert( Tools.isaHash(orig_data), "Must pass a data object to logActivity" );
		var data = Tools.copyHash( orig_data, true );
		
		// sanity check: make sure we are still master
		if (!this.multi.master) return;
		
		data.action = action;
		data.epoch = Tools.timeNow(true);
		
		if (args.ip) data.ip = args.ip;
		if (args.request) data.headers = args.request.headers;
		
		if (args.admin_user) data.username = args.admin_user.username;
		else if (args.user) {
			if (args.user.key) {
				// API Key
				data.api_key = args.user.key;
				data.api_title = args.user.title;
			}
			else {
				data.username = args.user.username;
			}
		}
		
		this.storage.enqueue( function(task, callback) {
			self.storage.listUnshift( 'logs/activity', data, callback );
		});
	},
	
	goMaster: function() {
		// we just became the master server
		var self = this;
		this.logDebug(3, "We are becoming the master server");
		
		this.multi.master = true;
		this.multi.slave = false;
		this.multi.cluster = true;
		this.multi.masterHostname = this.server.hostname;
		this.multi.lastPingSent = Tools.timeNow(true);
		
		// we need to know the server timezone at this point
		this.tz = jstz.determine().name();
		
		// only the master server should enable storage maintenance
		this.server.on(this.server.config.get('maintenance'), function() {
			self.storage.runMaintenance( new Date(), self.runMaintenance.bind(self) );
		});
		
		// only the master server should enable storage ram caching
		this.storage.config.set( 'cache_key_match', '^global/' );
		this.storage.prepConfig();
		
		// start server cluster management
		this.setupCluster();
		
		// start scheduler
		this.setupScheduler();
		
		// start queue monitor
		this.setupQueue();
		
		// clear daemon stats every day at midnight
		this.server.on('day', function() {
			self.state.stats = {};
		} );
		
		// easter egg, let's see if anyone notices
		this.server.on('year', function() {
			self.logDebug(1, "Happy New Year!");
		} );
		
		// log this event
		if (!this.server.debug) {
			this.logActivity( 'server_master', { hostname: this.server.hostname } );
		}
		
		// recover any leftover logs
		this.recoverJobLogs();
	},
	
	goSlave: function() {
		// we just became a slave server
		// recover any leftover logs
		this.logDebug(3, "We are becoming a slave server");
		
		this.multi.master = false;
		this.multi.slave = true;
		this.multi.cluster = true;
		
		// start queue monitor
		this.setupQueue();
		
		// recover any leftover logs
		this.recoverJobLogs();
	},
	
	masterFailover: function() {
		// No master ping recieved in N seconds, so we need to choose a new master
		var self = this;
		var servers = [];
		var groups = [];
		
		this.logDebug(3, "No master ping received within " + this.server.config.get('master_ping_timeout') + " seconds, choosing new master");
		
		// make sure tick() doesn't keep calling us
		this.multi.lastPingReceived = Tools.timeNow(true);
		
		async.series([
			function(callback) {
				self.storage.listGet( 'global/servers', 0, 0, function(err, items) {
					servers = items || [];
					callback(err);
				} );
			},
			function(callback) {
				self.storage.listGet( 'global/server_groups', 0, 0, function(err, items) {
					groups = items || [];
					callback(err);
				} );
			}
		], 
		function(err) {
			// all resources loaded
			if (err || !servers.length || !groups.length) {
				// should never happen
				self.logDebug(4, "No servers found, going into idle mode");
				self.multi.masterHostname = '';
				self.multi.master = self.multi.slave = self.multi.cluster = false;
				return;
			}
			
			// compile list of master server candidates
			var candidates = {};
			
			for (var idx = 0, len = groups.length; idx < len; idx++) {
				var group = groups[idx];
				if (group.master) {
					
					var regexp = null;
					try { regexp = new RegExp( group.regexp ); }
					catch (e) {
						self.logError('master', "Invalid group regular expression: " + group.regexp + ": " + e);
						regexp = null;
					}
					
					if (regexp) {
						for (var idy = 0, ley = servers.length; idy < ley; idy++) {
							var server = servers[idy];
							if (server.hostname.match(regexp)) {
								candidates[ server.hostname ] = server;
							}
						} // foreach server
					}
				} // master group
			} // foreach group
			
			// sanity check: we better be in the list
			if (!candidates[ self.server.hostname ]) {
				self.logDebug(4, "We are no longer eligible for master, going into idle mode");
				self.multi.masterHostname = '';
				self.multi.master = self.multi.slave = self.multi.cluster = false;
				return;
			}
			
			// sort hostnames alphabetically to determine rank
			var hostnames = Object.keys(candidates).sort();
			
			if (!hostnames.length) {
				// should never happen
				self.logDebug(4, "No eligible servers found, going into idle mode");
				self.multi.masterHostname = '';
				self.multi.master = self.multi.slave = self.multi.cluster = false;
				return;
			}
			
			// see if any servers are 'above' us in rank
			var rank = hostnames.indexOf( self.server.hostname );
			if (rank == 0) {
				// we are the top candidate, so become master immediately
				self.logDebug(5, "We are the top candidate for master");
				self.goMaster();
				return;
			}
			
			// ping all servers higher than us to see if any of them are alive
			var superiors = hostnames.splice( 0, rank );
			var alive = [];
			self.logDebug(6, "We are rank #" + rank + " for master, pinging superiors", superiors);
			
			async.each( superiors, 
				function(hostname, callback) {
					var server = candidates[hostname];
					
					var api_url = self.getServerBaseAPIURL( hostname, server.ip ) + '/app/ping';
					self.logDebug(10, "Sending API request to remote server: " + hostname + ": " + api_url);
					
					// send request
					self.request.json( api_url, {}, { timeout: 5 * 1000 }, function(err, resp, data) {
						if (err) {
							self.logDebug(10, "Failed to contact server: " + hostname + ": " + err );
							return callback();
						}
						if (resp.statusCode != 200) {
							self.logDebug(10, "Failed to contact server: " + hostname + ": HTTP " + resp.statusCode + " " + resp.statusMessage);
							return callback();
						}
						if (data.code != 0) {
							self.logDebug(10, "Failed to ping server: " + hostname + ": " + data.description);
							return callback();
						}
						
						// success, at least one superior ponged our ping
						// relinquish command to them
						self.logDebug(10, "Successfully pinged server: " + hostname);
						alive.push( hostname );
						callback();
					} );
				},
				function() {
					if (alive.length) {
						self.logDebug(6, alive.length + " servers ranked above us are alive, so we will become a slave", alive);
					}
					else {
						self.logDebug(5, "No other servers ranked above us are alive, so we are the top candidate for master");
						self.goMaster();
					}
				} // pings complete
			); // async.each
		} ); // got servers and groups
	},
	
	slaveFailover: function() {
		// remove ourselves from slave duty, and go into idle mode
		if (this.multi.slave) {
			this.logDebug(3, "No master ping received within " + this.server.config.get('master_ping_timeout') + " seconds, going idle");
			this.multi.masterHostname = '';
			this.multi.master = this.multi.slave = this.multi.cluster = false;
			this.lastDiscoveryBroadcast = 0;
		}
	},
	
	masterConflict: function(slave) {
		// should never happen: a slave has become master
		// we must shut down right away if this happens
		var err_msg = "MASTER CONFLICT: The server '"+slave.hostname+"' is also a master server. Shutting down immediately.";
		this.logDebug(1, err_msg);
		this.logError('multi', err_msg);
		this.server.shutdown();
	},
	
	isProcessRunning: function(pid) {
		// check if process is running or not
		var ping = false;
		try { ping = process.kill( pid, 0 ); }
		catch (e) {;}
		return ping;
	},
	
	recoverJobLogs: function() {
		// upload any leftover job logs (after unclean shutdown)
		var self = this;
		
		// don't run this if shutting down
		if (this.server.shut) return;
		
		// make sure this ONLY runs once
		if (this.recoveredJobLogs) return;
		this.recoveredJobLogs = true;
		
		// look for any leftover job JSON files (master server shutdown)
		var job_spec = this.server.config.get('log_dir') + '/jobs/*.json';
		this.logDebug(4, "Looking for leftover job JSON files: " + job_spec);
		
		glob(job_spec, {}, function (err, files) {
			// got job json files
			if (!files) files = [];
			async.eachSeries( files, function(file, callback) {
				// foreach job file
				if (file.match(/\/(\w+)(\-detached)?\.json$/)) {
					var job_id = RegExp.$1;
					
					fs.readFile( file, { encoding: 'utf8' }, function(err, data) {
						var job = null;
						try { job = JSON.parse(data); } catch (e) {;}
						if (job) {
							self.logDebug(5, "Recovering job data: " + job_id + ": " + file, job);
							
							if (job.detached && job.pid && self.isProcessRunning(job.pid)) {
								// detached job is still running, resume it!
								self.logDebug(5, "Detached PID " + job.pid + " is still alive, resuming job as if nothing happened");
								self.activeJobs[ job_id ] = job;
								self.kids[ job.pid ] = { pid: job.pid };
								return callback();
							}
							else if (job.detached && fs.existsSync(self.server.config.get('queue_dir') + '/' + job_id + '-complete.json')) {
								// detached job completed while service was stopped
								// Note: Bit of a possible race condition here, as setupQueue() runs in parallel, and 'minute' event may fire
								self.logDebug(5, "Detached job " + job_id + " completed on its own, skipping recovery (queue will pick it up)");
								
								// disable job timeout, to prevent race condition with monitorAllActiveJobs()
								job.timeout = 0;
								
								self.activeJobs[ job_id ] = job;
								self.kids[ job.pid ] = { pid: job.pid };
								return callback();
							}
							else {
								// job died when server went down
								job.complete = 1;
								job.code = 1;
								job.description = "Aborted Job: Server '" + self.server.hostname + "' shut down unexpectedly.";
								self.logDebug(6, job.description);
								
								if (self.multi.master) {
									// we're master, finish the job locally
									self.finishJob(job);
								} // master
								else {
									// we're a slave, signal master to finish job via websockets
									self.io.emit('finish_job', job);
								} // slave
							} // standard job
						}
						
						fs.unlink( file, function(err) {
							// ignore error, file may not exist
							callback();
						} );
					} ); // fs.readFile
				} // found id
				else callback();
			}, 
			function(err) {
				// done with glob eachSeries
				self.logDebug(9, "Job recovery complete");
				
				var log_spec = self.server.config.get('log_dir') + '/jobs/*.log';
				self.logDebug(4, "Looking for leftover job logs: " + log_spec);
				
				// look for leftover log files
				glob(log_spec, {}, function (err, files) {
					// got log files
					if (!files) files = [];
					async.eachSeries( files, function(file, callback) {
						// foreach log file
						if (file.match(/\/(\w+)(\-detached)?\.log$/)) {
							var job_id = RegExp.$1;
							
							// only recover logs for dead jobs
							if (!self.activeJobs[job_id]) {
								self.logDebug(5, "Recovering job log: " + job_id + ": " + file);
								self.uploadJobLog( { id: job_id, log_file: file, hostname: self.server.hostname }, callback );
							}
							else callback();
						} // found id
						else callback();
					}, 
					function(err) {
						// done with glob eachSeries
						self.logDebug(9, "Log recovery complete");
						
						// cleanup old log .tmp files, which may have failed during old archive/rotation
						glob(self.server.config.get('log_dir') + '/jobs/*.tmp', {}, function (err, files) {
							if (!files || !files.length) return;
							async.eachSeries( files, function(file, callback) { fs.unlink(file, callback); } );
						}); // glob
					} );
				} ); // glob
			} ); // eachSeries
		} ); // glob
	},
	
	runMaintenance: function(callback) {
		// run routine daily tasks, called after storage maint completes.
		// make sure our activity logs haven't grown beyond the max limit
		var self = this;
		var max_rows = this.server.config.get('list_row_max') || 0;
		if (!max_rows) return;
		
		// sanity check: make sure we are still master
		if (!this.multi.master) return;
		
		// don't run this if shutting down
		if (this.server.shut) return;
		
		var list_paths = ['logs/activity', 'logs/completed'];
		
		this.storage.listGet( 'global/schedule', 0, 0, function(err, items) {
			if (err) {
				self.logError('maint', "Failed to fetch list: global/schedule: " + err);
				return;
			}
			
			for (var idx = 0, len = items.length; idx < len; idx++) {
				list_paths.push( 'logs/events/' + items[idx].id );
			}
			
			async.eachSeries( list_paths, 
				function(list_path, callback) {
					// iterator function, work on single list
					self.storage.listGetInfo( list_path, function(err, info) {
						// list may not exist, skip if so
						if (err) return callback();
						
						// check list length
						if (info.length > max_rows) {
							// list has grown too long, needs a trim
							self.logDebug(3, "List " + list_path + " has grown too long, trimming to max: " + max_rows, info);
							// self.storage.listSplice( list_path, max_rows, info.length - max_rows, null, callback );
							self.listRoughChop( list_path, max_rows, callback );
						}
						else {
							// no trim needed, proceed to next list
							callback();
						}
					} ); // get list info
				}, // iterator
				function(err) {
					if (err) {
						self.logError('maint', "Failed to trim lists: " + err);
					}
					
					// done with maint
					if (callback) callback();
					
				} // complete
			); // eachSeries
		} ); // schedule loaded
		
		// sanity state cleanup: flagged jobs
		if (this.state.flagged_jobs && Tools.numKeys(this.state.flagged_jobs)) {
			var all_jobs = this.getAllActiveJobs();
			for (var id in this.state.flagged_jobs) {
				if (!all_jobs[id]) delete this.state.flagged_jobs[id];
			}
		}
	},
	
	listRoughChop: function(list_path, max_rows, callback) {
		// Roughly chop the end of a list to get the size down to under specified ceiling.
		// This is not exact, and will likely be off by up to one 'page_size' of items.
		// The idea here is to chop without using tons of memory like listSplice does.
		var self = this;
		this.logDebug(4, "Roughly chopping list: " + list_path + " down to max: " + max_rows);
		
		self.storage._listLock( list_path, true, function() {
			// list is now locked, we can work on it safely
			
			self.storage.listGetInfo( list_path, function(err, list) {
				// check for error
				if (err) {
					self.logError('maint', "Failed to load list header: " + list_path + ": " + err);
					self.storage._listUnlock( list_path );
					return callback();
				}
				
				// begin chop loop
				async.whilst(
					function() {
						// keep chopping while list is too long
						return( list.length > max_rows ); 
					},
					function(callback) {
						// load last page
						self.storage._listLoadPage( list_path, list.last_page, false, function(err, page) {
							if (err) {
								// this should never happen, and is bad
								// (list is probably corrupted, and should be deleted and recreated)
								return callback( new Error("Failed to load list page: " + list_path + "/" + list.last_page + ": " + err) );
							}
							if (!page) page = { items: [] };
							if (!page.items) page.items = [];
							
							list.length -= page.items.length;
							
							self.logDebug(5, "Deleting list page: " + list_path + "/" + list.last_page + " (" + page.items.length + " items)");
							
							self.storage.delete( list_path + "/" + list.last_page, function(err) {
								if (err) {
									// log error but don't fail entire op
									self.logError('maint', "Failed to delete list page: " + list_path + "/" + list.last_page + ": " + err);
								}
								
								list.last_page--;
								callback();
								
							} ); // delete page
						} ); // _listLoadPage
					},
					function(err) {
						// all done
						if (err) {
							self.logError('maint', err.toString() );
							self.storage._listUnlock( list_path );
							return callback();
						}
						
						// update list header with new length and last_page
						self.storage.put( list_path, list, function(err) {
							if (err) {
								self.logError('maint', "Failed to update list header: " + list_path + ": " + err);
							}
							
							// unlock list
							self.storage._listUnlock( list_path );
							
							self.logDebug(4, "List chop complete: " + list_path + ", new size: " + list.length, list);
							
							// and we're done
							callback();
							
						} ); // put
					} // done
				); // whilst
			}); // listGetInfo
		} ); // listLock
	},
	
	archiveLogs: function() {
		// archive all logs (called once daily)
		var self = this;
		var src_spec = this.server.config.get('log_dir') + '/*.log';
		var dest_path = this.server.config.get('log_archive_path');
		
		if (dest_path) {
			this.logDebug(4, "Archiving logs: " + src_spec + " to: " + dest_path);
			// generate time label from previous day, so just subtracting 30 minutes to be safe
			var epoch = Tools.timeNow(true) - 1800;
			
			this.logger.archive(src_spec, dest_path, epoch, function(err) {
				if (err) self.logError('maint', "Failed to archive logs: " + err);
				else self.logDebug(4, "Log archival complete");
			});
		}
	},
	
	deleteExpiredJobData: function(key, data, callback) {
		// delete both job data and job log
		// called from storage maintenance system for 'cronicle_job' record types
		var self = this;
		var log_key = key + '/log.txt.gz';
		
		this.logDebug(6, "Deleting expired job data: " + key);
		this.storage.delete( key, function(err) {
			if (err) self.logError('maint', "Failed to delete expired job data: " + key + ": " + err);
			
			self.logDebug(6, "Deleting expired job log: " + log_key);
			self.storage.delete( log_key, function(err) {
				if (err) self.logError('maint', "Failed to delete expired job log: " + log_key + ": " + err);
				
				callback();
			} ); // delete
		} ); // delete
	},
	
	_uniqueIDCounter: 0,
	getUniqueID: function(prefix) {
		// generate unique id using high-res server time, and a static counter,
		// both converted to alphanumeric lower-case (base-36), ends up being ~10 chars.
		// allows for *up to* 1,296 unique ids per millisecond (sort of).
		this._uniqueIDCounter++;
		if (this._uniqueIDCounter >= Math.pow(36, 2)) this._uniqueIDCounter = 0;
		
		return [
			prefix,
			Tools.zeroPad( (new Date()).getTime().toString(36), 8 ),
			Tools.zeroPad( this._uniqueIDCounter.toString(36), 2 )
		].join('');		
	},
	
	corsPreflight: function(args, callback) {
		// handler for HTTP OPTIONS calls (CORS AJAX preflight)
		callback( "200 OK", 
			{
				'Access-Control-Allow-Origin': args.request.headers['origin'] || "*",
				'Access-Control-Allow-Methods': "POST, GET, HEAD, OPTIONS",
				'Access-Control-Allow-Headers': args.request.headers['access-control-request-headers'] || "*",
				'Access-Control-Max-Age': "1728000",
				'Content-Length': "0"
			},
			null
		);
	},
	
	logError: function(code, msg, data) {
		// proxy request to system logger with correct component
		this.logger.set( 'component', 'Error' );
		this.logger.error( code, msg, data );
	},
	
	logTransaction: function(code, msg, data) {
		// proxy request to system logger with correct component
		this.logger.set( 'component', 'Transaction' );
		this.logger.transaction( code, msg, data );
	},
	
	shutdown: function(callback) {
		// shutdown api service
		var self = this;
		
		this.logDebug(2, "Shutting down Cronicle");
		this.abortAllLocalJobs();
		this.shutdownCluster();
		this.shutdownScheduler( function() {
			
			self.shutdownQueue();
			self.shutdownDiscovery();
			
			if (self.gcTimer) {
				clearTimeout( self.gcTimer );
				delete self.gcTimer;
			}
			
			// wait for all non-detached local jobs to complete before continuing shutdown
			var count = 0;
			var ids = [];
			var first = true;
			
			async.whilst(
				function () {
					count = 0;
					ids = [];
					for (var id in self.activeJobs) {
						var job = self.activeJobs[id];
						if (!job.detached) { count++; ids.push(id); }
					}
					return (count > 0);
				},
				function (callback) {
					if (first) {
						self.logDebug(3, "Waiting for " + count + " active jobs to complete", ids);
						first = false;
					}
					setTimeout( function() { callback(); }, 250 );
				},
				function() {
					// all non-detached local jobs complete
					callback();
				}
			); // whilst
			
		} ); // shutdownScheduler
	},
	
	emergencyShutdown: function(err) {
		// perform emergency shutdown due to uncaught exception
		this.logger.set('sync', true);
		this.logError('crash', "Emergency Shutdown: " + err);
		this.abortAllLocalJobs();
	}
	
});
