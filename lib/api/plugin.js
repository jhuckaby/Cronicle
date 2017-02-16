// Cronicle API Layer - Plugins
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var sqparse = require('shell-quote').parse;

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	//
	// Plugins:
	//
	
	api_get_plugins: function(args, callback) {
		// get list of plugins (with pagination)
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			self.storage.listGet( 'global/plugins', parseInt(params.offset || 0), parseInt(params.limit || 0), function(err, items, list) {
				if (err) {
					// no plugins found, not an error for this API
					return callback({ code: 0, rows: [], list: { length: 0 } });
				}
				
				// success, return plugins and list header
				callback({ code: 0, rows: items, list: list });
			} ); // got plugin list
		} ); // loaded session
	},
	
	api_create_plugin: function(args, callback) {
		// add new plugin
		var self = this;
		var plugin = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(plugin, {
			title: /\S/,
			command: /\S/
		}, callback)) return;
		
		if (!this.requireValidPluginCommand(plugin.command, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			if (plugin.id) plugin.id = plugin.id.toString().toLowerCase().replace(/\W+/g, '');
			if (!plugin.id) plugin.id = self.getUniqueID('p');
			
			plugin.params = plugin.params || [];
			plugin.username = user.username;
			plugin.created = plugin.modified = Tools.timeNow(true);
			
			self.logDebug(6, "Creating new plugin: " + plugin.title, plugin);
			
			self.storage.listUnshift( 'global/plugins', plugin, function(err) {
				if (err) {
					return self.doError('plugin', "Failed to create plugin: " + err, callback);
				}
				
				self.logDebug(6, "Successfully created plugin: " + plugin.title, plugin);
				self.logTransaction('plugin_create', plugin.title, self.getClientInfo(args, { plugin: plugin }));
				self.logActivity('plugin_create', { plugin: plugin }, args);
				
				callback({ code: 0, id: plugin.id });
				
				// broadcast update to all websocket clients
				self.updateClientData( 'plugins' );
			} ); // list insert
		} ); // load session
	},
	
	api_update_plugin: function(args, callback) {
		// update existing plugin
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		if (params.command) {
			if (!this.requireValidPluginCommand(params.command, callback)) return;
		}
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.storage.listFind( 'global/plugins', { id: params.id }, function(err, plugin) {
				if (err || !plugin) {
					return self.doError('event', "Failed to locate plugin: " + params.id, callback);
				}
				
				params.modified = Tools.timeNow(true);
				
				self.logDebug(6, "Updating plugin: " + plugin.title, params);
				
				// pull abort flag out of event object, for use later
				var abort_jobs = 0;
				if (params.abort_jobs) {
					abort_jobs = params.abort_jobs;
					delete params.abort_jobs;
				}
				
				self.storage.listFindUpdate( 'global/plugins', { id: params.id }, params, function(err) {
					if (err) {
						return self.doError('plugin', "Failed to update plugin: " + err, callback);
					}
					
					// merge params into plugin, just so we have the full updated record
					for (var key in params) plugin[key] = params[key];
					
					self.logDebug(6, "Successfully updated plugin: " + plugin.title, params);
					self.logTransaction('plugin_update', plugin.title, self.getClientInfo(args, { plugin: params }));
					self.logActivity('plugin_update', { plugin: params }, args);
					
					callback({ code: 0 });
					
					// broadcast update to all websocket clients
					self.updateClientData( 'plugins' );
					
					// if plugin is disabled, abort all applicable jobs
					if (!plugin.enabled && abort_jobs) {
						var all_jobs = self.getAllActiveJobs(true);
						for (var key in all_jobs) {
							var job = all_jobs[key];
							if ((job.plugin == plugin.id) && !job.detached) {
								var msg = "Plugin '" + plugin.title + "' has been disabled.";
								self.logDebug(4, "Job " + job.id + " is being aborted: " + msg);
								self.abortJob({ id: job.id, reason: msg });
							} // matches plugin
						} // foreach job
					} // plugin disabled
					
					// if plugin is being enabled, force scheduler to re-tick the minute
					var dargs = Tools.getDateArgs( new Date() );
					if (params.enabled && !self.schedulerGraceTimer && !self.schedulerTicking && (dargs.sec != 59)) {
						self.schedulerMinuteTick( null, true );
					}
					
				} ); // update plugin
			} ); // find plugin
		} ); // load session
	},
	
	api_delete_plugin: function(args, callback) {
		// delete existing plugin
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
			
			// Do not allow deleting plugin if any matching events in schedule
			self.storage.listFind( 'global/schedule', { plugin: params.id }, function(err, item) {
				if (item) {
					return self.doError('plugin', "Failed to delete plugin: Still assigned to one or more events.", callback);
				}
				
				self.logDebug(6, "Deleting plugin: " + params.id);
				
				// Okay to delete
				self.storage.listFindDelete( 'global/plugins', { id: params.id }, function(err, plugin) {
					if (err) {
						return self.doError('plugin', "Failed to delete plugin: " + err, callback);
					}
					
					self.logDebug(6, "Successfully deleted plugin: " + plugin.title, plugin);
					self.logTransaction('plugin_delete', plugin.title, self.getClientInfo(args, { plugin: plugin }));
					self.logActivity('plugin_delete', { plugin: plugin }, args);
					
					callback({ code: 0 });
					
					// broadcast update to all websocket clients
					self.updateClientData( 'plugins' );
					
				} ); // listFindDelete
			} ); // listFind
		} ); // load session
	},
	
	requireValidPluginCommand: function(command, callback) {
		// make sure plugin command is valid
		if (command.match(/\s+(.+)$/)) {
			var cargs_raw = RegExp.$1;
			var cargs = sqparse( cargs_raw, {} );
			
			for (var idx = 0, len = cargs.length; idx < len; idx++) {
				var carg = cargs[idx];
				if (typeof(carg) == 'object') {
					return this.doError('plugin', "Plugin executable cannot contain any shell redirects or pipes.", callback);
				}
			}
		}
		
		return true;
	}
	
} );
