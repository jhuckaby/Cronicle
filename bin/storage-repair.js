#!/usr/bin/env node

// Cronicle Storage Repair Script
// Copyright (c) 2023 Joseph Huckaby
// Released under the MIT License

// Command-Line Usage: bin/storage-migrate.js
//		--echo: Echo debug log to console
//		--dryrun: Do not write any changes

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

// CLI arg aliases
args.dry = args.dry || args.dryrun || args.dry_run || false;

var StorageDoctor = {
	
	version: "1.0.0",
	
	run: function() {
		// here we go
		var self = this;
		
		// setup logger
		var log_file = this.log_file = Path.join( config.log_dir, 'StorageRepair.log' );
		this.logger = new Logger( log_file, config.log_columns, {
			debugLevel: 9,
			sync: true,
			echo: args.echo,
			color: args.color
		} );
		
		print("\n");
		this.logPrint(1, "Cronicle Storage Repair Script v" + this.version + " starting up");
		this.logPrint(2, "Starting storage engine");
		
		if (!config.Storage) this.fatal("Your Cronicle configuration lacks a 'Storage' property");
		
		if (config.uid && (process.getuid() != 0)) {
			this.fatal( "Must be root to use the storage repair script." );
		}
		
		// check pid file
		if (config.pid_file) try {
			var pid = fs.readFileSync( config.pid_file, 'utf8' );
			if (pid && process.kill(pid, 0)) this.fatal("Please shut down Cronicle before repairing storage.");
		}
		catch (e) {;}
		
		// massage config, override logger
		config.Storage.logger = self.logger;
		config.Storage.log_event_types = { all: 1 };
		config.Storage.concurrency = 1;
		config.Storage.transactions = false;
		
		// start storage system
		this.storage = new StandaloneStorage(config.Storage, function(err) {
			if (err) self.fatal("Failed to start storage engine: " + err);
			
			self.logPrint(2, "Storage engine is ready to go");
			
			// become correct user
			if (config.uid && (process.getuid() == 0)) {
				self.logPrint( 3, "Switching to user: " + config.uid );
				process.setuid( config.uid );
			}
			
			self.testStorage();
		});
	},
	
	testStorage: function() {
		// test storage
		var self = this;
		this.logDebug(3, "Testing storage engine");
		
		async.series(
			[
				function(callback) {
					self.storage.get('global/users', callback);
				},
				function(callback) {
					self.storage.put('test/test1', { "foo1": "bar1" }, function(err) {
						if (err) return callback(err);
						
						self.storage.delete('test/test1', function(err) {
							if (err) return callback(err);
							
							callback();
						});
					});
				},
			],
			function(err) {
				if (err) self.fatal("Storage test failure: " + err);
				
				self.logPrint(2, "Storage engine tested successfully");
				self.startRepair();
			}
		); // series
	},
	
	startRepair: function() {
		// start repair process
		var self = this;
		this.logPrint(3, "Starting repair");
		
		this.timeStart = Tools.timeNow(true);
		this.numRepairs = 0;
		
		var lists = [
			'global/users',
			'global/plugins',
			'global/categories',
			'global/server_groups',
			'global/schedule',
			'global/servers',
			'global/api_keys'
		];
		lists.forEach( function(key) { self.enqueueList(key); } );
		
		// these lists technically may not exist yet:
		this.enqueueList( 'logs/completed', { ignore: true } );
		this.enqueueList( 'logs/activity', { ignore: true } );
		
		this.repairCompletedEvents();
	},
	
	repairCompletedEvents: function() {
		var self = this;
		this.logPrint(3, "Repairing completed events");
		
		this.storage.listEach( 'global/schedule',
			function(event, idx, callback) {
				var key = 'logs/events/' + event.id;
				self.enqueueList( key, { ignore: true } );
				process.nextTick( callback );
			},
			function() {
				self.repairCompletedJobs();
			}
		); // listEach
	},
	
	repairCompletedJobs: function() {
		var self = this;
		this.logPrint(3, "Repairing completed jobs");
		
		var unique_cleanup_lists = {};
		
		this.storage.listEach( 'logs/completed',
			function(job, idx, callback) {
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
				self.logPrint(3, "Repairing cleanup lists");
				
				for (var key in unique_cleanup_lists) {
					self.enqueueList( key, { ignore: true } );
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
		
		this.queueMax = this.storage.queue.length();
		this.logDebug(5, "Queue length: " + this.queueMax);
		
		this.storage.waitForQueueDrain( this.finish.bind(this) );
	},
	
	finish: function() {
		// all done
		var self = this;
		var elapsed = Tools.timeNow(true) - this.timeStart;
		
		print("\n");
		if (!args.dry) {
			this.logPrint(1, "Storage repair complete!");
			this.logPrint(2, Tools.commify(this.numRepairs) + " repairs made, in " + Tools.getTextFromSeconds(elapsed, false, true) + ".");
		}
		else {
			this.logPrint(1, "Dry-run complete!");
			this.logPrint(2, Tools.commify(this.numRepairs) + " repairs are needed.");
		}
		this.logPrint(4, "See " + this.log_file	+ " for full details.");
		this.logPrint(3, "Shutting down");
		
		this.storage.shutdown( function() {
			self.logPrint(3, "Shutdown complete, exiting.");
			print("\n");
			process.exit(0);
		} );
	},
	
	enqueueList: function(key, opts) {
		// enqueue list for repair
		this.logDebug(9, "Enqueuing list for repair: " + key, opts);
		
		this.storage.enqueue( Tools.mergeHashes({
			action: 'custom',
			record_type: 'list',
			record_key: key,
			handler: this.dequeue.bind(this)
		}, opts || {} ));
	},
	
	dequeue: function(task, callback) {
		// repair list
		var self = this;
		var key = task.record_key;
		var need_rebuild = false;
		var list = null;
		var total_items = 0;
		
		this.logPrint(3, "Checking list integrity: " + key);
		
		// first, determine if we need to rebuild the list
		async.series([
			function(callback) {
				self.storage.get(key, function(err, data) {
					if (err) {
						if ((err.code == 'NoSuchKey') && task.ignore) {
							// list doesn't exist but ignore is set, so return success (no repair needed)
							return callback("STOP");
						}
						if (task.ignore) {
							// some other error besides NoSuchKey, but ignore is set, so we have to delete the list header
							self.logPrint(1, "ERROR: Failed to load list head: " + key + ": " + err + ": Deleting list head (non-essential)");
							
							if (!args.dry) self.storage.delete( key, function(err) { self.numRepairs++; callback("STOP"); } );
							else callback("STOP");
							
							return;
						}
						else {
							// list head error, but list is essential -- must create new list
							self.logPrint(1, "ERROR: Failed to load list head: " + key + ": " + err + ": Recreating empty list");
							
							if (!args.dry) self.storage.listCreate( key, {}, function(err) { self.numRepairs++; callback("STOP"); } );
							else callback("STOP");
							
							return;
						}
					} // err
					
					list = task.list = data;
					callback();
				});
			},
			function(callback) {
				// iterate over list pages
				var page_idx = list.first_page;
				
				async.whilst(
					function() { 
						return (page_idx <= list.last_page) && !need_rebuild; 
					},
					function(callback) {
						// check each page
						self.storage.get( key + '/' + page_idx, function(err, data) {
							if (err) {
								self.logPrint(1, "ERROR: Failed to load list page: " + key + '/' + page_idx + ": " + err);
								need_rebuild = true;
								return callback(err);
							}
							if (data.type != 'list_page') {
								self.logPrint(1, "ERROR: Failed to load list page: " + key + '/' + page_idx + ": Record has incorrect type: " + data.type);
								need_rebuild = true;
								return callback("BAD");
							}
							if (!data.items) {
								self.logPrint(1, "ERROR: Failed to load list page: " + key + '/' + page_idx + ": Record has no items array");
								need_rebuild = true;
								return callback("BAD");
							}
							if ((page_idx > list.first_page) && (page_idx < list.last_page) && (data.items.length != list.page_size)) {
								self.logPrint(1, "ERROR: Inner list page has incorrect number of items: " + key + '/' + page_idx, {
									length: data.items.length,
									page_size: list.page_size
								});
								need_rebuild = true;
								return callback("BAD");
							}
							
							total_items += data.items.length;
							page_idx++;
							return callback();
						} ); // get
					},
					function(err) {
						// all pages checked
						if (!need_rebuild && (total_items != list.length)) {
							self.logPrint(1, "ERROR: List has incorrect number of items: " + key, {
								length: list.length,
								total_items: total_items
							});
							need_rebuild = true;
						}
						callback();
					}
				); // async.whilst
			}
		],
		function() {
			if (need_rebuild) self.rebuildList(task, callback);
			else callback();
		}); // async.series
	},
	
	rebuildList: function(task, callback) {
		// rebuild list
		var self = this;
		var key = task.record_key;
		var list = task.list;
		var items = [];
		var page_idx = list.first_page;
		
		if (args.dry) {
			this.numRepairs++;
			return callback();
		}
		
		this.logPrint(3, "Repairing list: " + key);
		
		async.whilst(
			function() { return page_idx <= list.last_page; },
			function(callback) {
				// load each page, ignore errors, delete page
				self.storage.get( key + '/' + page_idx, function(err, data) {
					if (data && data.items) items = items.concat( data.items );
					self.storage.delete( key + '/' + page_idx, function(err) { page_idx++; callback(); } );
				} );
			},
			function(err) {
				// all items loaded, all pages deleted, now delete head
				self.storage.delete( key, function(err) {
					if (err) {
						// this should not happen
						self.fatal("FATAL: Failed to delete list head: " + key + ": " + err + ": List could NOT be repaired!");
					}
					
					var create_opts = { page_size: list.page_size };
					self.storage.listPush(key, items, create_opts, function(err) {
						if (err) {
							// this should not happen either
							self.fatal("FATAL: Failed to recreate list: " + key + ": " + err + ": List could NOT be repaired!");
						}
						
						self.numRepairs++;
						callback();
					});
				}); // storage.delete
			}
		); // async.whilst
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

StorageDoctor.run();
