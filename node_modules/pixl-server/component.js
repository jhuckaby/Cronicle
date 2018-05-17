// Server Component Base Class
// Copyright (c) 2014 Joseph Huckaby
// Released under the MIT License

var Class = require("pixl-class");

module.exports = Class.create({
	
	__name: 'Generic',
	
	server: null,
	config: null,
	defaultConfig: null,
	logger: null,
	
	__construct: function() {
		// class constructor
	},
	
	init: function(server, config) {
		// initialize and attach to server
		this.server = server;
		this.config = config || server.config.getSub( this.__name );
		this.logger = server.logger;
		
		// init config and monitor for reloads
		this.initConfig();
		this.config.on('reload', this.initConfig.bind(this));
	},
	
	initConfig: function() {
		// import default config
		if (this.defaultConfig) {
			var config = this.config.get();
			for (var key in this.defaultConfig) {
				if (typeof(config[key]) == 'undefined') {
					config[key] = this.defaultConfig[key];
				}
			}
		}
	},
	
	earlyStart: function() {
		// override in subclass, return false to interrupt startup
		return true;
	},
	
	startup: function(callback) {
		// override in subclass
		callback();
	},
	
	shutdown: function(callback) {
		// override in subclass
		callback();
	},
	
	debugLevel: function(level) {
		// check if we're logging at or above the requested level
		return (this.logger.get('debugLevel') >= level);
	},
	
	logDebug: function(level, msg, data) {
		// proxy request to system logger with correct component
		this.logger.set( 'component', this.__name );
		this.logger.debug( level, msg, data );
	},
	
	logError: function(code, msg, data) {
		// proxy request to system logger with correct component
		this.logger.set( 'component', this.__name );
		this.logger.error( code, msg, data );
	},
	
	logTransaction: function(code, msg, data) {
		// proxy request to system logger with correct component
		this.logger.set( 'component', this.__name );
		this.logger.transaction( code, msg, data );
	}
	
});
