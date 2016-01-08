// Cronicle Server Scheduler
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var async = require('async');
var fs = require('fs');
var moment = require('moment-timezone');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

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
				for (var idx = 0, len = items.length; idx < len; idx++) {
					var item = items[idx];
					
					// reset cursor to now if running in debug mode, or event is NOT set to catch up
					if (self.server.debug || !item.catch_up) {
						cursors[ item.id ] = now;
					}
				} // foreach item
				
				// set a grace period to allow all slaves to check-in before we start launching jobs
				// (important for calculating max concurrents -- master may have inherited a mess)
				self.schedulerGraceTimer = setTimeout( function() {
					delete self.schedulerGraceTimer;
					
					self.server.on('minute', function(dargs) {
						self.schedulerMinuteTick(dargs);
					} );
				}, self.server.config.get('scheduler_startup_grace') * 1000 );
				
			} ); // loaded schedule
		} ); // loaded state
	},
	
	schedulerMinuteTick: function(dargs, catch_up_only) {
		// a new minute has started, see if jobs need to run
		var self = this;
		var cursors = this.state.cursors;
		
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
				
				async.eachSeries( items, function(item, callback) {
					if (!item.enabled) {
						// item is disabled, skip over entirely
						// for catch_up events, this means jobs will 'accumulate'
						process.nextTick( callback ); // prevent stack overflow
						return;
					}
					if (!item.catch_up) {
						// no catch up needed, so only process current minute
						if (catch_up_only) {
							process.nextTick( callback ); // prevent stack overflow
							return;
						}
						cursors[ item.id ] = now - 60;
					}
					var cursor = cursors[ item.id ];
					
					// now step over each minute we missed
					async.whilst(
						function () { return cursor < now; },
						function (callback) {
							cursor += 60;
							// var cargs = Tools.getDateArgs(cursor);
							var margs = moment.tz(cursor * 1000, item.timezone || self.tz);
							
							if (self.checkEventTimingMoment(item.timing, margs)) {
								// item needs to run!
								self.logDebug(4, "Auto-launching scheduled item: " + item.id + " (" + item.title + ") for timestamp: " + margs.format('llll z') );
								self.launchJob( Tools.mergeHashes(item, { now: cursor }), callback );
							}
							else process.nextTick( callback ); // prevent stack overflow
						},
						function (err) {
							if (err) {
								var err_msg = "Failed to launch scheduled event: " + item.title + ": " + err;
								self.logError('scheduler', err_msg);
								
								// only log visible error if not in catch_up_only mode, and cursor is near current time
								if (!catch_up_only && (Tools.timeNow(true) - cursor <= 60) && !err_msg.match(/(Category|Plugin).+\s+is\s+disabled\b/)) {
									self.logActivity( 'warning', { description: err_msg } );
								}
								
								cursor -= 60; // backtrack if we misfired
							} // error
							
							cursors[ item.id ] = cursor;
							process.nextTick( callback ); // prevent stack overflow
						}
					); // whilst
				}, 
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
	
	/*checkEventTiming: function(timing, dargs) {
		// check if event needs to run
		if (timing.minutes && timing.minutes.length && (timing.minutes.indexOf(dargs.min) == -1)) return false;
		if (timing.hours && timing.hours.length && (timing.hours.indexOf(dargs.hour) == -1)) return false;
		if (timing.weekdays && timing.weekdays.length && (timing.weekdays.indexOf(dargs.wday) == -1)) return false;
		if (timing.days && timing.days.length && (timing.days.indexOf(dargs.mday) == -1)) return false;
		if (timing.months && timing.months.length && (timing.months.indexOf(dargs.mon) == -1)) return false;
		if (timing.years && timing.years.length && (timing.years.indexOf(dargs.year) == -1)) return false;
		return true;
	},*/
	
	checkEventTimingMoment: function(timing, margs) {
		// check if event needs to run using Moment.js API
		if (timing.minutes && timing.minutes.length && (timing.minutes.indexOf(margs.minute()) == -1)) return false;
		if (timing.hours && timing.hours.length && (timing.hours.indexOf(margs.hour()) == -1)) return false;
		if (timing.weekdays && timing.weekdays.length && (timing.weekdays.indexOf(margs.day()) == -1)) return false;
		if (timing.days && timing.days.length && (timing.days.indexOf(margs.date()) == -1)) return false;
		if (timing.months && timing.months.length && (timing.months.indexOf(margs.month() + 1) == -1)) return false;
		if (timing.years && timing.years.length && (timing.years.indexOf(margs.year()) == -1)) return false;
		return true;
	},
	
	shutdownScheduler: function() {
		// persist state to storage
		var self = this;
		if (!this.multi.master) return;
		
		if (this.schedulerGraceTimer) {
			clearTimeout( this.schedulerGraceTimer );
			delete this.schedulerGraceTimer;
		}
		
		this.storage.put( 'global/state', this.state, function(err) {
			if (err) self.logError('state', "Failed to update state: " + err);
		} );
	}
	
} );
