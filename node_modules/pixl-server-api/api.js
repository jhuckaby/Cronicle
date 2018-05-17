// Simple JSON API Server Component
// A component for the pixl-server daemon framework.
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var Class = require("pixl-class");
var Component = require("pixl-server/component");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	__name: 'API',
	__parent: Component,
	
	defaultConfig: {
		base_uri: '/api'
	},
	
	handlers: null,
	namespaces: null,
	
	normalizeAPIName: function(name) {
		// normalize API name, lower-case alphanumeric + slashes + dashes + dots only
		return name.toString().toLowerCase().replace(/[^\w\/\-\.]+/g, '');
	},
	
	addHandler: function(name, callback) {
		// add handler method for root-level API, e.g. /api/add_user
		name = this.normalizeAPIName(name);
		this.logDebug(3, "Adding API handler for: " + name);
		this.handlers[name] = callback;
	},
	
	addNamespace: function(name, prefix, obj) {
		// add namespace (API class), e.g. /api/user/add
		name = this.normalizeAPIName(name);
		this.logDebug(3, "Adding API namespace: " + name);
		this.namespaces[name] = {
			regexp: new RegExp( Tools.escapeRegExp(this.config.get('base_uri') + "/" + name + "/" ) + "(\\w+)" ),
			prefix: prefix || "",
			obj: obj
		};
	},
	
	startup: function(callback) {
		// start api service
		this.logDebug(3, "API service listening for base URI: " + this.config.get('base_uri') );
		
		this.handlers = {};
		this.namespaces = {};
		
		// add web server handler for API requests
		var regex = new RegExp( Tools.escapeRegExp(this.config.get('base_uri')) + "/(\\w+)" );
		this.server.WebServer.addURIHandler( regex, "API", this.handler.bind(this) );
		
		// save regex for later (internal invoke)
		this.uri_regex = regex;
		
		callback();
	},
	
	handler: function(args, callback) {
		// handle API request, delegate to class or method
		var uri = args.request.url.replace(/\?.*$/, '');
		var name = args.matches[1]; // /api/add_user
		name = this.normalizeAPIName(name);
		
		this.logDebug(6, "Handling API request: " + args.request.method + ' ' + args.request.url, args.query);
		this.logDebug(9, "API Params", args.params );
		
		// Check root-level API handlers first
		if (this.handlers[name]) {
			this.logDebug(9, "Activating API handler: " + name + " for URI: " + uri);
			this.handlers[name]( args, callback );
		}
		else if (this.namespaces[name]) {
			// We have a class handling this namespace
			var ns = this.namespaces[name];
			var matches = uri.match(ns.regexp);
			if (matches) {
				// Well-formed namespaced URI, e.g. /api/user/add
				var subname = ns.prefix + matches[1];
				if (subname in ns.obj) {
					// Namespace class supports the API call
					this.logDebug(9, "Activating namespaced API handler: " + name + "/" + subname + " for URI: " + uri);
					ns.obj[subname]( args, callback );
				}
				else {
					var err_msg = "Unsupported API: " + name + "/" + subname;
					this.logError('api', err_msg);
					callback({
						code: 1,
						description: err_msg
					});
				}
			}
			else {
				var err_msg = "Invalid API URL: " + uri;
				this.logError('api', err_msg);
				callback({
					code: 1,
					description: err_msg
				});
			}
		}
		else {
			// Not found
			var err_msg = "Unsupported API: " + name;
			this.logError('api', err_msg);
			callback({
				code: 1,
				description: err_msg
			});
		}
	},
	
	invoke: function(uri, params, callback) {
		// invoke a JSON API internally, and capture the response
		var args = {
			request: {
				method: "INTERNAL",
				url: uri,
				headers: { 'host': 'Internal', 'user-agent': 'Internal' }
			},
			response: {},
			query: Tools.parseQueryString(uri),
			matches: uri.match( this.uri_regex ),
			params: params,
			files: {},
			cookies: {},
			ip: '0.0.0.0',
			ips: ['0.0.0.0'],
			server: this.server
		};
		
		if (!args.matches) {
			return callback({ code: 1, description: "Invalid API URL: " + uri });
		}
		
		this.handler( args, callback );
	},
	
	shutdown: function(callback) {
		// shutdown api service
		callback();
	}
	
});
