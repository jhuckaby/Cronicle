// Storage System - Standalone Mode
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var Class = require("pixl-class");
var Config = require("pixl-config");
var Storage = require("pixl-server-storage");

var server = {
	// mock pixl-server object
	debug: false,
	config: new Config({}),
	
	on: function() {},
	off: function() {},
	
	logger: {
		get: function(key) { return (key == 'debugLevel') ? 9 : ''; },
		set: function(key, value) { this[key] = value; },
		debug: function(level, msg, data) {
			if (server.debug) {
				if (data) console.log("[DEBUG] " + msg + " (" + JSON.stringify(data) + ")");
				else console.log("[DEBUG] " + msg);
			}
		},
		error: function(code, msg, data) {
			if (data) console.log("[ERROR] " + msg + " (" + JSON.stringify(data) + ")");
			else console.log("[ERROR] " + msg);
		},
		transaction: function(code, msg, data) {
			;
		}
	}
};

module.exports = Class.create({
	
	__parent: Storage,
	
	__construct: function(config, callback) {
		this.config = new Config(config);
		server.debug = !!this.config.get('debug');
		
		this.init( server, this.config );
		server.Storage = this;
		
		process.nextTick( function() {
			server.Storage.startup( callback || function() {;} );
		} );
	}
	
});
