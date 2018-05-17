// Local File Storage Plugin
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var path = require('path');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');
var crypto = require('crypto');

var Class = require("pixl-class");
var Component = require("pixl-server/component");
var Tools = require("pixl-tools");

module.exports = Class.create({
	
	__name: 'Filesystem',
	__parent: Component,
	
	startup: function(callback) {
		// setup storage plugin
		var self = this;
		this.logDebug(2, "Setting up filesystem storage");
		
		this.setup();
		this.config.on('reload', function() { self.setup(); } );
		
		// counter so worker temp files don't collide
		this.tempFileCounter = 1;
		
		callback();
	},
	
	setup: function() {
		// setup storage system (also called for config reload)
		this.baseDir = this.config.get('base_dir') || process.cwd();
		this.keyNamespaces = this.config.get('key_namespaces') || 0;
		this.pretty = this.config.get('pretty') || 0;
		
		this.logDebug(3, "Base directory: " + this.baseDir);
		
		// create initial data dir if necessary
		try {
			mkdirp.sync( this.baseDir ); 
		}
		catch (e) {
			var msg = "FATAL ERROR: Base directory could not be created: " + this.baseDir + ": " + e;
			this.logError('file', msg);
			throw new Error(msg);
		}
		
		// create temp dir
		// (MUST be on same filesystem as base dir, for atomic renames)
		this.tempDir = this.baseDir + '/_temp';
		
		try {
			mkdirp.sync( this.tempDir ); 
		}
		catch (e) {
			var msg = "FATAL ERROR: Temp directory could not be created: " + this.tempDir + ": " + e;
			this.logError('file', msg);
			throw new Error(msg);
		}
	},
	
	getFilePath: function(key) {
		// get local path to file given storage key
		var self = this;
		
		// hash key to get dir structure
		// no need for salt, as this is not for security, 
		// only for distributing the files evenly into a tree of subdirs
		var shasum = crypto.createHash('md5');
		shasum.update( key );
		var hash = shasum.digest('hex');
		
		// locate directory on disk
		var dir = this.baseDir;
		
		// if key contains a base "dir", use that on disk as well (one level deep only)
		// i.e. users/jhuckaby --> users/01/9a/aa/019aaa6887e5ce3533dcc691b05e69e4.json
		if (this.keyNamespaces) {
			if (key.match(/^([\w\-\.]+)\//)) dir += '/' + RegExp.$1;
			else dir += '/' + key;
		}
		
		// hash subdirs
		dir += '/' + hash.substring(0, 2) + '/' + hash.substring(2, 4) + '/' + hash.substring(4, 6);
		
		// filename is full hash
		var file = dir + '/' + hash;
		
		// grab ext from key, or default to json
		// (all binary keys should have a file extension IN THE KEY)
		if (key.match(/\.(\w+)$/)) file += '.' + RegExp.$1;
		else file += '.json';
		
		return file;
	},
	
	put: function(key, value, callback) {
		// store key+value on disk
		var self = this;
		var file = this.getFilePath(key);
		
		// serialize json if needed
		if (this.storage.isBinaryKey(key)) {
			this.logDebug(9, "Storing Binary Object: " + key, '' + value.length + ' bytes');
		}
		else {
			this.logDebug(9, "Storing JSON Object: " + key, this.debugLevel(10) ? value : null);
			value = this.pretty ? JSON.stringify( value, null, "\t" ) : JSON.stringify( value );
		}
		
		var dir = path.dirname( file );
		
		var temp_file = this.tempDir + '/' + path.basename(file) + '.tmp.' + this.tempFileCounter;
		this.tempFileCounter = (this.tempFileCounter + 1) % 10000000;
		
		// make sure parent dirs exist, async
		mkdirp( dir, 0775, function(err) {
			if (err) {
				// failed to create directory
				var msg = "Failed to create directory: " + key + ": " + dir + ": " + err.message;
				self.logError('file', msg);
				return callback( new Error(msg), null );
			}
			
			// now write temp file (atomic mode)
			fs.writeFile( temp_file, value, function (err) {
				if (err) {
					// failed to write file
					var msg = "Failed to write file: " + key + ": " + temp_file + ": " + err.message;
					self.logError('file', msg);
					return callback( new Error(msg), null );
				}
				
				// finally, rename temp file to final
				fs.rename( temp_file, file, function (err) {
					if (err) {
						// failed to write file
						var msg = "Failed to rename file: " + key + ": " + temp_file + ": " + err.message;
						self.logError('file', msg);
						return callback( new Error(msg), null );
					}
					
					// all done
					self.logDebug(9, "Store operation complete: " + key);
					callback(null, null);
				} ); // rename
			} ); // write
		} ); // mkdirp
	},
	
	putStream: function(key, inp, callback) {
		// store key+stream of data to disk
		var self = this;
		var file = this.getFilePath(key);
		
		this.logDebug(9, "Storing Binary Stream Object: " + key);
		
		var dir = path.dirname( file );
		
		var temp_file = this.tempDir + '/' + path.basename(file) + '.tmp.' + this.tempFileCounter;
		this.tempFileCounter = (this.tempFileCounter + 1) % 10000000;
		
		// make sure parent dirs exist, async
		mkdirp( dir, 0775, function(err) {
			if (err) {
				// failed to create directory
				var msg = "Failed to create directory: " + key + ": " + dir + ": " + err.message;
				self.logError('file', msg);
				return callback( new Error(msg), null );
			}
			
			// now create the write stream
			var outp = fs.createWriteStream( temp_file );
			
			outp.on('error', function(err) {
				// failed to write file
				var msg = "Failed to write file: " + key + ": " + temp_file + ": " + err.message;
				self.logError('file', msg);
				return callback( new Error(msg), null );
			} );
			
			outp.on('finish', function() {
				// finally, rename temp file to final
				fs.rename( temp_file, file, function (err) {
					if (err) {
						// failed to write file
						var msg = "Failed to rename file: " + key + ": " + temp_file + ": " + err.message;
						self.logError('file', msg);
						return callback( new Error(msg), null );
					}
					
					// all done
					self.logDebug(9, "Store operation complete: " + key);
					callback(null, null);
				} ); // rename
			} ); // pipe finish
			
			// pipe inp to outp
			inp.pipe( outp );
		} ); // mkdirp
	},
	
	head: function(key, callback) {
		// head value given key
		var self = this;
		var file = this.getFilePath(key);
		
		this.logDebug(9, "Pinging Object: " + key);
		
		fs.stat(file, function(err, stats) {
			if (err) {
				var msg = err.message;
				if (msg.match(/ENOENT/)) msg = "File not found";
				else {
					// log fs errors that aren't simple missing files (i.e. I/O errors)
					self.logError('file', "Failed to stat file: " + key + ": " + file + ": " + err);
				}
				return callback(
					new Error("Failed to head key: " + key + ": " + msg),
					null
				);
			}
			
			self.logDebug(9, "Head complete: " + key);
			callback( null, {
				mod: Math.floor(stats.mtime.getTime() / 1000),
				len: stats.size
			} );
		} );
	},
	
	get: function(key, callback) {
		// fetch value given key
		var self = this;
		var file = this.getFilePath(key);
		
		this.logDebug(9, "Fetching Object: " + key, file);
		
		var opts = {};
		if (!this.storage.isBinaryKey(key)) opts = { encoding: 'utf8' };
		
		fs.readFile(file, opts, function (err, data) {
			if (err) {
				var msg = err.message;
				if (msg.match(/ENOENT/)) msg = "File not found";
				else {
					// log fs errors that aren't simple missing files (i.e. I/O errors)
					self.logError('file', "Failed to read file: " + key + ": " + file + ": " + err);
				}
				return callback(
					new Error("Failed to fetch key: " + key + ": " + msg),
					null
				);
			}
			
			if (file.match(/\.json$/i)) {
				try { data = JSON.parse( data ); }
				catch (e) {
					self.logError('file', "Failed to parse JSON record: " + key + ": " + e);
					callback( e, null );
					return;
				}
				self.logDebug(9, "JSON fetch complete: " + key, self.debugLevel(10) ? data : null);
			}
			else {
				self.logDebug(9, "Binary fetch complete: " + key, '' + data.length + ' bytes');
			}
			
			callback( null, data );
		} );
	},
	
	getStream: function(key, callback) {
		// get readable stream to record value given key
		var self = this;
		var file = this.getFilePath(key);
		
		this.logDebug(9, "Fetching Binary Stream: " + key, file);
		
		// make sure record exists
		fs.stat(file, function(err, stats) {
			if (err) {
				var msg = err.message;
				if (msg.match(/ENOENT/)) msg = "File not found";
				else {
					// log fs errors that aren't simple missing files (i.e. I/O errors)
					self.logError('file', "Failed to stat file: " + key + ": " + file + ": " + err);
				}
				return callback(
					new Error("Failed to head key: " + key + ": " + msg),
					null
				);
			}
			
			// create read stream
			var inp = fs.createReadStream( file );
			
			callback( null, inp );
		} );
	},
	
	delete: function(key, callback) {
		// delete key given key
		var self = this;
		var file = this.getFilePath(key);
		
		this.logDebug(9, "Deleting Object: " + key);
		
		fs.unlink(file, function(err) {
			if (err) {
				var msg = err.message;
				if (msg.match(/ENOENT/)) msg = "File not found";
				self.logError('file', "Failed to delete object: " + key + ": " + msg);
			}
			else {
				self.logDebug(9, "Delete complete: " + key);
				
				// enqueue async job to cleanup parent dirs if empty
				self.storage.enqueue( {
					action: 'custom',
					key: key,
					dir: path.dirname(file),
					handler: function(task, callback) {
						// attempt to delete via rmdir() which will fail if it contains any files
						self.logDebug(9, "Cleaning up: " + task.dir);
						
						fs.rmdir( task.dir, function(err) {
							if (!err) {
								// success -- do we need to go shallower?
								var dir = path.dirname( task.dir );
								if (dir != self.baseDir) {
									// enqueue new task for next outer parent level
									self.storage.enqueue({
										action: 'custom',
										key: task.key,
										dir: dir,
										handler: task.handler
									});
								}
							} // success
							callback( null );
						} ); // rmdir
					} // handler
				} ); // cleanup
				
			} // success
			
			if (callback) callback(err);
		} );
	},
	
	runMaintenance: function(callback) {
		// run daily maintenance - delete old temp files
		var self = this;
		var now = Tools.timeNow(true);
		
		fs.readdir( this.tempDir, function(err, files) {
			if (err) return callback();
			
			if (files && files.length) {
				// temp dir has files
				async.eachSeries( files, function(file, callback) {
					// stat each file to get mod date
					file = self.tempDir + '/' + file;
					
					fs.stat( file, function(err, stats) {
						if (err) return callback();
						
						if (stats && stats.isFile()) {
							// file is an ordinary file
							var mod = stats.mtime.getTime() / 1000;
							if (mod < now - 43200) {
								// file is old, delete it
								self.logDebug(9, "Deleting old temp file: " + file);
								fs.unlink( file, callback );
							}
							else callback();
						}
						else callback();
					} );
				},
				function(err) {
					if (err) self.logError('maint', "Failed to cleanup temp dir: " + err);
					callback();
				} );
			} // got files
			else callback();
		} );
	},
	
	shutdown: function(callback) {
		// shutdown storage
		this.logDebug(2, "Shutting down file storage");
		callback();
	}
	
});
