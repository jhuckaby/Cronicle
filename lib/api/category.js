// Cronicle API Layer - Categories
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var assert = require("assert");
var async = require('async');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	//
	// Categories:
	//
	
	api_get_categories: function(args, callback) {
		// get list of categories (with pagination)
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			self.storage.listGet( 'global/categories', parseInt(params.offset || 0), parseInt(params.limit || 0), function(err, items, list) {
				if (err) {
					// no cats found, not an error for this API
					return callback({ code: 0, rows: [], list: { length: 0 } });
				}
				
				// success, return cats and list header
				callback({ code: 0, rows: items, list: list });
			} ); // got category list
		} ); // loaded session
	},
	
	api_create_category: function(args, callback) {
		// add new category
		var self = this;
		var cat = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(cat, {
			title: /\S/,
			max_children: /^\d+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			if (cat.id) cat.id = cat.id.toString().toLowerCase().replace(/\W+/g, '');
			if (!cat.id) cat.id = self.getUniqueID('c');
			
			cat.created = cat.modified = Tools.timeNow(true);
			
			if (user.key) {
				// API Key
				cat.api_key = user.key;
			}
			else {
				cat.username = user.username;
			}
			
			self.logDebug(6, "Creating new category: " + cat.title, cat);
			
			self.storage.listUnshift( 'global/categories', cat, function(err) {
				if (err) {
					return self.doError('category', "Failed to create category: " + err, callback);
				}
				
				self.logDebug(6, "Successfully created category: " + cat.title, cat);
				self.logTransaction('cat_create', cat.title, self.getClientInfo(args, { cat: cat }));
				self.logActivity('cat_create', { cat: cat }, args);
				
				callback({ code: 0, id: cat.id });
				
				// broadcast update to all websocket clients
				self.updateClientData( 'categories' );
			} ); // list insert
		} ); // load session
	},
	
	api_update_category: function(args, callback) {
		// update existing category
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.storage.listFind( 'global/categories', { id: params.id }, function(err, cat) {
				if (err || !cat) {
					return self.doError('event', "Failed to locate category: " + params.id, callback);
				}
				
				params.modified = Tools.timeNow(true);
				
				self.logDebug(6, "Updating category: " + cat.title, params);
				
				// pull abort flag out of event object, for use later
				var abort_jobs = 0;
				if (params.abort_jobs) {
					abort_jobs = params.abort_jobs;
					delete params.abort_jobs;
				}
				
				self.storage.listFindUpdate( 'global/categories', { id: params.id }, params, function(err) {
					if (err) {
						return self.doError('category', "Failed to update category: " + err, callback);
					}
					
					// merge params into cat, just so we have the full updated record
					for (var key in params) cat[key] = params[key];
					
					self.logDebug(6, "Successfully updated category: " + cat.title, params);
					self.logTransaction('cat_update', cat.title, self.getClientInfo(args, { cat: params }));
					self.logActivity('cat_update', { cat: params }, args);
					
					callback({ code: 0 });
					
					// broadcast update to all websocket clients
					self.updateClientData( 'categories' );
					
					// if cat is disabled, abort all applicable jobs
					if (!cat.enabled && abort_jobs) {
						var all_jobs = self.getAllActiveJobs(true);
						for (var key in all_jobs) {
							var job = all_jobs[key];
							if ((job.category == cat.id) && !job.detached) {
								var msg = "Category '" + cat.title + "' has been disabled.";
								self.logDebug(4, "Job " + job.id + " is being aborted: " + msg);
								self.abortJob({ id: job.id, reason: msg });
							} // matches cat
						} // foreach job
					} // cat disabled
					
					// if cat is being enabled, force scheduler to re-tick the minute
					var dargs = Tools.getDateArgs( new Date() );
					if (params.enabled && !self.schedulerGraceTimer && !self.schedulerTicking && (dargs.sec != 59)) {
						self.schedulerMinuteTick( null, true );
					}
					
				} ); // update cat
			} ); // find cat
		} ); // load session
	},
	
	api_delete_category: function(args, callback) {
		// delete existing category
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			// Do not allow deleting category if any matching events in schedule
			self.storage.listFind( 'global/schedule', { category: params.id }, function(err, item) {
				if (item) {
					return self.doError('plugin', "Failed to delete category: Still in use by one or more events.", callback);
				}
				
				self.logDebug(6, "Deleting category: " + params.id);
				
				self.storage.listFindDelete( 'global/categories', { id: params.id }, function(err, cat) {
					if (err) {
						return self.doError('category', "Failed to delete category: " + err, callback);
					}
					
					self.logDebug(6, "Successfully deleted category: " + cat.title, cat);
					self.logTransaction('cat_delete', cat.title, self.getClientInfo(args, { cat: cat }));
					self.logActivity('cat_delete', { cat: cat }, args);
					
					callback({ code: 0 });
					
					// broadcast update to all websocket clients
					self.updateClientData( 'categories' );
					
				} ); // listFindDelete (category)
			} ); // listFind (schedule)
		} ); // load session
	}
	
} );
