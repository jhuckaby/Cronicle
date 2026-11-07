// Cronicle API Layer - Events
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var assert = require("assert");
var async = require('async');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	//
	// Events:
	//
	
	api_get_schedule: function(args, callback) {
		// get list of scheduled events (with pagination)
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			// Load the complete schedule so authorization happens before pagination.
			// Otherwise hidden Events would still affect pages and list metadata.
			self.storage.listGet( 'global/schedule', 0, 0, function(err, items, list) {
				if (err) {
					// no items found, not an error for this API
					return callback({ code: 0, rows: [], list: { length: 0 } });
				}
				
				var offset = parseInt(params.offset || 0);
				var limit = parseInt(params.limit || 0);
				items = self.filterScheduleForUser(args, user, items);
				list = Tools.copyHash(list, true);
				list.length = items.length;
				items = limit ? items.slice(offset, offset + limit) : items.slice(offset);
				
				// success, return keys and list header
				callback({ code: 0, rows: items, list: list });
			} ); // got event list
		} ); // loaded session
	},
	
	api_get_event: function(args, callback) {
		// get single event for editing
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		var criteria = {};
		if (params.id) criteria.id = params.id;
		else if (params.title) criteria.title = params.title;
		else return this.doError('event', "Failed to locate event: No criteria specified", callback);
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			self.storage.listFind( 'global/schedule', criteria, function(err, item) {
				if (err || !item) {
					return self.doError('event', "Failed to locate event: " + (params.id || params.title), callback);
				}
				
				if (!self.requireCategoryPrivilege(user, item.category, callback)) return;
				if (!self.requireGroupPrivilege(args, user, item.target, callback)) return;
				
				// success, return event
				var resp = { code: 0, event: self.stripLegacyAPIKey(item) };
				if (item.queue) resp.queue = self.eventQueue[item.id] || 0;
				
				// if event has any active jobs, include those as well
				var all_jobs = self.getAllActiveJobs(true);
				var event_jobs = [];
				for (var key in all_jobs) {
					var job = all_jobs[key];
					if (job.event == item.id) event_jobs.push(self.stripLegacyAPIKey(job));
				}
				if (event_jobs.length) resp.jobs = event_jobs;
				
				callback(resp);
			} ); // got event
		} ); // loaded session
	},
	
	insertNewEvent: function(event, callback) {
		// Custom IDs must not shadow an existing Event and its permanent flag.
		// Serialize creates so concurrent requests cannot insert duplicate IDs.
		var self = this;
		var lock_key = 'cronicle/create_event';
		this.storage.lock(lock_key, true, function() {
			self.storage.listFind('global/schedule', { id: event.id }, function(err, existing) {
				if (existing || (err && (err.code != 'NoSuchKey'))) {
					self.storage.unlock(lock_key);
					return callback(err || new Error("Event ID already exists: " + event.id));
				}
				self.storage.listUnshift('global/schedule', event, function(err) {
					self.storage.unlock(lock_key);
					callback(err);
				});
			});
		});
	},
	
	api_create_event: function(args, callback) {
		// add new event
		var self = this;
		var event = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(event, {
			title: /\S/,
			enabled: /^(\d+|true|false)$/,
			category: /^\w+$/,
			target: /^[\w\-\.]+$/,
			plugin: /^\w+$/
		}, callback)) return;
		
		// validate optional event data parameters
		if (!this.requireValidEventData(event, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "create_events", callback)) return;
			if (!self.requireCategoryPrivilege(user, event.category, callback)) return;
			if (!self.requireGroupPrivilege(args, user, event.target, callback)) return;
			if (!self.prepareChainData(user, {}, event, callback)) return;
			
			args.user = user;
			args.session = session;
			
			if (event.id) event.id = event.id.toString().toLowerCase().replace(/\W+/g, '');
			if (!event.id) event.id = self.getUniqueID('e');
			
			event.created = event.modified = Tools.timeNow(true);
			
			if (!event.max_children) event.max_children = 0;
			if (!event.timeout) event.timeout = 0;
			if (!event.timezone) event.timezone = self.tz;
			if (!event.params) event.params = {};
			
			if (user.key) {
				// Attribute the object to a non-secret key ID, never the bearer token.
				event.api_key_id = user.id;
				event.api_title = user.title;
			}
			else {
				event.username = user.username;
			}
			
			// Validate Plugin params before storing the Event.
			self.storage.listFind( 'global/plugins', { id: event.plugin }, function(err, plugin) {
				if (err || !plugin) {
					return self.doError('event', "Failed to create event: Plugin not found: " + event.plugin, callback);
				}
				if (!self.requireValidEventParams(event.params, plugin, callback)) return;
				
				// validate category
				self.storage.listFind( 'global/categories', { id: event.category }, function(err, item) {
					if (err || !item) {
						return self.doError('event', "Failed to create event: Category not found: " + event.category, callback);
					}
					
					self.logDebug(6, "Creating new event: " + event.title, event);
					
					self.insertNewEvent( event, function(err) {
						if (err) {
							return self.doError('event', "Failed to create event: " + err, callback);
						}
						
						self.logDebug(6, "Successfully created event: " + event.title, event);
						self.logTransaction('event_create', event.title, self.getClientInfo(args, { event: event }));
						self.logActivity('event_create', { event: event }, args);
						
						callback({ code: 0, id: event.id });
						
						// broadcast update to all websocket clients
						self.updateClientData( 'schedule' );
						
						// create cursor for new event
						var now = Tools.normalizeTime( Tools.timeNow(), { sec: 0 } );
						self.state.cursors[ event.id ] = now;
						
						// send new state data to all web clients
						self.authSocketEmit( 'update', { state: self.state } );
						
					} ); // list insert
				} ); // find cat
			} ); // find plugin
		} ); // load session
	},
	
	api_update_event: function(args, callback) {
		// update existing event
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		// validate optional event data parameters
		if (!this.requireValidEventData(params, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "edit_events", callback)) return;
			if (params.abort_jobs && !self.requirePrivilege(user, "abort_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.storage.listFind( 'global/schedule', { id: params.id }, function(err, event) {
				if (err || !event) {
					return self.doError('event', "Failed to locate event: " + params.id, callback);
				}
				
				// Validate supplied params against the Event's effective Plugin.
				self.storage.listFind( 'global/plugins', { id: params.plugin || event.plugin }, function(err, plugin) {
					if (err || !plugin) {
						return self.doError('event', "Failed to update event: Plugin not found: " + (params.plugin || event.plugin), callback);
					}
					if (params.params && !self.requireValidEventParams(params.params, plugin, callback)) return;
					
					// validate category
					self.storage.listFind('global/categories', { id: params.category || event.category }, function (err, item) {
						if (err || !item) {
							return self.doError('event', "Failed to update event: Category not found: " + params.category, callback);
						}
						
						if (!self.requireCategoryPrivilege(user, event.category, callback)) return;
						if (!self.requireGroupPrivilege(args, user, event.target, callback)) return;
						
						// The caller must be allowed to edit both the existing Event and the
						// complete post-update Event.  Otherwise an allowed Event could be
						// moved into a restricted Category or Server Group before scheduling.
						var updated_event = Tools.mergeHashes( Tools.copyHash(event, true), params );
						if (!self.requireCategoryPrivilege(user, updated_event.category, callback)) return;
						if (!self.requireGroupPrivilege(args, user, updated_event.target, callback)) return;
						if (!self.prepareChainData(user, event, params, callback)) return;
						
						params.modified = Tools.timeNow(true);
						
						self.logDebug(6, "Updating event: " + event.title, params);
						
						// pull cursor reset out of event object, for use later
						var new_cursor = 0;
						if (params.reset_cursor) {
							new_cursor = Tools.normalizeTime(params.reset_cursor - 60, { sec: 0 });
							delete params.reset_cursor;
						}
						
						// pull abort flag out of event object, for use later
						var abort_jobs = 0;
						if (params.abort_jobs) {
							abort_jobs = params.abort_jobs;
							delete params.abort_jobs;
						}
						
						self.storage.listFindUpdate( 'global/schedule', { id: params.id }, params, function(err) {
							if (err) {
								return self.doError('event', "Failed to update event: " + err, callback);
							}
							
							// merge params into event, just so we have the full updated record
							for (var key in params) event[key] = params[key];
							
							// optionally reset cursor
							if (new_cursor) {
								var dargs = Tools.getDateArgs( new_cursor );
								self.logDebug(6, "Resetting event cursor to: " + dargs.yyyy_mm_dd + ' ' + dargs.hh_mi_ss);
								self.state.cursors[ params.id ] = new_cursor;
								
								// send new state data to all web clients
								self.authSocketEmit( 'update', { state: self.state } );
							}
							
							self.logDebug(6, "Successfully updated event: " + event.id + " (" + event.title + ")");
							self.logTransaction('event_update', event.title, self.getClientInfo(args, { event: params }));
							self.logActivity('event_update', { event: params }, args);
							
							// send response to web client
							callback({ code: 0 });
							
							// broadcast update to all websocket clients
							self.updateClientData( 'schedule' );
							
							// if event is disabled, abort all applicable jobs
							if (!event.enabled && abort_jobs) {
								var all_jobs = self.getAllActiveJobs(true);
								for (var key in all_jobs) {
									var job = all_jobs[key];
									if ((job.event == event.id) && !job.detached) {
										var msg = "Event '" + event.title + "' has been disabled.";
										self.logDebug(4, "Job " + job.id + " is being aborted: " + msg);
										self.abortJob({ id: job.id, reason: msg });
									} // matches event
								} // foreach job
							} // event disabled
							
							// if this is a catch_up event and is being enabled, force scheduler to re-tick the minute
							var dargs = Tools.getDateArgs( new Date() );
							if (params.enabled && event.catch_up && !self.schedulerGraceTimer && !self.schedulerTicking && (dargs.sec != 59)) {
								self.schedulerMinuteTick( null, true );
							}
							
							// check event queue
							if (self.eventQueue[event.id]) {
								if (event.queue) self.checkEventQueues( event.id );
								else self.deleteEventQueues( event.id );
							}
						} ); // update event
					} ); // find cat
				} ); // find plugin
			} ); // find event
		} ); // load session
	},
	
	api_delete_event: function(args, callback) {
		// delete existing event
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "delete_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.storage.listFind( 'global/schedule', { id: params.id }, function(err, event) {
				if (err || !event) {
					return self.doError('event', "Failed to locate event: " + params.id, callback);
				}
				
				if (!self.requireCategoryPrivilege(user, event.category, callback)) return;
				if (!self.requireGroupPrivilege(args, user, event.target, callback)) return;
				
				// Do not allow deleting event if any active jobs
				var all_jobs = self.getAllActiveJobs(true);
				for (var key in all_jobs) {
					var job = all_jobs[key];
					if (job.event == params.id) {
						var err = "Still has running jobs";
						return self.doError('event', "Failed to delete event: " + err, callback);
					} // matches event
				} // foreach job
				
				self.logDebug(6, "Deleting event: " + params.id);
				
				self.storage.listFindDelete( 'global/schedule', { id: params.id }, function(err) {
					if (err) {
						return self.doError('event', "Failed to delete event: " + err, callback);
					}
					
					self.logDebug(6, "Successfully deleted event: " + event.title, event);
					self.logTransaction('event_delete', event.title, self.getClientInfo(args, { event: event }));
					self.logActivity('event_delete', { event: event }, args);
					
					callback({ code: 0 });
					
					// broadcast update to all websocket clients
					self.updateClientData( 'schedule' );
					
					// schedule event's activity log to be deleted at next maint run
					self.storage.expire( 'logs/events/' + event.id, Tools.timeNow(true) + 86400 );
					
					// delete state data
					delete self.state.cursors[ event.id ];
					if (self.state.robins) delete self.state.robins[ event.id ];
					if (self.state.jobCodes) delete self.state.jobCodes[ event.id ];
					
					// send new state data to all web clients
					self.authSocketEmit( 'update', { state: self.state } );
					
					// check event queue
					if (self.eventQueue[event.id]) {
						self.deleteEventQueues( event.id );
					}
					
				} ); // delete
			} ); // listFind
		} ); // load session
	},
	
	api_run_event: function(args, callback) {
		// run event manually (via "Run" button in UI or by API Key)
		// accepts supported per-run overrides (such as 'now' and Plugin params)
		var self = this;
		if (!this.requireMaster(args, callback)) return;
		
		// default behavor: merge post params and query together
		// alt behavior (post_data): store post params into post_data
		var params = Tools.copyHash( args.query, true );
		if (args.query.post_data) params.post_data = args.params;
		else Tools.mergeHashInto( params, args.params );
		
		var criteria = {};
		if (params.id) criteria.id = params.id;
		else if (params.title) criteria.title = params.title;
		else return this.doError('event', "Failed to locate event: No criteria specified", callback);
		
		// validate optional event data parameters
		if (!this.requireValidEventData(params, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "run_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.storage.listFind( 'global/schedule', criteria, function(err, event) {
				if (err || !event) {
					return self.doError('event', "Failed to locate event: " + (params.id || params.title), callback);
				}
				
				if (!self.requireCategoryPrivilege(user, event.category, callback)) return;
				if (!self.requireGroupPrivilege(args, user, event.target, callback)) return;
				
				// A restricted caller cannot trigger even an administrator's saved
				// chain.  Requests without saved chains get a job-only restriction.
				if (self.isChainRestricted(user) && (event.chain || event.chain_error)) {
					return self.doError('event', "Restricted users cannot run events with chain reactions. Clear the event's chain settings first.", callback);
				}
				
				// Copy only supported run overrides.  A run-only caller must not replace
				// the Plugin, inject job state, change chains, or supply update_event.
				// Ignore other fields so the UI can still submit a full Event object.
				var overrides = {};
				[
					'algo', 'cpu_limit', 'cpu_sustain', 'log_max_size',
					'memory_limit', 'memory_sustain', 'notify_fail', 'notify_success',
					'now', 'notes', 'params', 'post_data', 'retries', 'retry_delay',
					'target', 'timeout', 'timezone', 'web_hook'
				].forEach( function(key) {
					if (Object.prototype.hasOwnProperty.call(params, key)) overrides[key] = params[key];
				} );
				
				// Read-only runners always use the saved Event without customization.
				if (user.privileges.job_read_only) overrides = {};
				else {
					// Only Plugin params support the legacy params/foo=bar syntax.
					// Do not let slash notation recreate filtered top-level fields or
					// write through inherited objects such as __proto__.
					if (('params' in overrides) && !Tools.isaHash(overrides.params)) {
						return self.doError('api', "Malformed event parameter: params (must be object)", callback);
					}
					for (var key in params) {
						if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
						var matches = key.match(/^params\/(\w+)$/);
						if (matches && !matches[1].match(/^(?:__proto__|constructor|prototype)$/)) {
							if (!overrides.params) overrides.params = {};
							overrides.params[ matches[1] ] = params[key];
						}
					}
				}
				params = overrides;
				if (!self.prepareChainData(user, event, params, callback)) return;
				
				// Script source must come from the saved Event, even for administrators.
				// Strip both JSON and legacy slash overrides after normalization, then
				// let the sparse merge below restore the saved script when present.
				if (params.params) delete params.params.script;
				
				// allow sparsely populated event params in request
				if (params.params && event.params) {
					for (var key in event.params) {
						if (!(key in params.params)) params.params[key] = event.params[key];
					}
				}
				
				var job = Tools.mergeHashes( Tools.copyHash(event, true), params );
				delete job.api_key; // Discard legacy bearer-key attribution before logging or queuing.
				
				// The API deliberately supports per-run Event overrides, but the merged
				// Job is what we actually dispatch.  Recheck its effective authorization
				// fields so an allowed Event cannot be redirected to a restricted group.
				if (!self.requireCategoryPrivilege(user, job.category, callback)) return;
				if (!self.requireGroupPrivilege(args, user, job.target, callback)) return;
				
				if (user.key) {
					// API Key
					job.source = "API Key ("+user.title+")";
					job.api_key_id = user.id;
					job.api_title = user.title;
				}
				else {
					job.source = "Manual ("+user.username+")";
					job.username = user.username;
				}
				
				self.logDebug(6, "Running event manually: " + job.title, job);
				
				self.launchOrQueueJob( job, function(err, jobs_launched) {
					if (err) {
						return self.doError('event', "Failed to launch event: " + err.message, callback);
					}
					
					// multiple jobs may have been launched (multiplex)
					var ids = [];
					for (var idx = 0, len = jobs_launched.length; idx < len; idx++) {
						var job = jobs_launched[idx];
						var stub = { id: job.id, event: job.event };
						self.logTransaction('job_run', job.event_title, self.getClientInfo(args, stub));
						if (self.server.config.get('track_manual_jobs')) self.logActivity('job_run', stub, args);
						ids.push( job.id );
					}
					
					var resp = { code: 0, ids: ids };
					if (!ids.length) resp.queue = self.eventQueue[event.id] || 1;
					callback(resp);
				} ); // launch job
			} ); // find event
		} ); // load session
	},
	
	api_flush_event_queue: function(args, callback) {
		// flush event queue
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "abort_events", callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.storage.listFind( 'global/schedule', { id: params.id }, function(err, event) {
				if (err || !event) {
					return self.doError('event', "Failed to locate event: " + params.id, callback);
				}
				
				if (!self.requireCategoryPrivilege(user, event.category, callback)) return;
				if (!self.requireGroupPrivilege(args, user, event.target, callback)) return;
				
				self.deleteEventQueues( params.id, function() {
					callback({ code: 0 });
				} );
				
			} ); // listFind
		} ); // loadSession
	},
	
	api_get_event_history: function(args, callback) {
		// get event history
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
						
			args.user = user;
			args.session = session;
			
			self.storage.listFind( 'global/schedule', { id: params.id }, function(err, event) {
				if (err || !event) {
					return self.doError('event', "Failed to locate event: " + params.id, callback);
				}
				
				if (!self.requireCategoryPrivilege(user, event.category, callback)) return;
				if (!self.requireGroupPrivilege(args, user, event.target, callback)) return;
				
				self.storage.listGet( 'logs/events/' + params.id, parseInt(params.offset || 0), parseInt(params.limit || 100), function(err, items, list) {
					if (err) {
						// no rows found, not an error for this API
						return callback({ code: 0, rows: [], list: { length: 0 } });
					}
					
					// success, return rows and list header
					callback({ code: 0, rows: items, list: list });
					
				} ); // got data
			} ); // listFind
		} ); // load session
	},
	
	api_get_history: function(args, callback) {
		// get list of completed jobs for ALL events (with pagination)
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			self.storage.listGet( 'logs/completed', parseInt(params.offset || 0), parseInt(params.limit || 50), function(err, items, list) {
				if (err) {
					// no rows found, not an error for this API
					return callback({ code: 0, rows: [], list: { length: 0 } });
				}
				
				// Omit the entire row for restricted categories, including any metadata
				// added in the future.  Keep global offsets and totals for pagination;
				// a restricted user's page may contain fewer rows or be empty.
				items = items.filter( function(item) {
					return self.hasCategoryPrivilege(user, item.category);
				} );
				
				// success, return rows and list header
				callback({ code: 0, rows: items, list: list });
			} ); // got data
		} ); // loaded session
	}
	
} );
