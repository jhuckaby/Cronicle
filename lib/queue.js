// Cronicle Server Queue Layer
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

// Note: Special queue task properties are 'action' and 'when'.
// These are meta properties, and are DELETED when the task is executed.

var fs = require("fs");
var async = require('async');
var glob = require('glob');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	internalQueue: null,
	
	setupQueue: function() {
		// setup queue system
		if (!this.internalQueue) {
			this.internalQueue = {};
			
			// check in-memory queue every second
			this.server.on('tick', this.monitorInternalQueue.bind(this));
			
			// check external queue every minute
			this.server.on('minute', this.monitorExternalQueue.bind(this));
		}
	},
	
	monitorInternalQueue: function() {
		// monitor in-memory queue for tasks ready to execute
		// these may be future-scheduled via 'when' property
		// (this is called once per second)
		var now = Tools.timeNow();
		
		// don't run this if shutting down
		if (this.server.shut) return;
		
		for (var key in this.internalQueue) {
			var task = this.internalQueue[key];
			if (!task.when || (now >= task.when)) {
				// invoke method from 'action' property
				this.logDebug(5, "Processing internal queue task", task);
				var action = task.action || 'UNKNOWN';
				delete task.action;
				delete task.when;
				
				if (this[action]) {
					this[action](task);
				}
				else {
					this.logError('queue', "Unsupported action: " + action, task);
				}
				delete this.internalQueue[key];
			} // execute
		} // foreach item
	},
	
	enqueueInternal: function(task) {
		// enqueue task into internal queue
		var key = Tools.generateUniqueID(32);
		this.logDebug(9, "Enqueuing internal task: " + key, task);
		this.internalQueue[key] = task;
	},
	
	monitorExternalQueue: function() {
		// monitor queue dir for files (called once per minute)
		var self = this;
		var file_spec = this.server.config.get('queue_dir') + '/*.json';
		
		// don't run this if shutting down
		if (this.server.shut) return;
		
		glob(file_spec, {}, function (err, files) {
			// got task files
			if (files && files.length) {
				async.eachSeries( files, function(file, callback) {
					// foreach task file
					fs.readFile( file, { encoding: 'utf8' }, function(err, data) {
						// delete right away, regardless of outcome
						fs.unlink( file, function(err) {;} );
						
						// parse json
						var task = null;
						try { task = JSON.parse( data ); }
						catch (err) {
							self.logError('queue', "Failed to parse queued JSON file: " + file + ": " + err);
						}
						
						if (task) {
							self.logDebug(5, "Processing external queue task: " + file, task);
							
							if (task.when) {
								// task is set for a future time, add to internal memory queue
								self.enqueueInternal(task);
							}
							else {
								// run now, invoke method from 'action' property
								var action = task.action || 'UNKNOWN';
								delete task.action;
								delete task.when;
								
								if (self[action]) {
									self[action](task);
								}
								else {
									self.logError('queue', "Unsupported action: " + action, task);
								}
							} // run now
						} // good task
						
						callback();
					} );
				}, 
				function(err) {
					// done with glob eachSeries
					self.logDebug(9, "No more queue files to process");
				} );
			} // got files
		} ); // glob
	},
	
	enqueueExternal: function(task, callback) {
		// enqueue a task for later (up to 1 minute delay)
		// these may be future-scheduled via 'when' property
		var self = this;
		var task_file = this.server.config.get('queue_dir') + '/' + Tools.generateUniqueID(32) + '.json';
		var temp_file = task_file + '.tmp';
		
		this.logDebug(9, "Enqueuing external task", task);
		
		fs.writeFile( temp_file, JSON.stringify(task), function(err) {
			if (err) {
				self.logError('queue', "Failed to write queue file: " + temp_file + ": " + err);
				if (callback) callback();
				return;
			}
			
			fs.rename( temp_file, task_file, function(err) {
				if (err) {
					self.logError('queue', "Failed to rename queue file: " + temp_file + ": " + task_file + ": " + err);
					if (callback) callback();
					return;
				}
				
				if (callback) callback();
			} ); // rename
		} ); // writeFile
	},
	
	shutdownQueue: function() {
		// shut down queues
		// move internal pending queue items to external queue
		// to be picked up on next startup
		var self = this;
		
		if (this.internalQueue) {
			for (var key in this.internalQueue) {
				var task = this.internalQueue[key];
				this.enqueueExternal( task );
			}
			this.internalQueue = null;
		}
	}
	
});
