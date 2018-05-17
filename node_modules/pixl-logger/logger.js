// Generic Logger Class for Node.JS
// Copyright (c) 2012 - 2017 Joseph Huckaby and PixlCore.com
// Released under the MIT License

var fs = require('fs');
var zlib = require('zlib');
var Path = require('path');
var os = require('os');
var async = require('async');
var mkdirp = require('mkdirp');
var glob = require('glob');
var chalk = require('chalk');

var Class = require("pixl-class");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	columnColors: ['gray', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan'],
	dividerColor: 'dim',
	
	pather: null,
	filter: null,
	serializer: null,
	echoer: null,
	
	__construct: function(path, columns, args) {
		// create new logger instance
		var self = this;
		
		this.path = path;
		this.columns = columns;
		this.args = args ? Tools.copyHash(args, true) : {};
		
		if (!this.args.debugLevel) this.args.debugLevel = 1;
		if (!this.args.hostname) {
			this.args.hostname = os.hostname().toLowerCase();
		}
		if (!this.args.pid) this.args.pid = process.pid;
		
		// pass hooks in args
		['pather', 'filter', 'serializer', 'echoer'].forEach( function(key) {
			if (self.args[key]) {
				self[key] = self.args[key];
				delete self.args[key];
			}
		});
	},
	
	get: function(key) {
		// get one arg, or all of them
		return key ? this.args[key] : this.args;
	},
	
	set: function() {
		// set one or more args, pass in key,value or args obj
		if (arguments.length == 2) {
			if (arguments[0].toString().match(/^(pather|filter|serializer|echoer)$/)) this[arguments[0]] = arguments[1];
			else this.args[ arguments[0] ] = arguments[1];
		}
		else if (arguments.length == 1) {
			for (var key in arguments[0]) this.set(key, arguments[0][key]);
		}
	},
	
	print: function(args) {
		// setup date/time stuff
		var now = args.now ? args.now : new Date();
		delete args.now;
		var dargs = Tools.getDateArgs(now);
		
		// import args into object
		for (var key in args) this.args[key] = args[key];
		// for (var key in dargs) this.args[key] = dargs[key];
		
		// set automatic column values
		this.args.hires_epoch = now.getTime() / 1000;
		this.args.epoch = Math.floor( this.args.hires_epoch );
		this.args.date = dargs.yyyy_mm_dd.replace(/\//g, '-') + ' ' + dargs.hh_mi_ss;
		
		// populate columns
		var cols = [];
		for (var idx = 0, len = this.columns.length; idx < len; idx++) {
			var col = this.columns[idx];
			var val = this.args[col];
			
			if ((typeof(val) == 'undefined') || (val === null) || !val.toString) val = '';
			
			if (this.filter) {
				cols.push( this.filter(val, idx) );
			}
			else {
				if (typeof(val) == 'object') val = JSON.stringify(val);
				cols.push( val.toString().replace(/[\r\n]/g, ' ').replace(/\]\[/g, '') );
			}
		}
		
		// compose log row
		var line = this.serializer ? this.serializer(cols, this.args) : ('[' + cols.join('][') + "]\n");
		this.lastRow = line;
		
		// file path may have placeholders, expand these if necessary
		var path = this.path;
		if (this.pather) {
			path = this.pather( path, this.args );
		}
		else if (path.indexOf('[') > -1) {
			path = Tools.substitute( path, this.args );
		}
		
		// append to log
		if (this.args.sync) fs.appendFileSync(path, line);
		else fs.appendFile(path, line, function() {});
		
		// echo to console if desired
		if (this.args.echo) {
			if (this.echoer) {
				if (typeof(this.echoer) == 'function') {
					this.echoer( line, cols, this.args );
				}
				else if (typeof(this.echoer) == 'string') {
					if (this.args.sync) fs.appendFileSync(this.echoer, line);
					else fs.appendFile(this.echoer, line, function() {});
				}
			}
			else if (this.args.color) {
				var ccols = [];
				var nclrs = this.columnColors.length;
				var dclr = chalk[ this.dividerColor ];
				
				for (var idx = 0, len = cols.length; idx < len; idx++) {
					ccols.push( chalk[ this.columnColors[idx % nclrs] ]( cols[idx] ) );
				}
				process.stdout.write(
					dclr('[') + ccols.join( dclr('][') ) + dclr(']') + "\n" 
				);
			} // color
			else {
				process.stdout.write(line);
			}
		}
		
		// emit row as an event
		this.emit( 'row', line, cols, this.args );
	},
	
	debug: function(level, msg, data) {
		// simple debug log implementation, expects 'code' and 'msg' named columns in log
		// only logs if level is less than or equal to current debugLevel arg
		if (level <= this.args.debugLevel) {
			this.print({ 
				category: 'debug', 
				code: level, 
				msg: msg, 
				data: data 
			});
		}
	},
	
	error: function(code, msg, data) {
		// simple error log implementation, expects 'code' and 'msg' named columns in log
		this.print({ 
			category: 'error', 
			code: code, 
			msg: msg, 
			data: data 
		});
	},
	
	transaction: function(code, msg, data) {
		// simple debug log implementation, expects 'code' and 'msg' named columns in log
		this.print({ 
			category: 'transaction', 
			code: code, 
			msg: msg, 
			data: data 
		});
	},
	
	rotate: function() {
		// rotate any log file atomically (defaults to our own file)
		// 2 arg convention: dest_path, callback
		// 3 arg convention: log_file, dest_path, callback
		var log_file = '';
		var dest_path = '';
		var callback = null;
		
		if (arguments.length == 3) {
			log_file = arguments[0];
			dest_path = arguments[1];
			callback = arguments[2];
		}
		else if (arguments.length == 2) {
			dest_path = arguments[0];
			callback = arguments[1];
		}
		else throw new Error("Wrong number of arguments to rotate()");
		
		if (!log_file) log_file = this.path;
		if (log_file.indexOf('[') > -1) {
			log_file = Tools.substitute( log_file, this.args );
		}
		
		// if dest path ends with a slash, add src filename + date/time stamp
		if (dest_path.match(/\/$/)) {
			var dargs = Tools.getDateArgs( Tools.timeNow() );
			dest_path += Path.basename(log_file);
			dest_path += '.' + (dargs.yyyy_mm_dd + '-' + dargs.hh_mi_ss).replace(/\W+/g, '-');
			dest_path += '.' + Tools.generateUniqueID(16) + Path.extname(log_file);
		}
		
		// try fs.rename first
		fs.rename(log_file, dest_path, function(err) {
			if (err && (err.code == 'EXDEV')) {
				// dest path crosses fs boundary, gotta rename + copy + rename + delete
				
				// first, perform local rename in source log directory
				var src_temp_file = log_file + '.' + Tools.generateUniqueID(32) + '.tmp';
				fs.rename(log_file, src_temp_file, function(err) {
					if (err) {
						if (callback) callback(err);
						return;
					}
					
					// copy src temp to dest temp file, then rename it
					var dest_temp_file = dest_path + '.' + Tools.generateUniqueID(32) + '.tmp';
					var inp = fs.createReadStream(src_temp_file);
					var outp = fs.createWriteStream(dest_temp_file);
					
					if (callback) inp.on('error', callback );
					if (callback) outp.on('error', callback );
					
					outp.on('finish', function() {
						// final rename
						fs.rename(dest_temp_file, dest_path, function(err) {
							if (err) {
								if (callback) callback(err);
								return;
							}
							
							// all done, delete src temp file
							fs.unlink(src_temp_file, function(err) {
								if (callback) callback(err);
							});
						});
					} );
					
					inp.pipe( outp );
				} ); // src rename
			} // EXDEV
			else {
				// rename worked, or other error
				if (callback) callback(err);
			}
		} ); // fs.rename
	},
	
	archive: function(src_spec, dest_path, epoch, callback) {
		// archive one or more log files, can use glob spec (defaults to our file).
		// dest path may use placeholders: [yyyy], [mm], [dd], [hh], [filename], [hostname], etc.
		// creates dest dirs as needed.
		// if dest path ends in .gz, archives will be compressed.
		var self = this;
		if (!src_spec) src_spec = this.path;
		if (!callback) callback = function() {};
		
		// fill date/time placeholders
		var dargs = Tools.getDateArgs( epoch );
		for (var key in dargs) self.args[key] = dargs[key];
		
		glob(src_spec, {}, function (err, files) {
			// got files
			if (files && files.length) {
				async.eachSeries( files, function(src_file, callback) {
					// foreach file
					if (err) return callback(err);
					
					// add filename to args
					self.args.filename = Path.basename(src_file).replace(/\.\w+$/, '');
					
					// construct final path
					var dest_file = Tools.substitute( dest_path, self.args );
					
					// rename local log first
					var src_temp_file = src_file + '.' + Tools.generateUniqueID(32) + '.tmp';
					
					fs.rename(src_file, src_temp_file, function(err) {
						if (err) {
							return callback( new Error("Failed to rename: " + src_file + " to: " + src_temp_file + ": " + err) );
						}
						
						// create dest dirs as necessary
						mkdirp(Path.dirname(dest_file), function (err) {
							if (err) {
								return callback( new Error("Failed to make directories for: " + dest_file + ": " + err) );
							}
							
							if (dest_file.match(/\.gz$/i)) {
								// gzip the log archive
								var gzip = zlib.createGzip();
								var inp = fs.createReadStream( src_temp_file );
								var outp = fs.createWriteStream( dest_file, {flags: 'a'} );
								
								inp.on('error', callback);
								outp.on('error', callback);
								
								outp.on('finish', function() {
									// all done, delete temp file
									fs.unlink( src_temp_file, callback );
								} );
								
								inp.pipe(gzip).pipe(outp);
							} // gzip
							else {
								// straight copy (no compress)
								var inp = fs.createReadStream( src_temp_file );
								var outp = fs.createWriteStream( dest_file, {flags: 'a'} );
								
								inp.on('error', callback);
								outp.on('error', callback);
								
								outp.on('finish', function() {
									// all done, delete temp file
									fs.unlink( src_temp_file, callback );
								} );
								
								inp.pipe( outp );
							} // copy
						} ); // mkdirp
					} ); // fs.rename
				}, callback ); // eachSeries
			} // got files
			else {
				callback( err || new Error("No files found matching: " + src_spec) );
			}
		} ); // glob
	} // archive()

});
