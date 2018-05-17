// JSON Server Configuration System
// Loads config file and command-line arguments
// Copyright (c) 2014 Joseph Huckaby
// Released under the MIT License

var fs = require("fs");
var cp = require("child_process");
var dns = require("dns");
var os = require('os');

var Class = require("pixl-class");
var Args = require("pixl-args");
var Tools = require("pixl-tools");

var Config = module.exports = Class.create({
	
	configFile: "",
	config: null,
	args: null,
	subs: null,
	mod: 0,
	timer: null,
	freq: 10 * 1000,
	hostname: '',
	ip: '',
	
	__construct: function(thingy, watch, isa_sub) {
		// class constructor
		if (thingy) {
			if (typeof(thingy) == 'string') this.configFile = thingy;
			else {
				this.config = thingy;
				this.configFile = "";
			}
		}
		
		if (this.configFile) this.load();
		else if (!isa_sub) this.loadArgs();
		
		this.subs = {};
		
		if (watch && !isa_sub) {
			if (typeof(watch) == 'number') this.freq = watch;
			if (this.config.check_config_freq_ms) this.freq = this.config.check_config_freq_ms;
			this.monitor();
		}
	},
	
	load: function() {
		// load config and merge in cmdline
		var self = this;
		this.config = {};
		
		var stats = fs.statSync( this.configFile );
		this.mod = (stats && stats.mtime) ? stats.mtime.getTime() : 0;
		
		var config = JSON.parse( 
			fs.readFileSync( this.configFile, { encoding: 'utf8' } ) 
		);
		for (var key in config) {
			this.config[key] = config[key];
		}
		
		// cmdline args (--key value)
		this.loadArgs();
	},
	
	loadArgs: function() {
		// merge in cmdline args (--key value)
		var args = this.args = new Args();
		for (var key in args.get()) {
			this.config[key] = args.get(key);
		}
	},
	
	monitor: function() {
		// start monitoring file for changes
		this.timer = setInterval( this.check.bind(this), this.freq );
	},
	
	stop: function() {
		// stop monitoring file
		clearTimeout( this.timer );
	},
	
	check: function() {
		// check file for changes, reload if necessary
		var self = this;
		
		fs.stat( this.configFile, function(err, stats) {
			// ignore errors here due to possible race conditions
			var mod = (stats && stats.mtime) ? stats.mtime.getTime() : 0;
			
			if (mod && (mod != self.mod)) {
				// file has changed on disk, reload it async
				self.mod = mod;
				
				fs.readFile( self.configFile, { encoding: 'utf8' }, function(err, data) {
					// fs read complete
					if (err) {
						self.emit('error', "Failed to reload config file: " + self.configFile + ": " + err);
						return;
					}
					
					// now parse the JSON
					var config = null;
					try {
						config = JSON.parse( data );
					}
					catch (err) {
						self.emit('error', "Failed to parse config file: " + self.configFile + ": " + err);
						return;
					}
					
					// replace master copy
					self.config = config;
					
					// re-merge in cli args
					for (var key in self.args.get()) {
						self.config[key] = self.args.get(key);
					}
					
					// emit event for listeners
					self.emit('reload');
					
					// refresh subs
					self.refreshSubs();
					
				} ); // fs.readFile
			} // mod changed
		} ); // fs.stat
	},
	
	get: function(key) {
		// get single key or entire config hash
		return key ? this.config[key] : this.config;
	},
	
	set: function(key, value) {
		// set config value
		this.config[key] = value;
		
		// also set it in this.args so a file reload won't clobber it
		if (this.args) this.args.set(key, value);
	},
	
	getSub: function(key) {
		// get cloned Config object pointed at sub-key
		var sub = new Config( this.get(key) || {}, null, true );
		
		// keep track so we can refresh on reload
		this.subs[key] = sub;
		
		return sub;
	},
	
	refreshSubs: function() {
		// refresh sub key objects on a reload
		for (var key in this.subs) {
			var sub = this.subs[key];
			sub.config = this.get(key) || {};
			sub.emit('reload');
			sub.refreshSubs();
		}
	},
	
	getEnv: function(callback) {
		// determine environment (hostname and ip) async
		var self = this;
		
		// get hostname and ip (async ops)
		self.getHostname( function(err) {
			if (err) callback(err);
			else {
				self.getIPAddress( callback );
			}
		} );
	},
	
	getHostname: function(callback) {
		// determine server hostname
		this.hostname = (process.env['HOSTNAME'] || process.env['HOST'] || '').toLowerCase();
		if (this.hostname) {
			// well that was easy
			callback();
			return;
		}
		
		// try the OS module
		this.hostname = os.hostname().toLowerCase();
		if (this.hostname) {
			// well that was easy
			callback();
			return;
		}
		
		// sigh, the hard way (exec hostname binary)
		var self = this;
		child = cp.execFile('/bin/hostname', function (error, stdout, stderr) {
			self.hostname = stdout.toString().trim().toLowerCase();
			if (!self.hostname) {
				callback( new Error("Failed to determine server hostname via /bin/hostname") );
			}
			else callback();
		} );
	},
	
	getIPAddress: function(callback) {
		// determine server ip address
		var self = this;
		
		// try OS networkInterfaces() first
		// find the first external IPv4 address that doesn't match 169.254.
		var ifaces = os.networkInterfaces();
		var addrs = [];
		for (var key in ifaces) {
			addrs = addrs.concat( addrs, ifaces[key] );
		}
		
		var iaddrs = Tools.findObjects( addrs, { family: 'IPv4', internal: false } );
		for (var idx = 0, len = iaddrs.length; idx < len; idx++) {
			var addr = iaddrs[idx];
			if (addr && addr.address && addr.address.match(/^\d+\.\d+\.\d+\.\d+$/) && !addr.address.match(/^169\.254\./)) {
				// well that was easy
				this.ip = addr.address;
				callback();
				return;
			}
		}
		
		var addr = iaddrs[0];
		if (addr && addr.address && addr.address.match(/^\d+\.\d+\.\d+\.\d+$/)) {
			// this will allow 169.254. to be chosen only after all other non-internal IPv4s are considered
			this.ip = addr.address;
			callback();
			return;
		}
		
		// sigh, the hard way (DNS resolve the server hostname)
		dns.resolve4(this.hostname, function (err, addresses) {
			// if (err) callback(err);
			self.ip = addresses ? addresses[0] : '127.0.0.1';
			callback();
		} );
	}
	
});
