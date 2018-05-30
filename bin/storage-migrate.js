#!/usr/bin/env node

// Cronicle Storage Migration System
// Copyright (c) 2018 Joseph Huckaby
// Released under the MIT License

// Instructions:
// Edit your Cronicle conf/config.json file, and make a copy of the `Storage` element.
// Name the copy `NewStorage`, and put all the new settings in there, that you are migrating to.

// Command-Line Usage:
// 	bin/storage-migrate.js
//		--debug: Echo debug log to console
//		--verbose: List every key as it is copied
//		--dryrun: Do not write any changes

// After completion, delete `Storage`, and rename `NewStorage` to `Storage`, and you're migrated.

var Path = require('path');
var os = require('os');
var fs = require('fs');
var async = require('async');
var Logger = require('pixl-logger');
var cli = require('pixl-cli');
var args = cli.args;
cli.global();

var StandaloneStorage = require('pixl-server-storage/standalone');

// chdir to the proper server root dir
process.chdir( Path.dirname( __dirname ) );

// load app's config file
var config = require('../conf/config.json');

var StorageMigrator = {
	
	version: "1.0.0",
	
	run: function() {
		// here we go
		var self = this;
		
		// setup logger
		var log_file = Path.join( config.log_dir, 'StorageMigration.log' );
		this.logger = new Logger( log_file, config.log_columns, {
			debugLevel: config.debug_level,
			sync: true,
			echo: args.debug,
			color: args.color
		} );
		
		print("\n");
		this.logPrint(1, "Cronicle Storage Migration Script v" + this.version + " starting up");
		this.logPrint(2, "Starting storage engines");
		
		if (!config.Storage) this.fatal("Your Cronicle configuration lacks a 'Storage' property");
		if (!config.NewStorage) this.fatal("Your Cronicle configuration lacks a 'NewStorage' property.");
		
		if (config.uid && (process.getuid() != 0)) {
			this.fatal( "Must be root to use the storage migration script." );
		}
		
		// check pid file
		if (config.pid_file) try {
			var pid = fs.readFileSync( config.pid_file, 'utf8' );
			if (pid && process.kill(pid, 0)) this.fatal("Please shut down Cronicle before migrating storage.");
		}
		catch (e) {;}
		
		// massage config, override logger
		config.Storage.logger = self.logger;
		config.Storage.log_event_types = { all: 1 };
		
		config.NewStorage.logger = self.logger;
		config.NewStorage.log_event_types = { all: 1 };
		
		// start both standalone storage instances
		async.series(
			[
				function(callback) {
					self.oldStorage = new StandaloneStorage(config.Storage, callback);
				},
				function(callback) {
					self.newStorage = new StandaloneStorage(config.NewStorage, callback);
				},
			],
			function(err) {
				if (err) self.fatal("Failed to start storage engine: " + err);
				
				self.logPrint(2, "Storage engines are ready to go");
				
				// become correct user
				if (config.uid && (process.getuid() == 0)) {
					self.logPrint( 3, "Switching to user: " + config.uid );
					process.setuid( config.uid );
				}
				
				self.testStorage();
			}
		); // series
	},
	
	testStorage: function() {
		// test both old and new storage
		var self = this;
		this.logDebug(3, "Testing storage engines");
		
		async.series(
			[
				function(callback) {
					self.oldStorage.get('global/users', callback);
				},
				function(callback) {
					self.newStorage.put('test/test1', { "foo1": "bar1" }, function(err) {
						if (err) return callback(err);
						
						self.newStorage.delete('test/test1', function(err) {
							if (err) return callback(err);
							
							callback();
						});
					});
				},
			],
			function(err) {
				if (err) self.fatal("Storage test failure: " + err);
				
				self.logPrint(2, "Storage engines tested successfully");
				self.startMigration();
			}
		); // series
	},
	
	startMigration: function() {
		// start migration process
		var self = this;
		this.logPrint(3, "Starting migration");
		
		this.timeStart = Tools.timeNow(true);
		this.numRecords = 0;
		
		this.copyKey( 'global/state', { ignore: true } );
		
		var lists = [
			'global/users',
			'global/plugins',
			'global/categories',
			'global/server_groups',
			'global/schedule',
			'global/servers',
			'global/api_keys'
		];
		lists.forEach( function(key) { self.copyList(key); } );
		
		// these lists technically may not exist yet:
		this.copyList( 'logs/completed', { ignore: true } );
		this.copyList( 'logs/activity', { ignore: true } );
		
		this.migrateUsers();
	},
	
	migrateUsers: function() {
		var self = this;
		this.logPrint(3, "Migrating user records");
		
		this.oldStorage.listEach( 'global/users',
			function(user, idx, callback) {
				var username = self.normalizeUsername(user.username);
				var key = 'users/' + username;
				self.copyKey( key );
				process.nextTick( callback );
			},
			function() {
				self.migrateCompletedEvents();
			}
		); // listEach
	},
	
	migrateCompletedEvents: function() {
		var self = this;
		this.logPrint(3, "Migrating completed events");
		
		this.oldStorage.listEach( 'global/schedule',
			function(event, idx, callback) {
				var key = 'logs/events/' + event.id;
				self.copyList( key, { ignore: true } );
				process.nextTick( callback );
			},
			function() {
				self.migrateCompletedJobs();
			}
		); // listEach
	},
	
	migrateCompletedJobs: function() {
		var self = this;
		this.logPrint(3, "Migrating completed jobs");
		
		var unique_cleanup_lists = {};
		
		this.oldStorage.listEach( 'logs/completed',
			function(job, idx, callback) {
				self.copyKey( 'jobs/' + job.id, { ignore: true } );
				self.copyKey( 'jobs/' + job.id + '/log.txt.gz', { ignore: true } );
				
				var time_end = job.time_start + job.elapsed;
				var key_expires = time_end + (86400 * config.job_data_expire_days);
				var log_expires = time_end + (86400 * (job.log_expire_days || config.job_data_expire_days));
				
				// get hash of unique exp dates, to grab cleanup lists
				var dargs = Tools.getDateArgs( key_expires );
				var cleanup_list_path = '_cleanup/' + dargs.yyyy + '/' + dargs.mm + '/' + dargs.dd;
				unique_cleanup_lists[ cleanup_list_path ] = true;
				
				dargs = Tools.getDateArgs( log_expires );
				cleanup_list_path = '_cleanup/' + dargs.yyyy + '/' + dargs.mm + '/' + dargs.dd;
				unique_cleanup_lists[ cleanup_list_path ] = true;
				
				process.nextTick( callback );
			},
			function() {
				// now queue up list copies for cleanup lists
				self.logPrint(3, "Migrating cleanup lists");
				
				for (var key in unique_cleanup_lists) {
					self.copyList( key, { ignore: true } );
				}
				
				// Note: we are deliberately skipping the cleanup master hash, e.g. _cleanup/expires
				// This is only needed for records that CHANGE their expiration after the fact,
				// which never happens with Cronicle.
				
				self.waitForQueue();
			}
		); // listEach
	},
	
	waitForQueue: function() {
		// wait for storage to complete queue
		var self = this;
		this.logPrint(3, "Waiting for storage queue");
		
		this.queueMax = this.newStorage.queue.length();
		this.logDebug(5, "Queue length: " + this.queueMax);
		
		if (!args.verbose && !args.debug && !args.dryrun && !args.dots) {
			cli.progress.start({ max: this.queueMax });
		}
		
		this.newStorage.waitForQueueDrain( this.finish.bind(this) );
	},
	
	finish: function() {
		// all done
		var self = this;
		var elapsed = Tools.timeNow(true) - this.timeStart;
		
		cli.progress.end();
		
		print("\n");
		this.logPrint(1, "Storage migration complete!");
		this.logPrint(2, Tools.commify(this.numRecords) + " total records copied in " + Tools.getTextFromSeconds(elapsed, false, true) + ".");
		this.logPrint(4, "You should now overwrite 'Storage' with 'NewStorage' in your config.json.");
		this.logPrint(3, "Shutting down");
		
		async.series(
			[
				function(callback) {
					self.oldStorage.shutdown(callback);
				},
				function(callback) {
					self.newStorage.shutdown(callback);
				},
			],
			function(err) {
				self.logPrint(3, "Shutdown complete, exiting.");
				print("\n");
				process.exit(0);
			}
		); // series
	},
	
	normalizeUsername: function(username) {
		// lower-case, strip all non-alpha
		if (!username) return '';
		return username.toString().toLowerCase().replace(/\W+/g, '');
	},
	
	copyKey: function(key, opts) {
		// enqueue key for copy
		this.logDebug(9, "Enqueuing key for copy: " + key, opts);
		
		this.newStorage.enqueue( Tools.mergeHashes({
			action: 'custom',
			copy_type: 'key',
			copy_key: key,
			handler: this.dequeue.bind(this)
		}, opts || {} ));
	},
	
	copyList: function(key, opts) {
		// enqueue list for copy
		this.logDebug(9, "Enqueuing list for copy: " + key, opts);
		
		this.newStorage.enqueue( Tools.mergeHashes({
			action: 'custom',
			copy_type: 'list',
			copy_key: key,
			handler: this.dequeue.bind(this)
		}, opts || {} ));
	},
	
	dequeue: function(task, callback) {
		// copy list or key
		var self = this;
		var key = task.copy_key;
		
		switch (task.copy_type) {
			case 'list':
				// copy whole list
				this.oldStorage.get(key, function(err, list) {
					if (err) {
						if (task.ignore) return callback();
						self.fatal("Failed to get list: " + key + ": " + err);
					}
					
					self.copyKey( key ); // list header
					
					for (var page_idx = list.first_page; page_idx <= list.last_page; page_idx++) {
						self.copyKey( key + '/' + page_idx );
					}
					
					callback();
				});
			break;
			
			default:
				// copy record
				if (this.newStorage.isBinaryKey(key)) {
					// binary record, use streams
					this.oldStorage.getStream(key, function(err, stream) {
						if (err) {
							if (task.ignore) return callback();
							self.fatal("Failed to getStream key: " + key + ": " + err);
						}
						
						if (args.dryrun) {
							stream.on('end', function() {
								verbose("DRY RUN: Copied binary record: " + key + "\n");
								self.numRecords++;
								callback();
							});
							stream.resume();
							return;
						}
						
						self.newStorage.putStream(key, stream, function(err) {
							if (err) {
								if (task.ignore) return callback();
								self.fatal("Failed to putStream key: " + key + ": " + err);
							}
							
							verbose("Copied binary record: " + key + "\n");
							if (args.dots) print(".");
							self.numRecords++;
							
							if (self.queueMax) {
								var queueCurrent = self.newStorage.queue.length();
								cli.progress.update( self.queueMax - queueCurrent );
							}
							
							callback();
						}); // putStream
					} ); // getStream
				}
				else {
					// standard JSON record
					this.oldStorage.get(key, function(err, data) {
						if (err) {
							if (task.ignore) return callback();
							self.fatal("Failed to get key: " + key + ": " + err);
						}
						
						if (args.dryrun) {
							verbose("DRY RUN: Copied record: " + key + "\n");
							self.numRecords++;
							return callback();
						}
						
						self.newStorage.put(key, data, function(err) {
							if (err) {
								if (task.ignore) return callback();
								self.fatal("Failed to put key: " + key + ": " + err);
							}
							
							verbose("Copied record: " + key + "\n");
							if (args.dots) print(".");
							self.numRecords++;
							
							if (self.queueMax) {
								var queueCurrent = self.newStorage.queue.length();
								cli.progress.update( self.queueMax - queueCurrent );
							}
							
							callback();
						}); // put
					} ); // get
				}
			break;
		} // switch copy_type
	},
	
	logDebug: function(level, msg, data) {
		this.logger.debug( level, msg, data );
	},
	
	logPrint: function(level, msg, data) {
		// echo message to console and log it
		switch (level) {
			case 1: print( bold.yellow(msg) + "\n" ); break;
			case 2: print( cyan(msg) + "\n" ); break;
			case 3: print( green(msg) + "\n" ); break;
			case 4: print( magenta(msg) + "\n" ); break;
			case 9: print( gray(msg) + "\n" ); break;
			default: print( msg + "\n" ); break;
		}
		if (data) print( gray( JSON.stringify(data) ) + "\n" );
		this.logger.debug( level, msg, data );
	},
	
	fatal: function(msg) {
		// log fatal error and die
		this.logger.error('fatal', msg);
		die( "\n" + bold.red("ERROR: ") + bold(msg) + "\n\n" );
	}
	
};

StorageMigrator.run();
