// Cronicle API Layer
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var assert = require("assert");
var async = require('async');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	__mixins: [
		require('./api/config.js'),
		require('./api/category.js'),
		require('./api/group.js'),
		require('./api/plugin.js'),
		require('./api/event.js'),
		require('./api/job.js'),
		require('./api/admin.js'),
		require('./api/apikey.js')
	],
	
	api_ping: function(args, callback) {
		// hello
		callback({ code: 0 });
	},
	
	api_echo: function(args, callback) {
		// for testing: adds 1 second delay, echoes everything back
		setTimeout( function() {
			callback({
				code: 0,
				query: args.query || {},
				params: args.params || {},
				files: args.files || {}
			});
		}, 1000 );
	},
	
	api_check_user_exists: function(args, callback) {
		// checks if username is taken (used for showing green checkmark on form)
		var self = this;
		var query = args.query;
		var path = 'users/' + this.usermgr.normalizeUsername(query.username);
		
		if (!this.requireParams(query, {
			username: this.usermgr.usernameMatch
		}, callback)) return;
		
		// do not cache this API response
		this.forceNoCacheResponse(args);
		
		this.storage.get(path, function(err, user) {
			callback({ code: 0, user_exists: !!user });
		} );
	},
	
	forceNoCacheResponse: function(args) {
		// make sure this response isn't cached, ever
		args.response.setHeader( 'Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate' );
		args.response.setHeader( 'Expires', 'Thu, 01 Jan 1970 00:00:00 GMT' );
	},
	
	getServerBaseAPIURL: function(hostname, ip) {
		// construct fully-qualified URL to API on specified hostname
		// use proper protocol and ports as needed
		var api_url = '';
		
		if (ip && !this.server.config.get('server_comm_use_hostnames')) hostname = ip;
		
		if (this.web.config.get('https') && this.web.config.get('https_force')) {
			api_url = 'https://' + hostname;
			if (this.web.config.get('https_port') != 443) api_url += ':' + this.web.config.get('https_port');
		}
		else {
			api_url = 'http://' + hostname;
			if (this.web.config.get('http_port') != 80) api_url += ':' + this.web.config.get('http_port');
		}
		api_url += this.api.config.get('base_uri');
		
		return api_url;
	},
	
	validateOptionalParams: function(params, rules, callback) {
		// vaildate optional params given rule set
		assert( arguments.length == 3, "Wrong number of arguments to validateOptionalParams" );
		
		for (var key in rules) {
			if (key in params) {
				var rule = rules[key];
				var type_regexp = rule[0];
				var value_regexp = rule[1];
				var value = params[key];
				var type_value = typeof(value);
				
				if (!type_value.match(type_regexp)) {
					this.doError('api', "Malformed parameter type: " + key + " (" + type_value + ")", callback);
					return false;
				}
				else if (!value.toString().match(value_regexp)) {
					this.doError('api', "Malformed parameter value: " + key, callback);
					return false;
				}
			}
		}
		
		return true;
	},
	
	requireValidEventData: function(event, callback) {
		// make sure params contains valid event data (optional params)
		// otherwise throw an API error and return false
		// used by create_event, update_event, run_event and update_job APIs
		var RE_TYPE_STRING = /^(string)$/,
			RE_TYPE_BOOL = /^(boolean|number)$/,
			RE_TYPE_NUM = /^(number)$/,
			RE_ALPHANUM = /^\w+$/, 
			RE_POS_INT = /^\d+$/, 
			RE_BOOL = /^(\d+|true|false)$/;
		
		var rules = {
			algo: [RE_TYPE_STRING, RE_ALPHANUM],
			api_key: [RE_TYPE_STRING, RE_ALPHANUM],
			catch_up: [RE_TYPE_BOOL, RE_BOOL],
			category: [RE_TYPE_STRING, RE_ALPHANUM],
			chain: [RE_TYPE_STRING, /^\w*$/],
			chain_error: [RE_TYPE_STRING, /^\w*$/],
			cpu_limit: [RE_TYPE_NUM, RE_POS_INT],
			cpu_sustain: [RE_TYPE_NUM, RE_POS_INT],
			created: [RE_TYPE_NUM, RE_POS_INT],
			detached: [RE_TYPE_BOOL, RE_BOOL],
			enabled: [RE_TYPE_BOOL, RE_BOOL],
			id: [RE_TYPE_STRING, RE_ALPHANUM],
			log_max_size: [RE_TYPE_NUM, RE_POS_INT],
			max_children: [RE_TYPE_NUM, RE_POS_INT],
			memory_limit: [RE_TYPE_NUM, RE_POS_INT],
			memory_sustain: [RE_TYPE_NUM, RE_POS_INT],
			modified: [RE_TYPE_NUM, RE_POS_INT],
			multiplex: [RE_TYPE_BOOL, RE_BOOL],
			notes: [RE_TYPE_STRING, /.*/],
			notify_fail: [RE_TYPE_STRING, /.*/],
			notify_success: [RE_TYPE_STRING, /.*/],
			plugin: [RE_TYPE_STRING, RE_ALPHANUM],
			queue: [RE_TYPE_BOOL, RE_BOOL],
			queue_max: [RE_TYPE_NUM, RE_POS_INT],
			retries: [RE_TYPE_NUM, RE_POS_INT],
			retry_delay: [RE_TYPE_NUM, RE_POS_INT],
			stagger: [RE_TYPE_NUM, RE_POS_INT],
			target: [RE_TYPE_STRING, /^[\w\-\.]+$/],
			timeout: [RE_TYPE_NUM, RE_POS_INT],
			timezone: [RE_TYPE_STRING, /.*/],
			title: [RE_TYPE_STRING, /\S/],
			username: [RE_TYPE_STRING, /^[\w\-\.]+$/],
			web_hook: [RE_TYPE_STRING, /(^$|https?\:\/\/\S+$)/i]
		};
		if (!this.validateOptionalParams(event, rules, callback)) return false;
		
		// params
		if (("params" in event) && (typeof(event.params) != 'object')) {
			this.doError('api', "Malformed event parameter: params (must be object)", callback);
			return false;
		}
		
		// timing (can be falsey, or object)
		if (event.timing) {
			if (typeof(event.timing) != 'object') {
				this.doError('api', "Malformed event parameter: timing (must be object)", callback);
				return false;
			}
			
			// check timing keys, should all be arrays of ints
			var timing = event.timing;
			for (var key in timing) {
				if (!key.match(/^(years|months|days|weekdays|hours|minutes)$/)) {
					this.doError('api', "Unknown event timing parameter: " + key, callback);
					return false;
				}
				var values = timing[key];
				if (!Tools.isaArray(values)) {
					this.doError('api', "Malformed event timing parameter: " + key + " (must be array)", callback);
					return false;
				}
				for (var idx = 0, len = values.length; idx < len; idx++) {
					var value = values[idx];
					if (typeof(value) != 'number') {
						this.doError('api', "Malformed event timing parameter: " + key + " (must be array of numbers)", callback);
						return false;
					}
					if ((key == 'years') && (value < 1)) {
						this.doError('api', "Malformed event timing parameter: " + key + " (value out of range: " + value + ")", callback);
						return false;
					}
					if ((key == 'months') && ((value < 1) || (value > 12))) {
						this.doError('api', "Malformed event timing parameter: " + key + " (value out of range: " + value + ")", callback);
						return false;
					}
					if ((key == 'days') && ((value < 1) || (value > 31))) {
						this.doError('api', "Malformed event timing parameter: " + key + " (value out of range: " + value + ")", callback);
						return false;
					}
					if ((key == 'weekdays') && ((value < 0) || (value > 6))) {
						this.doError('api', "Malformed event timing parameter: " + key + " (value out of range: " + value + ")", callback);
						return false;
					}
					if ((key == 'hours') && ((value < 0) || (value > 23))) {
						this.doError('api', "Malformed event timing parameter: " + key + " (value out of range: " + value + ")", callback);
						return false;
					}
					if ((key == 'minutes') && ((value < 0) || (value > 59))) {
						this.doError('api', "Malformed event timing parameter: " + key + " (value out of range: " + value + ")", callback);
						return false;
					}
				}
			}
		} // timing
		
		return true;
	},
	
	requireValidUser: function(session, user, callback) {
		// make sure user and session are valid
		// otherwise throw an API error and return false
		
		if (session && (session.type == 'api')) {
			// session is simulated, created by API key
			if (!user) {
				return this.doError('api', "Invalid API Key: " + session.api_key, callback);
			}
			if (!user.active) {
				return this.doError('api', "API Key is disabled: " + session.api_key, callback);
			}
			return true;
		} // api key
		
		if (!session) {
			return this.doError('session', "Session has expired or is invalid.", callback);
		}
		if (!user) {
			return this.doError('user', "User not found: " + session.username, callback);
		}
		if (!user.active) {
			return this.doError('user', "User account is disabled: " + session.username, callback);
		}
		return true;
	},
	
	requireAdmin: function(session, user, callback) {
		// make sure user and session are valid, and user is an admin
		// otherwise throw an API error and return false
		if (!this.requireValidUser(session, user, callback)) return false;
		
		if (session.type == 'api') {
			// API Keys cannot be admins
			return this.doError('api', "API Key cannot use administrator features", callback);
		}
		
		if (!user.privileges.admin) {
			return this.doError('user', "User is not an administrator: " + session.username, callback);
		}
		
		return true;
	},
	
	requirePrivilege: function(user, priv_id, callback) {
		// make sure user has the specified privilege
		// otherwise throw an API error and return false
		if (user.privileges.admin) return true; // admins can do everything
		if (user.privileges[priv_id]) return true;
		
		if (user.key) {
			return this.doError('api', "API Key ('"+user.title+"') does not have the required privileges to perform this action ("+priv_id+").", callback);
		}
		else {
			return this.doError('user', "User '"+user.username+"' does not have the required account privileges to perform this action ("+priv_id+").", callback);
		}
	},
	
	requireMaster: function(args, callback) {
		// make sure we are the master server
		// otherwise throw an API error and return false
		if (this.multi.master) return true;
		
		var status = "200 OK";
		var headers = {};
		
		if (this.multi.masterHostname) {
			// we know who master is, so let's give the client a hint
			status = "302 Found";
			
			var url = '';
			if (this.web.config.get('https') && this.web.config.get('https_force')) {
				url = 'https://' + this.multi.masterHostname;
				if (this.web.config.get('https_port') != 443) url += ':' + this.web.config.get('https_port');
			}
			else {
				url = 'http://' + this.multi.masterHostname;
				if (this.web.config.get('http_port') != 80) url += ':' + this.web.config.get('http_port');
			}
			url += args.request.url;
			
			headers['Location'] = url;
		}
		
		var msg = "This API call can only be invoked on the master server.";
		// this.logError( 'master', msg );
		callback( { code: 'master', description: msg }, status, headers );
		return false;
	},
	
	getClientInfo: function(args, params) {
		// proxy over to user module
		// var info = this.usermgr.getClientInfo(args, params);
		var info = null;
		if (params) info = Tools.copyHash(params, true);
		else info = {};
		
		info.ip = args.ip;
		info.headers = args.request.headers;
		
		// augment with our own additions
		if (args.admin_user) info.username = args.admin_user.username;
		else if (args.user) {
			if (args.user.key) {
				// API Key
				info.api_key = args.user.key;
				info.api_title = args.user.title;
			}
			else {
				info.username = args.user.username;
			}
		}
		
		return info;
	},
	
	loadSession: function(args, callback) {
		// Load user session or validate API Key
		var self = this;
		var session_id = args.cookies['session_id'] || args.request.headers['x-session-id'] || args.params.session_id || args.query.session_id;
		
		if (session_id) {
			this.storage.get('sessions/' + session_id, function(err, session) {
				if (err) return callback(err, null, null);
				
				// also load user
				self.storage.get('users/' + self.usermgr.normalizeUsername(session.username), function(err, user) {
					if (err) return callback(err, null, null);
					
					// set type to discern this from API Key sessions
					session.type = 'user';
					
					// get session_id out of args.params, so it doesn't interfere with API calls
					delete args.params.session_id;
					
					// pass both session and user to callback
					callback(null, session, user);
				} );
			} );
			return;
		}
		
		// no session found, look for API Key
		var api_key = args.request.headers['x-api-key'] || args.params.api_key || args.query.api_key;
		if (!api_key) return callback( new Error("No Session ID or API Key could be found"), null, null );
		
		this.storage.listFind( 'global/api_keys', { key: api_key }, function(err, item) {
			if (err) return callback(new Error("API Key is invalid: " + api_key), null, null);
			
			// create simulated session and user objects
			var session = {
				type: 'api',
				api_key: api_key
			};
			var user = item;
			
			// get api_key out of args.params, so it doesn't interfere with API calls
			delete args.params.api_key;
			
			// pass both "session" and "user" to callback
			callback(null, session, user);
		} );
		return;
	},
	
	requireParams: function(params, rules, callback) {
		// proxy over to user module
		assert( arguments.length == 3, "Wrong number of arguments to requireParams" );
		return this.usermgr.requireParams(params, rules, callback);
	},
	
	doError: function(code, msg, callback) {
		// proxy over to user module
		assert( arguments.length == 3, "Wrong number of arguments to doError" );
		return this.usermgr.doError( code, msg, callback );
	}
	
});
