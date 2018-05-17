// Generic Server Daemon
// Copyright (c) 2014 Joseph Huckaby
// Released under the MIT License

var path = require('path');
var fs = require('fs');
var os = require('os');
var async = require('async');
var mkdirp = require('mkdirp');

var Class  = require("pixl-class");
var Logger = require("pixl-logger");
var Config = require("pixl-config");
var Tools  = require("pixl-tools");
var Args   = require("pixl-args");

module.exports = Class.create({
	
	__name: "Generic Server",
	__version: "1.0",
	
	configFile: "",
	config: null,
	components: null,
	tickTimer: null,
	lastTickDate: null,
	
	__construct: function(overrides) {
		// class constructor
		if (overrides) {
			for (var key in overrides) {
				this[key] = overrides[key];
			}
		}
		if (this.components) {
			// components specified in constructor
			for (var idx = 0, len = this.components.length; idx < len; idx++) {
				var compClass = this.components[idx];
				var comp = new compClass();
				this.components[idx] = comp;
				this[ comp.__name ] = comp;
			}
		}
		else {
			// will add() components later
			this.components = [];
		}
	},
	
	add: function() {
		// register one or more server components
		for (var idx = 0, len = arguments.length; idx < len; idx++) {
			var compClass = arguments[idx];
			var comp = new compClass();
			this.components.push( comp );
			this[ comp.__name ] = comp;
		}
	},
	
	__init: function(callback) {
		// server initialization, private method (call startup() instead)
		var self = this;
		
		// allow CLI to override configFile
		var args = new Args();
		if (args.get('configFile')) this.configFile = args.get('configFile');
		else if (args.get('config')) this.configFile = args.get('config');
		
		// parse config file and cli args
		this.config = new Config( this.configFile || this.config, true );
		
		// allow class to override config
		if (this.configOverrides) {
			for (var key in this.configOverrides) {
				this.config.set(key, this.configOverrides[key]);
			}
		}
		
		this.debug = this.config.get('debug') || false;
		this.echo = this.config.get('echo') || false;
		this.color = this.config.get('color') || false;
		
		// create base log dir
		if (this.config.get('log_dir')) {
			try {
				mkdirp.sync( this.config.get('log_dir') );
			}
			catch (e) {
				var msg = "FATAL ERROR: Log directory could not be created: " + this.config.get('log_dir') + ": " + e;
				throw new Error(msg);
			}
		} // log_dir
		
		// setup log agent
		this.logger = new Logger(
			path.join( (this.config.get('log_dir') || '.'), (this.config.get('log_filename') || 'event.log') ),
			this.config.get('log_columns') || ['hires_epoch', 'date', 'hostname', 'component', 'category', 'code', 'msg', 'data'],
			{ echo: this.echo, color: this.color, hostname: os.hostname() }
		);
		this.logger.set( 'debugLevel', this.config.get('debug_level') || 1 );
		this.logDebug(1, this.__name + " v" + this.__version + " Starting Up");
		
		// if echoing log, capture stdout errors in case user pipes us to something then hits ctrl-c
		if (this.echo) process.stdout.on('error', function() {});
		
		// init components
		this.initComponents();
		
		// allow components to hook post init and possibly interrupt startup
		if (!this.earlyStartComponents()) return;
		
		// become a daemon unless in debug mode
		if (!this.debug) {
			// pass --expose_gc down to daemon process if enabled
			if (!process.env.__daemon && global.gc) {
				var cli_args = this.config.get('gc_cli_args') || ['--expose_gc', '--always_compact'];
				cli_args.reverse().forEach( function(arg) {
					process.argv.splice( 1, 0, arg );
				} );
			}
			
			// respawn as daemon or continue if we are already one
			require('daemon')({
				cwd: process.cwd() // workaround for https://github.com/indexzero/daemon.node/issues/41
			});
			
			// log crashes before exiting
			if (this.config.get('log_crashes')) {
				require('uncatch').on('uncaughtException', function(err) {
					fs.appendFileSync( path.join(self.config.get('log_dir'), 'crash.log'),
						(new Date()).toString() + "\n" + 
						err.stack + "\n\n"
					);
					// do not call exit here, as uncatch handles that
				});
			}
		} // not in debug mode
		
		// write pid file
		if (this.config.get('pid_file')) {
			try { fs.writeFileSync( this.config.get('pid_file'), process.pid ); }
			catch (e) {
				var msg = "FATAL ERROR: PID file could not be created: " + this.config.get('pid_file') + ": " + e;
				throw new Error(msg);
			}
		}
		
		// determine server hostname and ip, create dirs
		this.config.getEnv( function(err) {
			if (err) throw(err);
			
			self.hostname = self.config.hostname;
			self.ip = self.config.ip;
			
			callback();
		} );
	},
	
	startup: function(callback) {
		// setup server and fire callback
		var self = this;
		
		this.__init( function() {
			self.startupFinish(callback);
		} );
	},
	
	startupFinish: function(callback) {
		// finish startup sequence
		var self = this;
		
		// finish log setup
		this.logger.set({ hostname: this.hostname, ip: this.ip });
		
		// this may contain secrets, so only logging it at level 10
		this.logDebug(10, "Configuration", this.config.get());
		
		this.logDebug(2, "Server IP: " + this.ip + ", Daemon PID: " + process.pid);
		
		// listen for shutdown events
		process.on('SIGINT', function() { 
			self.logDebug(1, "Caught SIGINT");
			self.shutdown(); 
		} );
		process.on('SIGTERM', function() { 
			self.logDebug(1, "Caught SIGTERM");
			self.shutdown(); 
		} );
		
		// monitor config changes
		this.config.on('reload', function() {
			self.logDebug(2, "Configuration was reloaded", self.config.get());
		} );
		this.config.on('error', function(err) {
			self.logDebug(1, "Config reload error:" + err);
		} );
		
		// notify listeners we are starting components
		this.emit('prestart');
		
		// load components (async)
		async.eachSeries( this.components, 
			function(comp, callback) {
				// start component
				self.logDebug(3, "Starting component: " + comp.__name);
				comp.startup( callback );
			},
			function(err) {
				// all components started
				if (err) {
					self.logError(1, "Component startup error: " + err);
					self.shutdown();
				}
				else self.run(callback);
			}
		); // foreach component
	},
	
	initComponents: function() {
		// initialize all components (on startup and config reload)
		for (var idx = 0, len = this.components.length; idx < len; idx++) {
			this.components[idx].init( this );
		}
	},
	
	earlyStartComponents: function() {
		// allow components to perform early startup functions
		// return false to abort startup (allows component to take over before daemon fork)
		for (var idx = 0, len = this.components.length; idx < len; idx++) {
			var result = this.components[idx].earlyStart();
			if (result === false) return false;
		}
		return true;
	},
	
	run: function(callback) {
		// this is called at the very end of the startup process
		// all components are started
		
		// optionally change uid if desired (only works if we are root)
		// TODO: The log file will already be created as root, and will fail after switching users
		if (!this.debug && this.config.get('uid') && (process.getuid() == 0)) {
			this.logDebug(4, "Switching to user: " + this.config.get('uid') );
			process.setuid( this.config.get('uid') );
		}
		
		// start tick timer for periodic tasks
		this.lastTickDate = Tools.getDateArgs( new Date() );
		this.tickTimer = setInterval( this.tick.bind(this), 1000 );
		
		// start server main loop
		this.logDebug(2, "Startup complete, entering main loop");
		this.emit('ready');
		this.started = Tools.timeNow(true);
		
		// fire callback if provided
		if (callback) callback();
	},
	
	tick: function() {
		// run every second, for periodic tasks
		this.emit('tick');
		
		// also emit minute, hour and day events when they change
		var dargs = Tools.getDateArgs( new Date() );
		if (dargs.min != this.lastTickDate.min) {
			this.emit('minute', dargs);
			this.emit( dargs.hh + ':' + dargs.mi, dargs );
			this.emit( ':' + dargs.mi, dargs );
		}
		if (dargs.hour != this.lastTickDate.hour) this.emit('hour', dargs);
		if (dargs.mday != this.lastTickDate.mday) this.emit('day', dargs);
		if (dargs.mon != this.lastTickDate.mon) this.emit('month', dargs);
		if (dargs.year != this.lastTickDate.year) this.emit('year', dargs);
		this.lastTickDate = dargs;
	},
	
	shutdown: function(callback) {
		// shutdown all components
		var self = this;
		this.logger.set('sync', true);
		
		// delete pid file
		if (this.config.get('pid_file')) {
			try { fs.unlinkSync( this.config.get('pid_file') ); }
			catch (e) {;}
		}
		
		if (this.shut) {
			// if shutdown() is called twice, something is very wrong
			this.logDebug(1, "EMERGENCY: Shutting down immediately");
			process.exit(1);
		}
		this.shut = true;
		this.logDebug(1, "Shutting down");
		
		// stop tick timer
		if (this.tickTimer) {
			clearTimeout( this.tickTimer );
			delete this.tickTimer;
		}
		
		// stop config monitor
		this.config.stop();
		
		// if startup was interrupted, exit immediately
		if (!this.started) {
			this.logError(1, "Startup process was interrupted, exiting");
			this.emit('shutdown');
			process.exit(1);
		}
		
		// stop components
		async.eachSeries( this.components.reverse(), 
			function(comp, callback) {
				// stop component
				self.logDebug(3, "Stopping component: " + comp.__name);
				comp.shutdown( callback );
			},
			function(err) {
				// all components stopped
				self.components = [];
				if (err) {
					self.logError(1, "Component shutdown error: " + err);
					process.exit(1);
				}
				else {
					self.logDebug(2, "Shutdown complete, exiting");
					self.emit('shutdown');
					if (callback) callback();
				}
			}
		); // foreach component
	},
	
	debugLevel: function(level) {
		// check if we're logging at or above the requested level
		return (this.logger.get('debugLevel') >= level);
	},
	
	logDebug: function(level, msg, data) { 
		this.logger.set( 'component', this.__name );
		this.logger.debug(level, msg, data); 
	},
	
	logError: function(code, msg, data) { 
		this.logger.set( 'component', this.__name );
		this.logger.error(code, msg, data); 
	},
	
	logTransaction: function(code, msg, data) { 
		this.logger.set( 'component', this.__name );
		this.logger.transaction(code, msg, data); 
	}
	
});
