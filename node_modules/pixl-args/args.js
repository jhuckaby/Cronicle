// Simple command-line argument parser
// Copyright (c) 2015, 2016 Joseph Huckaby
// Released under the MIT License

var util = require("util");
var Class = require("pixl-class");

// util.isArray is DEPRECATED??? Nooooooooode!
var isArray = Array.isArray || util.isArray;

module.exports = Class.create({
	
	args: null,
	
	__construct: function() {
		// class constructor
		var argv = null;
		var defaults = null;
		
		if (arguments.length == 2) {
			argv = arguments[0];
			defaults = arguments[1];
		}
		else if (arguments.length == 1) {
			if (isArray(arguments[0])) argv = arguments[0];
			else defaults = arguments[0];
		}
		
		if (!argv) {
			// default to node cmdline args
			// skip over first two, as they will be node binary & main script js
			argv = process.argv.slice(2);
		}
		this.parse(argv);
		
		// apply defaults
		if (defaults) {
			for (var key in defaults) {
				if (typeof(this.args[key]) == 'undefined') {
					this.args[key] = defaults[key];
				}
			}
		}
	},
	
	parse: function(argv, args) {
		// parse cmdline args (--key value)
		if (!args) args = {};
		var lastKey = '';
		
		for (var idx = 0, len = argv.length; idx < len; idx++) {
			var arg = argv[idx];
			if (arg.match(/^\-+(.+)$/)) {
				// -key or --key
				if (lastKey) args[lastKey] = true;
				arg = RegExp.$1.trim();
				lastKey = arg;
			}
			else if (lastKey) {
				// simple value, use last key
				if (typeof(arg) == 'string') {
					if (arg.match(/^\-?\d+$/)) arg = parseInt(arg);
					else if (arg.match(/^\-?\d+\.\d+$/)) arg = parseFloat(arg);
				}
				if (typeof(args[lastKey]) != 'undefined') {
					if (isArray(args[lastKey])) args[lastKey].push( arg );
					else args[lastKey] = [ args[lastKey], arg ];
				}
				else args[lastKey] = arg;
				lastKey = '';
			}
			else {
				// add non-keyed args to 'other'
				if (!args.other) args.other = [];
				if (isArray(args.other)) args.other.push( arg );
				else args.other = [ args.other, arg ];
			}
		} // foreach arg
		
		if (lastKey) args[lastKey] = true;
		this.args = args;
	},
	
	get: function(key) {
		return key ? this.args[key] : this.args;
	},
	
	set: function(key, value) {
		this.args[key] = value;
	}
	
});
