// PixlServer Storage System
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var util = require("util");
var async = require('async');

var Class = require("pixl-class");
var Tools = require("pixl-tools");
var Component = require("pixl-server/component");
var List = require("./list.js");

module.exports = Class.create({
	
	__name: 'Storage',
	__parent: Component,
	__mixins: [ List ],
	
	defaultConfig: {
		list_page_size: 50,
		concurrency: 1,
		maintenance: 0,
		cache_key_match: ''
	},
	
	locks: null,
	cache: null,
	cacheKeyRegex: null,
	started: false,
	
	startup: function(callback) {
		// setup storage plugin
		var self = this;
		this.logDebug(2, "Setting up storage system");
		
		// advisory locking system (in RAM, single process only)
		this.locks = {};
		
		// ram cache for certain keys, configurable
		this.cache = {};
		this.cacheKeyRegEx = null;
		
		// cache some config values, and listen for config refresh
		this.prepConfig();
		this.config.on('reload', this.prepConfig.bind(this) );
		
		// dynamically load storage engine based on config
		var StorageEngine = require(
			this.config.get('engine_path') || 
			("./engines/" + this.config.get('engine') + ".js")
		);
		this.engine = new StorageEngine();
		this.engine.storage = this;
		this.engine.init( this.server, this.config.getSub( this.config.get('engine') ) );
		
		// queue for setting expirations and custom engine ops
		this.queue = async.queue( this.dequeue.bind(this), this.concurrency );
		
		// setup daily maintenance, if configured
		if (this.config.get('maintenance')) {
			// e.g. "day", "04:00", etc.
			this.server.on(this.config.get('maintenance'), function() {
				self.runMaintenance();
			});
		}
		
		// allow engine to startup as well
		this.engine.startup( function() {
			self.started = true;
			callback();
		} );
	},
	
	prepConfig: function() {
		// save some config values
		this.listItemsPerPage = this.config.get('list_page_size');
		this.concurrency = this.config.get('concurrency');
		
		this.cacheKeyRegex = null;
		if (this.config.get('cache_key_match')) {
			this.cacheKeyRegex = new RegExp( this.config.get('cache_key_match') );
		}
	},
	
	normalizeKey: function(key) {
		// lower-case, strip leading and trailing slashes
		return key.toLowerCase().replace(/[^\w\-\.\/]+/g, '').replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
	},
	
	isBinaryKey: function(key) {
		// binary keys have a built-in file extension, JSON keys do not
		return !!key.match(/\.\w+$/);
	},
	
	put: function(key, value, callback) {
		// store key+value pair
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		key = this.normalizeKey( key );
		
		// sanity check
		var isBuffer = (value instanceof Buffer);
		if (isBuffer && !this.isBinaryKey(key)) {
			return callback( new Error("Buffer values are only allowed with keys containing file extensions, e.g. " + key + ".bin") );
		}
		else if (!isBuffer && this.isBinaryKey(key)) {
			return callback( new Error("You must pass a Buffer object as the value when using keys containing file extensions.") );
		}
		
		// ram cache
		if (this.cacheKeyRegex && key.match(this.cacheKeyRegex)) {
			this.cache[key] = value;
		}
		
		this.engine.put( key, value, callback );
	},
	
	putStream: function(key, stream, callback) {
		// store key+stream
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		key = this.normalizeKey( key );
		
		if (!this.isBinaryKey(key)) {
			return callback( new Error("Stream values are only allowed with keys containing file extensions, e.g. " + key + ".bin") );
		}
		
		this.engine.putStream( key, stream, callback );
	},
	
	putMulti: function(records, callback) {
		// put multiple records at once, given object of keys and values
		var self = this;
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		// if engine provides its own putMulti, call that directly
		if ("putMulti" in this.engine) {
			return this.engine.putMulti(records, callback);
		}
		
		async.eachLimit(Object.keys(records), this.concurrency, 
			function(key, callback) {
				// iterator for each key
				self.put(key, records[key], function(err) {
					callback(err);
				} );
			}, 
			function(err) {
				// all keys stored
				callback(err);
			}
		);
	},
	
	head: function(key, callback) {
		// fetch metadata given key: { mod, len }
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		key = this.normalizeKey( key );
		this.engine.head( key, callback );
	},
	
	headMulti: function(keys, callback) {
		// head multiple records at once, given array of keys
		// callback is provided an array of values in matching order to keys
		var self = this;
		var records = {};
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		// if engine provides its own headMulti, call that directly
		if ("headMulti" in this.engine) {
			return this.engine.headMulti(keys, callback);
		}
		
		async.eachLimit(keys, this.concurrency, 
			function(key, callback) {
				// iterator for each key
				self.head(key, function(err, data) {
					if (err) callback(err);
					records[key] = data;
					callback();
				} );
			}, 
			function(err) {
				if (err) return callback(err);
				
				// sort records into array of values ordered by keys
				var values = [];
				for (var idx = 0, len = keys.length; idx < len; idx++) {
					values.push( records[keys[idx]] );
				}
				
				callback(null, values);
			}
		);
	},
	
	get: function(key, callback) {
		// fetch value given key
		var self = this;
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		key = this.normalizeKey( key );
		var cacheable = !!(this.cacheKeyRegex && key.match(this.cacheKeyRegex));
		
		// ram cache
		if (cacheable && (key in this.cache)) {
			return callback( null, this.cache[key] );
		}
		
		this.engine.get( key, function(err, value) {
			if (err) return callback(err);
			
			// ram cache
			if (cacheable) {
				self.cache[key] = value;
			}
			
			callback(err, value);
		} );
	},
	
	getStream: function(key, callback) {
		// fetch value via stream pipe
		var self = this;
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		key = this.normalizeKey( key );
		
		this.engine.getStream( key, callback );
	},
	
	getMulti: function(keys, callback) {
		// fetch multiple records at once, given array of keys
		// callback is provided an array of values in matching order to keys
		var self = this;
		var records = {};
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		// if engine provides its own getMulti, call that directly
		if ("getMulti" in this.engine) {
			return this.engine.getMulti(keys, callback);
		}
		
		async.eachLimit(keys, this.concurrency, 
			function(key, callback) {
				// iterator for each key
				self.get(key, function(err, data) {
					if (err) return callback(err);
					records[key] = data;
					callback();
				} );
			}, 
			function(err) {
				if (err) return callback(err);
				
				// sort records into array of values ordered by keys
				var values = [];
				for (var idx = 0, len = keys.length; idx < len; idx++) {
					values.push( records[keys[idx]] );
				}
				
				callback(null, values);
			}
		);
	},
	
	delete: function(key, callback) {
		// delete key given key
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		key = this.normalizeKey( key );
		
		// ram cache
		if (this.cacheKeyRegex && key.match(this.cacheKeyRegex) && (key in this.cache)) {
			delete this.cache[key];
		}
		
		this.engine.delete( key, callback );
	},
	
	deleteMulti: function(keys, callback) {
		// delete multiple records at once, given array of keys
		var self = this;
		var records = {};
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		// if engine provides its own deleteMulti, call that directly
		if ("deleteMulti" in this.engine) {
			return this.engine.deleteMulti(keys, callback);
		}
		
		async.eachLimit(keys, this.concurrency, 
			function(key, callback) {
				// iterator for each key
				self.delete(key, function(err) {
					callback(err);
				} );
			}, 
			function(err) {
				// all keys deleted
				callback(err);
			}
		);
	},
	
	copy: function(old_key, new_key, callback) {
		// copy record to new key
		var self = this;
		this.logDebug(9, "Copying record: " + old_key + " to " + new_key);
		
		// load old key
		this.get(old_key, function(err, data) {
			if (err) return callback(err, null);
			
			// save new key
			self.put(new_key, data, callback);
		} );
	},
	
	rename: function(old_key, new_key, callback) {
		// rename record (copy + delete old)
		var self = this;
		this.logDebug(9, "Renaming record: " + old_key + " to " + new_key);
		
		this.copy( old_key, new_key, function(err, data) {
			// copied, now delete old
			self.delete( old_key, callback );
		} );
	},
	
	expire: function(key, expiration, force) {
		// set expiration date on key
		this.logDebug(9, "Setting expiration on: " + key + " to " + expiration);
		
		this.enqueue({
			action: 'expire_set',
			key: key,
			expiration: expiration,
			force: !!force
		});
	},
	
	enqueue: function(task) {
		// enqueue task for execution soon
		if (!this.started) throw new Error("Storage has not completed startup.");
		
		if (typeof(task) == 'function') {
			var func = task;
			task = { action: 'custom', handler: func };
		}
		this.logDebug(9, "Enqueuing async task", task);
		this.queue.push( task );
	},
	
	dequeue: function(task, callback) {
		// run task and fire callback
		var self = this;
		this.logDebug(9, "Running async task", task);
		
		switch (task.action) {
			case 'expire_set':
				// set expiration on record
				var dargs = Tools.getDateArgs( task.expiration );
				var dnow = Tools.getDateArgs( new Date() );
				if (!task.force && ((dargs.epoch <= dnow.epoch) || (dargs.yyyy_mm_dd == dnow.yyyy_mm_dd))) {
					// move to tomorrow, avoid race condition with maintenance()
					dargs = Tools.getDateArgs( dnow.epoch + 86400 );
				}
				
				var cleanup_key = '_cleanup/' + dargs.yyyy + '/' + dargs.mm + '/' + dargs.dd;
				this.listPush( cleanup_key, { key: task.key }, function(err, data) {
					// should never fail, but who knows
					if (err) self.logError('cleanup', "Failed to push cleanup list: " + cleanup_key + ": " + err);
					callback();
				} );
			break; // expire_set
			
			case 'custom':
				// custom handler
				task.handler( task, function(err) {
					if (err) self.logError('storage', "Failed to dequeue custom task: " + err);
					callback();
				} );
			break; // custom
		} // switch action
	},
	
	runMaintenance: function(date, callback) {
		// run daily maintenance (delete expired keys)
		var self = this;
		var dargs = Tools.getDateArgs( date || (new Date()) );
		var cleanup_key = '_cleanup/' + dargs.yyyy + '/' + dargs.mm + '/' + dargs.dd;
		this.logDebug(3, "Running daily maintenance", cleanup_key);
		
		this.listEach( cleanup_key, 
			function(item, item_idx, callback) {
				// delete item if still expired
				var key = item.key;
				if (key.match(/\.\w+$/)) {
					// key has file extension so it is probably binary, delete right away
					self.delete( key, function(err) {
						callback();
					} );
				} // binary
				else {
					// see if expiration date is still overdue
					self.get( key, function(err, data) {
						if (data && data.expires) {
							var eargs = Tools.getDateArgs( data.expires );
							if ((eargs.epoch <= dargs.epoch) || (eargs.yyyy_mm_dd == dargs.yyyy_mm_dd)) {
								// still expired, kill it
								if (data.type && (data.type == 'list')) {
									self.listDelete( key, true, function(err) { callback(); } );
								}
								else {
									self.delete( key, function(err) { callback(); } );
								}
							}
							else {
								// oops, expiration changed, skip
								self.logDebug(9, "Expiration on record " + key + " has changed to " + eargs.yyyy_mm_dd + ", skipping delete");
								callback();
							}
						}
						else if (data) {
							// no expiration date, just delete it
							if (data.type && (data.type == 'list')) {
								self.listDelete( key, true, function(err) { callback(); } );
							}
							else {
								self.delete( key, function(err) { callback(); } );
							}
						}
						else {
							// failed to load, just move on (probably deleted)
							callback();
						}
					} ); // get
				} // json
			},
			function(err) {
				// list iteration complete
				if (err) {
					self.logDebug(10, "Failed to load list, skipping maintenance (probably harmless)", cleanup_key);
					if (callback) callback();
				}
				else {
					// no error, delete list
					self.listDelete( cleanup_key, true, function(err) {
						if (err) {
							self.logError('maint', "Failed to delete cleanup list: " + cleanup_key + ": " + err);
						}
						
						// allow engine to run maint as well
						self.engine.runMaintenance( function() {
							self.logDebug(3, "Daily maintenance complete");
							if (callback) callback();
						} );
						
					} ); // listDelete
				} // succes
			} // list complete
		); // listEach
	},
	
	lock: function(key, wait, callback) {
		// lock key in RAM, possibly wait until unlocked
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		if (key.match(/^(\|+)/)) key = RegExp.$1 + this.normalizeKey(key);
		else key = this.normalizeKey(key);
		
		if (this.locks[key]) {
			if (wait) {
				this.logDebug(9, "Key is already locked: " + key + ", waiting for unlock");
				this.locks[key].push(callback);
			}
			else {
				this.logDebug(9, "Key is already locked: " + key);
				callback( new Error("Key is locked") );
			}
		}
		else {
			this.logDebug(9, "Locking key: " + key);
			this.locks[key] = [];
			callback(null);
		}
	},
	
	unlock: function(key) {
		// release lock on key
		if (!this.started) return callback( new Error("Storage has not completed startup.") );
		
		if (key.match(/^(\|+)/)) key = RegExp.$1 + this.normalizeKey(key);
		else key = this.normalizeKey(key);
		
		if (this.locks[key]) {
			this.logDebug(9, "Unlocking key: " + key);
			var callback = this.locks[key].shift();
			if (callback) callback();
			else delete this.locks[key];
		}
	},
	
	waitForQueueDrain: function(callback) {
		// wait for queue to finish all pending tasks
		if (this.queue.idle()) callback();
		else {
			this.logDebug(3, "Waiting for queue to finish " + this.queue.running() + " active and " + this.queue.length() + " pending tasks");
			this.queue.drain = callback;
		}
	},
	
	waitForAllLocks: function(callback) {
		// wait for all locks to release before proceeding
		var self = this;
		var num_locks = Tools.numKeys(this.locks);
		
		if (num_locks) {
			this.logDebug(3, "Waiting for " + num_locks + " locks to be released", Object.keys(this.locks));
			
			async.whilst(
				function () {
					return (Tools.numKeys(self.locks) > 0);
				},
				function (callback) {
					setTimeout( function() { callback(); }, 250 );
				},
				function() {
					// all locks released
					callback();
				}
			); // whilst
		}
		else callback();
	},
	
	shutdown: function(callback) {
		// shutdown storage
		var self = this;
		this.logDebug(2, "Shutting down storage system");
		
		this.waitForQueueDrain( function() {
			// queue drained, now wait for locks
			
			self.waitForAllLocks( function() {
				// all locks released, now shutdown engine
				
				if (self.engine) self.engine.shutdown(callback);
				else callback();
				
			} ); // waitForLocks
		} ); // waitForQueueDrain
	}
	
});
