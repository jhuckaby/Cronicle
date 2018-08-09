// Cronicle Server Scheduler
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var async = require('async');
var fs = require('fs');
var moment = require('moment-timezone');

var Class = require("pixl-class");
var Tools = require("pixl-tools");
var PixlMail = require('pixl-mail');

module.exports = Class.create({
	
	setupScheduler: function() {
		// load previous event cursors
		var self = this;
		var now = Tools.normalizeTime( Tools.timeNow(), { sec: 0 } );
		
		this.storage.get( 'global/state', function(err, state) {
			if (!err && state) self.state = state;
			var cursors = self.state.cursors;
			
			// if running in debug mode, clear stats
			if (self.server.debug) self.state.stats = {};
			
			self.storage.listGet( 'global/schedule', 0, 0, function(err, items) {
				// got all schedule items
				var queue_event_ids = [];
				
				for (var idx = 0, len = items.length; idx < len; idx++) {
					var item = items[idx];
					
					// reset cursor to now if running in debug mode, or event is NOT set to catch up
					if (self.server.debug || !item.catch_up) {
						cursors[ item.id ] = now;
					}
					
					// if event has queue, add to load list
					if (item.queue) queue_event_ids.push( item.id );
				} // foreach item
				
				// load event queue counts
				if (queue_event_ids.length) async.eachSeries( queue_event_ids,
					function(event_id, callback) {
						self.storage.listGetInfo( 'global/event_queue/' + event_id, function(err, list) {
							if (!list) list = { length: 0 };
							self.eventQueue[ event_id ] = list.length || 0;
							callback();
						} );
					}
				); // eachSeries
				
				// set a grace period to allow all slaves to check-in before we start launching jobs
				// (important for calculating max concurrents -- master may have inherited a mess)
				self.schedulerGraceTimer = setTimeout( function() {
					delete self.schedulerGraceTimer;
					
					self.server.on('minute', function(dargs) {
						self.schedulerMinuteTick(dargs);
						self.checkAllEventQueues();
					} );
					
					// fire up queues if applicable
					if (queue_event_ids.length) self.checkEventQueues( queue_event_ids );
					
				}, self.server.config.get('scheduler_startup_grace') * 1000 );
				
			} ); // loaded schedule
		} ); // loaded state
	},
	
	schedulerMinuteTick: function(dargs, catch_up_only) {
		// a new minute has started, see if jobs need to run
		var self = this;
		var cursors = this.state.cursors;
		var launches = {};
		
		// don't run this if shutting down
		if (this.server.shut) return;
		
		if (this.state.enabled) {
			// scheduler is enabled, advance time
			this.schedulerTicking = true;
			if (!dargs) dargs = Tools.getDateArgs( Tools.timeNow(true) );
			
			dargs.sec = 0; // normalize seconds
			var now = Tools.getTimeFromArgs(dargs);
			
			if (catch_up_only) {
				self.logDebug(4, "Scheduler catching events up to: " + dargs.yyyy_mm_dd + " " + dargs.hh + ":" + dargs.mi + ":00" );
			}
			else {
				self.logDebug(4, "Scheduler Minute Tick: Advancing time up to: " + dargs.yyyy_mm_dd + " " + dargs.hh + ":" + dargs.mi + ":00" );
			}
			
			self.storage.listGet( 'global/schedule', 0, 0, function(err, items) {
				// got all schedule items, step through them in series
				if (err) {
					self.logError('storage', "Failed to fetch schedule: " + err);
					items = [];
				}
				
				async.eachSeries( items, async.ensureAsync( function(item, callback) {
					if (!item.enabled) {
						// item is disabled, skip over entirely
						// for catch_up events, this means jobs will 'accumulate'
						return callback();
					}
					if (!item.catch_up) {
						// no catch up needed, so only process current minute
						if (catch_up_only) {
							return callback();
						}
						cursors[ item.id ] = now - 60;
					}
					var cursor = cursors[ item.id ];
					
					// now step over each minute we missed
					async.whilst(
						function () { return cursor < now; },
						
						async.ensureAsync( function (callback) {
							cursor += 60;
							// var cargs = Tools.getDateArgs(cursor);
							var margs = moment.tz(cursor * 1000, item.timezone || self.tz);
							
							if (item.timing && self.checkEventTimingMoment(item.timing, margs)) {
								// item needs to run!
								self.logDebug(4, "Auto-launching scheduled item: " + item.id + " (" + item.title + ") for timestamp: " + margs.format('llll z') );
								self.launchOrQueueJob( Tools.mergeHashes(item, { now: cursor }), callback );
							}
							else callback();
						} ),
						
						function (err) {
							if (err) {
								var err_msg = "Failed to launch scheduled event: " + item.title + ": " + (err.message || err);
								self.logError('scheduler', err_msg);
								
								// only log visible error if not in catch_up_only mode, and cursor is near current time
								if (!catch_up_only && (Tools.timeNow(true) - cursor <= 30) && !err_msg.match(/(Category|Plugin).+\s+is\s+disabled\b/) && !launches[item.id]) {
									self.logActivity( 'warning', { description: err_msg } );
									if (item.notify_fail) {
										self.sendEventErrorEmail( item, { description: err_msg } );
									}
									
									var hook_data = Tools.mergeHashes( item, {
										action: 'job_launch_failure',
										code: 1,
										description: (err.message || err),
										event: item.id,
										event_title: item.title
									} );
									
									// prepare nice text summary (compatible with Slack Incoming WebHooks)
									hook_data.base_app_url = self.server.config.get('base_app_url');
									hook_data.edit_event_url = self.server.config.get('base_app_url') + '/#Schedule?sub=edit_event&id=' + item.id;
									
									var hook_text_templates = self.server.config.get('web_hook_text_templates') || self.defaultWebHookTextTemplates;
									
									if (hook_text_templates[hook_data.action]) {
										hook_data.text = Tools.sub( hook_text_templates[hook_data.action], hook_data );
										
										// include web_hook_config_keys if configured
										if (self.server.config.get('web_hook_config_keys')) {
											var web_hook_config_keys = self.server.config.get('web_hook_config_keys');
											for (var idy = 0, ley = web_hook_config_keys.length; idy < ley; idy++) {
												var key = web_hook_config_keys[idy];
												hook_data[key] = self.server.config.get(key);
											}
										}
										
										// include web_hook_custom_data if configured
										if (self.server.config.get('web_hook_custom_data')) {
											var web_hook_custom_data = self.server.config.get('web_hook_custom_data');
											for (var key in web_hook_custom_data) hook_data[key] = web_hook_custom_data[key];
										}
										
										if (item.web_hook) {
											self.logDebug(9, "Firing web hook for job launch failure: " + item.web_hook);
											self.request.json( item.web_hook, hook_data, function(err, resp, data) {
												// log response
												if (err) self.logDebug(9, "Web Hook Error: " + item.web_hook + ": " + err);
												else self.logDebug(9, "Web Hook Response: " + item.web_hook + ": HTTP " + resp.statusCode + " " + resp.statusMessage);
											} );
										}
										if (self.server.config.get('universal_web_hook')) {
											self.logDebug(9, "Firing universal web hook for job launch failure: " + self.server.config.get('universal_web_hook'));
											self.request.json( self.server.config.get('universal_web_hook'), hook_data, function(err, resp, data) {
												// log response
												if (err) self.logDebug(9, "Universal Web Hook Error: " + err);
												else self.logDebug(9, "Universal Web Hook Response: HTTP " + resp.statusCode + " " + resp.statusMessage);
											} );
										} // universal_web_hook
									} // yes fire hook
									
									// update failed job count for the day
									var stats = self.state.stats;
									if (!stats.jobs_failed) stats.jobs_failed = 1;
									else stats.jobs_failed++;
								} // notify for error
								
								cursor -= 60; // backtrack if we misfired
							} // error
							else {
								launches[ item.id ] = 1;
							}
							
							cursors[ item.id ] = cursor;
							callback();
						}
					); // whilst
				} ), 
				function(err) {
					// error should never occur here, but just in case
					if (err) self.logError('scheduler', "Failed to iterate schedule: " + err);
					
					// all items complete, save new cursor positions back to storage
					self.storage.put( 'global/state', self.state, function(err) {
						if (err) self.logError('state', "Failed to update state: " + err);
					} );
					
					// send state data to all web clients
					self.authSocketEmit( 'update', { state: self.state } );
					
					// remove in-use flag
					self.schedulerTicking = false;
				} ); // foreach item
			} ); // loaded schedule
		} // scheduler enabled
		else {
			// scheduler disabled, but still send state event every minute
			self.authSocketEmit( 'update', { state: self.state } );
		}
	},
	
	checkEventTiming: function(timing, cursor, tz) {
		// check if event needs to run
		if (!timing) return false;
		var margs = moment.tz(cursor * 1000, tz || this.tz);
		return this.checkEventTimingMoment(timing, margs);
	},
	
	checkEventTimingMoment: function(timing, margs) {
		// check if event needs to run using Moment.js API
		if (!timing) return false;
		if (timing.minutes && timing.minutes.length && (timing.minutes.indexOf(margs.minute()) == -1)) return false;
		if (timing.hours && timing.hours.length && (timing.hours.indexOf(margs.hour()) == -1)) return false;
		if (timing.weekdays && timing.weekdays.length && (timing.weekdays.indexOf(margs.day()) == -1)) return false;
		if (timing.days && timing.days.length && (timing.days.indexOf(margs.date()) == -1)) return false;
		if (timing.months && timing.months.length && (timing.months.indexOf(margs.month() + 1) == -1)) return false;
		if (timing.years && timing.years.length && (timing.years.indexOf(margs.year()) == -1)) return false;
		return true;
	},
	
	sendEventErrorEmail: function(event, overrides) {
		// send general error e-mail for event (i.e. failed to launch)
		var self = this;
		var email_template = "conf/emails/event_error.txt";
		var to = event.notify_fail;
		var dargs = Tools.getDateArgs( Tools.timeNow() );
		var email_data = Tools.mergeHashes(event, overrides || {});
		
		email_data.env = process.env;
		email_data.config = this.server.config.get();
		email_data.edit_event_url = this.server.config.get('base_app_url') + '/#Schedule?sub=edit_event&id=' + event.id;
		email_data.nice_date_time = dargs.yyyy_mm_dd + ' ' + dargs.hh_mi_ss + ' (' + dargs.tz + ')';
		email_data.description = (email_data.description || '(No description provided)').trim();
		email_data.notes = (email_data.notes || '(None)').trim();
		email_data.hostname = this.server.hostname;
		
		// construct mailer
		var mail = new PixlMail( this.server.config.get('smtp_hostname'), this.server.config.get('smtp_port') || 25 );
		mail.setOptions( this.server.config.get('mail_options') || {} );
		
		// send it
		mail.send( email_template, email_data, function(err, raw_email) {
			if (err) {
				var err_msg = "Failed to send e-mail for event: " + event.id + ": " + to + ": " + err;
				self.logError( 'mail', err_msg, { text: raw_email } );
				self.logActivity( 'error', { description: err_msg } );
			}
			else {
				self.logDebug(5, "Email sent successfully for event: " + event.id, { text: raw_email } );
			}
		} );
	},
	
	chainReaction: function(old_job, chain_event_id) {
		// launch custom new job from completed one
		var self = this;
		
		this.storage.listFind( 'global/schedule', { id: chain_event_id }, function(err, event) {
			if (err || !event) {
				var err_msg = "Failed to launch chain reaction: Event ID not found: " + chain_event_id;
				self.logError('scheduler', err_msg);
				self.logActivity( 'warning', { description: err_msg } );
				if (old_job.notify_fail) {
					self.sendEventErrorEmail( old_job, { description: err_msg } );
				}
				return;
			}
			
			var job = Tools.mergeHashes( Tools.copyHash(event, true), {
				chain_data: old_job.chain_data || {},
				chain_code: old_job.code || 0,
				chain_description: old_job.description || '',
				source: "Chain Reaction (" + old_job.event_title + ")",
				source_event: old_job.event
			} );
			
			self.logDebug(6, "Running event via chain reaction: " + job.title, job);
			
			self.launchOrQueueJob( job, function(err, jobs_launched) {
				if (err) {
					var err_msg = "Failed to launch chain reaction: " + job.title + ": " + err.message;
					self.logError('scheduler', err_msg);
					self.logActivity( 'warning', { description: err_msg } );
					if (job.notify_fail) {
						self.sendEventErrorEmail( job, { description: err_msg } );
					}
					else if (old_job.notify_fail) {
						self.sendEventErrorEmail( old_job, { description: err_msg } );
					}
					return;
				}
				
				// multiple jobs may have been launched (multiplex)
				for (var idx = 0, len = jobs_launched.length; idx < len; idx++) {
					var job_temp = jobs_launched[idx];
					var stub = { id: job_temp.id, event: job_temp.event, chain_reaction: 1, source_event: old_job.event };
					self.logTransaction('job_run', job_temp.event_title, stub);
				}
				
			} ); // launch job
		} ); // find event
	},
	
	checkAllEventQueues: function(callback) {
		// check event queues for ALL events
		var self = this;
		
		// don't run this if shutting down
		if (this.server.shut) {
			if (callback) callback();
			return;
		}
		
		// must be master to do this
		if (!this.multi.master) {
			if (callback) callback();
			return;
		}
		
		this.storage.listGet( 'global/schedule', 0, 0, function(err, items) {
			if (err || !items) {
				if (callback) callback();
				return;
			}
			var queue_event_ids = [];
			
			for (var idx = 0, len = items.length; idx < len; idx++) {
				var item = items[idx];
				if (item.queue) queue_event_ids.push( item.id );
			} // foreach item
			
			if (queue_event_ids.length) {
				self.checkEventQueues( queue_event_ids, callback );
			}
			else {
				if (callback) callback();
			}
		} );
	},
	
	checkEventQueues: function(event_ids, callback) {
		// check event queues for specific list of event IDs,
		// and run events if possible
		var self = this;
		this.logDebug(9, "Checking event queues", event_ids);
		
		// don't run this if shutting down
		if (this.server.shut) {
			if (callback) callback();
			return;
		}
		
		// must be master to do this
		if (!this.multi.master) {
			if (callback) callback();
			return;
		}
		
		if (!Array.isArray(event_ids)) event_ids = [ event_ids ];
		var hot_event_ids = [];
		
		// only consider events with items in the queue
		event_ids.forEach( function(event_id) {
			if (self.eventQueue[event_id]) hot_event_ids.push( event_id );
		} ); // forEach
		
		async.eachSeries( hot_event_ids,
			function(event_id, callback) {
				// load first item from queue
				var list_path = 'global/event_queue/' + event_id;
				self.logDebug(9, "Attempting to dequeue job from event queue: " + event_id);
				
				self.storage.lock( list_path, true, function() {
					// locked
					self.storage.listGet( list_path, 0, 1, function(err, events) {
						if (err || !events || !events[0]) {
							self.storage.unlock( list_path );
							return callback();
						}
						var event = events[0];
						
						// try to launch (without auto-queue), and catch error before anything is logged
						self.launchJob( event, function(err, jobs_launched) {
							if (err) {
								// no problem, job cannot launch at this time
								self.logDebug(9, "Job dequeue launch failed, item will remain in queue", {
									err: '' + err,
									event: event_id
								});
								self.storage.unlock( list_path );
								return callback();
							}
							
							self.logDebug(9, "Queue launch successful!", { event: event_id });
							
							// we queue-launched!  decrement counter and shift from list
							if (self.eventQueue[event_id]) self.eventQueue[event_id]--;
							self.authSocketEmit( 'update', { eventQueue: self.eventQueue } );
							
							self.storage.listShift( list_path, function(err) {
								if (err) self.logDebug(3, "Failed to shift queue: " + err);
								self.storage.unlock( list_path );
								callback();
							} );
							
							// multiple jobs may have been launched (multiplex)
							for (var idx = 0, len = jobs_launched.length; idx < len; idx++) {
								var job_temp = jobs_launched[idx];
								var stub = { id: job_temp.id, event: job_temp.event, dequeued: 1 };
								self.logTransaction('job_run', job_temp.event_title, stub);
							}
						} ); // launchJob
					} ); // listGet
				} ); // lock
			},
			function() {
				if (callback) callback();
			}
		); // eachSeries
	},
	
	deleteEventQueues: function(event_ids, callback) {
		// delete one or more event queues
		var self = this;
		if (!Array.isArray(event_ids)) event_ids = [ event_ids ];
		
		async.eachSeries( event_ids,
			function(event_id, callback) {
				// remove count from RAM, then delete storage list
				self.logDebug(4, "Deleting event queue: " + event_id);
				
				delete self.eventQueue[event_id];
				
				self.storage.listDelete( 'global/event_queue/' + event_id, true, function(err) {
					// ignore error, as list may not exist
					callback();
				} );
			},
			function() {
				// send eventQueue update to connected clients
				self.authSocketEmit( 'update', { eventQueue: self.eventQueue } );
				if (callback) callback();
			}
		); // eachSeries
	},
	
	shutdownScheduler: function(callback) {
		// persist state to storage
		var self = this;
		if (!this.multi.master) {
			if (callback) callback();
			return;
		}
		
		if (this.schedulerGraceTimer) {
			clearTimeout( this.schedulerGraceTimer );
			delete this.schedulerGraceTimer;
		}
		
		this.storage.put( 'global/state', this.state, function(err) {
			if (err) self.logError('state', "Failed to update state: " + err);
			if (callback) callback();
		} );
	}
	
} );
