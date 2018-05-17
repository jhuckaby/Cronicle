// Cronicle API Layer - Administrative
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var assert = require("assert");
var async = require('async');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	//
	// Servers / Master Control
	// 
	
	api_check_add_server: function(args, callback) {
		// check if it is okay to manually add this server to a remote cluster
		// (This is a server-to-server API, sent from master to a potential remote slave)
		var self = this;
		var params = args.params;
		
		if (!this.requireParams(params, {
			master: /\S/,
			now: /^\d+$/,
			token: /\S/
		}, callback)) return;
		
		if (params.token != Tools.digestHex( params.master + params.now + this.server.config.get('secret_key') )) {
			return this.doError('server', "Secret keys do not match.  Please synchronize your config files.", callback);
		}
		if (this.multi.master) {
			return this.doError('server', "Server is already a master server, controlling its own cluster.", callback);
		}
		if (this.multi.masterHostname && (this.multi.masterHostname != params.master)) {
			return this.doError('server', "Server is already a member of a cluster (Master: " + this.multi.masterHostname + ")", callback);
		}
		
		callback({ code: 0, hostname: this.server.hostname, ip: this.server.ip });
	},
	
	api_add_server: function(args, callback) {
		// add any arbitrary server to cluster (i.e. outside of UDP broadcast range)
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			hostname: /\S/
		}, callback)) return;
		
		var hostname = params.hostname.toLowerCase();
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			// make sure server isn't already added
			if (self.slaves[hostname]) {
				return self.doError('server', "Server is already in cluster: " + hostname, callback);
			}
			
			// send HTTP request to server, to make sure we can reach it
			var api_url = self.getServerBaseAPIURL( hostname ) + '/app/check_add_server';
			var now = Tools.timeNow(true);
			var api_args = {
				master: self.server.hostname,
				now: now,
				token: Tools.digestHex( self.server.hostname + now + self.server.config.get('secret_key') )
			};
			self.logDebug(9, "Sending API request to remote server: " + api_url);
			
			// send request
			self.request.json( api_url, api_args, { timeout: 8 * 1000 }, function(err, resp, data) {
				if (err) {
					return self.doError('server', "Failed to contact server: " + err.message, callback );
				}
				if (resp.statusCode != 200) {
					return self.doError('server', "Failed to contact server: " + hostname + ": HTTP " + resp.statusCode + " " + resp.statusMessage, callback);
				}
				if (data.code != 0) {
					return self.doError('server', "Failed to add server to cluster: " + hostname + ": " + data.description, callback);
				}
				
				// replace user-entered hostname with one returned from server (check_add_server api response)
				// just in case user entered an IP, or some CNAME
				hostname = data.hostname;
				
				// re-check this, for sanity
				if (self.slaves[hostname]) {
					return self.doError('server', "Server is already in cluster: " + hostname, callback);
				}
				
				// one more sanity check, with the IP this time
				for (var key in self.slaves) {
					var slave = self.slaves[key];
					if (slave.ip == data.ip) {
						return self.doError('server', "Server is already in cluster: " + hostname + " (" + data.ip + ")", callback);
					}
				}
				
				// okay to add
				var stub = { hostname: hostname, ip: data.ip };
				self.logDebug(4, "Adding remote slave server to cluster: " + hostname, stub);
				self.addServer(stub, args);
				
				// add to global/servers list
				self.storage.listFind( 'global/servers', { hostname: hostname }, function(err, item) {
					if (item) {
						// server is already in list, just ignore and go
						return callback({ code: 0 });
					}
					
					// okay to add
					self.storage.listPush( 'global/servers', stub, function(err) {
						if (err) {
							// should never happen
							self.logError('server', "Failed to add server to storage: " + hostname + ": " + err);
						}
						
						// success
						callback({ code: 0 });
					} ); // listPush
				} ); // listFind
			} ); // http request
		} ); // load session
	},
	
	api_remove_server: function(args, callback) {
		// remove any manually-added server from cluster
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			hostname: /\S/
		}, callback)) return;
		
		var hostname = params.hostname.toLowerCase();
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			// do not allow removal of current master
			if (hostname == self.server.hostname) {
				return self.doError('server', "Cannot remove current master server: " + hostname, callback);
			}
			
			var slave = self.slaves[hostname];
			if (!slave) {
				return self.doError('server', "Server not found in cluster: " + hostname, callback);
			}
			
			// Do not allow removing server if it has any active jobs
			var all_jobs = self.getAllActiveJobs(true);
			for (var key in all_jobs) {
				var job = all_jobs[key];
				if (job.hostname == hostname) {
					var err = "Still has running jobs";
					return self.doError('server', "Failed to remove server: " + err, callback);
				} // matches server
			} // foreach job
			
			// okay to remove
			self.logDebug(4, "Removing remote slave server from cluster: " + hostname);
			self.removeServer({ hostname: hostname }, args);
			
			// delete from global/servers list
			self.storage.listFindDelete( 'global/servers', { hostname: hostname }, function(err) {
				if (err) {
					// should never happen
					self.logError('server', "Failed to remove server from storage: " + hostname + ": " + err);
				}
				
				// success
				callback({ code: 0 });
			} ); // listFindDelete
		} ); // load session
	},
	
	api_restart_server: function(args, callback) {
		// restart any server in cluster
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			hostname: /\S/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.logTransaction('server_restart', '', self.getClientInfo(args, params));
			self.logActivity('server_restart', params, args);
			
			var reason = "User request by: " + user.username;
			
			if (params.hostname == self.server.hostname) {
				// restart this server
				self.restartLocalServer({ reason: reason });
				callback({ code: 0 });
			}
			else {
				// restart another server in the cluster
				var slave = self.slaves[ params.hostname ];
				if (slave && slave.socket) {
					self.logDebug(6, "Sending remote restart command to: " + slave.hostname);
					slave.socket.emit( 'restart_server', { reason: reason } );
					callback({ code: 0 });
				}
				else {
					callback({ code: 1, description: "Could not locate server: " + params.hostname });
				}
			}
			
		} );
	},
	
	api_shutdown_server: function(args, callback) {
		// shutdown any server in cluster
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			hostname: /\S/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			args.user = user;
			args.session = session;
			
			self.logTransaction('server_shutdown', '', self.getClientInfo(args, params));
			self.logActivity('server_shutdown', params, args);
			
			var reason = "User request by: " + user.username;
			
			if (params.hostname == self.server.hostname) {
				// shutdown this server
				self.shutdownLocalServer({ reason: reason });
				callback({ code: 0 });
			}
			else {
				// shutdown another server in the cluster
				var slave = self.slaves[ params.hostname ];
				if (slave && slave.socket) {
					self.logDebug(6, "Sending remote shutdown command to: " + slave.hostname);
					slave.socket.emit( 'shutdown_server', { reason: reason } );
					callback({ code: 0 });
				}
				else {
					callback({ code: 1, description: "Could not locate server: " + params.hostname });
				}
			}
			
		} );
	},
	
	api_update_master_state: function(args, callback) {
		// update master state (i.e. scheduler enabled)
		var self = this;
		var params = args.params;
		if (!this.requireMaster(args, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, "state_update", callback)) return;
			
			args.user = user;
			args.session = session;
			
			// import params into state
			self.logDebug(4, "Updating master state:", params);
			self.logTransaction('state_update', '', self.getClientInfo(args, params));
			self.logActivity('state_update', params, args);
			
			if (params.enabled) {
				// need to re-initialize schedule if being enabled
				var now = Tools.normalizeTime( Tools.timeNow(), { sec: 0 } );
				var cursors = self.state.cursors;
				
				self.storage.listGet( 'global/schedule', 0, 0, function(err, items) {
					// got all schedule items
					for (var idx = 0, len = items.length; idx < len; idx++) {
						var item = items[idx];
						
						// reset cursor to now if event is NOT set to catch up
						if (!item.catch_up) {
							cursors[ item.id ] = now;
						}
					} // foreach item
					
					// now it's safe to enable
					Tools.mergeHashInto( self.state, params );
					self.authSocketEmit( 'update', { state: self.state } );
				} ); // loaded schedule
			} // params.enabled
			else {
				// not enabling scheduler, so merge right away
				Tools.mergeHashInto( self.state, params );
				self.authSocketEmit( 'update', { state: self.state } );
			}
			
			callback({ code: 0 });
		} );
	},
	
	api_get_activity: function(args, callback) {
		// get rows from activity log (with pagination)
		var self = this;
		var params = args.params;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireAdmin(session, user, callback)) return;
			
			self.storage.listGet( 'logs/activity', parseInt(params.offset || 0), parseInt(params.limit || 50), function(err, items, list) {
				if (err) {
					// no rows found, not an error for this API
					return callback({ code: 0, rows: [], list: { length: 0 } });
				}
				
				// success, return rows and list header
				callback({ code: 0, rows: items, list: list });
			} ); // got data
		} ); // loaded session
	}
	
} );
