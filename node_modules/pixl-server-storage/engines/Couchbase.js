// Couchbase Storage Plugin
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

// Requires the 'couchbase' module from npm
// npm install couchbase

var Class = require("pixl-class");
var Component = require("pixl-server/component");
var CouchbaseAPI = require('couchbase');

module.exports = Class.create({
	
	__name: 'Couchbase',
	__parent: Component,
	
	defaultConfig: {
		connectString: "couchbase://127.0.0.1",
		bucket: "default",
		password: "",
		serialize: false,
		keyPrefix: ""
	},
	
	startup: function(callback) {
		// setup Couchbase connection
		var self = this;
		this.logDebug(2, "Setting up Couchbase");
		
		this.setup(callback);
		this.config.on('reload', function() { self.setup(); } );
	},
	
	setup: function(callback) {
		// setup Couchbase connection
		var self = this;
		
		this.keyPrefix = this.config.get('keyPrefix').replace(/^\//, '');
		if (this.keyPrefix && !this.keyPrefix.match(/\/$/)) this.keyPrefix += '/';
		
		// support old legacy naming convention: connect_string
		this.cluster = new CouchbaseAPI.Cluster( this.config.get('connectString') || this.config.get('connect_string') );
		if (this.config.get('password')) {
			this.bucket = this.cluster.openBucket( this.config.get('bucket'), this.config.get('password'), function(err) {
				callback(err);
			} );
		}
		else {
			this.bucket = this.cluster.openBucket( this.config.get('bucket'), function(err) {
				callback(err);
			} );
		}
	},
	
	put: function(key, value, callback) {
		// store key+value in Couchbase
		var self = this;
		key = this.keyPrefix + key;
		
		if (this.storage.isBinaryKey(key)) {
			this.logDebug(9, "Storing Couchbase Binary Object: " + key, '' + value.length + ' bytes');
		}
		else {
			this.logDebug(9, "Storing Couchbase JSON Object: " + key, this.debugLevel(10) ? value : null);
			if (this.config.get('serialize')) value = JSON.stringify( value );
		}
		
		this.bucket.upsert( key, value, {}, function(err) {
			if (err) {
				err.message = "Failed to store object: " + key + ": " + err.message;
				self.logError('couchbase', err.message);
			}
			else self.logDebug(9, "Store complete: " + key);
			
			if (callback) callback(err);
		} );
	},
	
	putStream: function(key, inp, callback) {
		// store key+value in Couchbase using read stream
		var self = this;
		
		// The Couchbase Node.JS 2.0 API has no stream support.
		// So, we have to do this the RAM-hard way...
		
		var chunks = [];
		inp.on('data', function(chunk) {
			chunks.push( chunk );
		} );
		inp.on('end', function() {
			var buf = Buffer.concat(chunks);
			self.put( key, buf, callback );
		} );
	},
	
	head: function(key, callback) {
		// head couchbase value given key
		var self = this;
		key = this.keyPrefix + key;
		
		// The Couchbase Node.JS 2.0 API has no way to head / ping an object.
		// So, we have to do this the RAM-hard way...
		
		this.get( key, function(err, data) {
			if (err) {
				// some other error
				err.message = "Failed to head key: " + key + ": " + err.message;
				self.logError('couchbase', err.message);
				callback(err);
			}
			else if (!data) {
				// record not found
				// always use "NoSuchKey" in error code
				var err = new Error("Failed to head key: " + key + ": Not found");
				err.code = "NoSuchKey";
				
				callback( err, null );
			}
			else {
				callback( null, { mod: 1, len: data.length } );
			}
		} );
	},
	
	get: function(key, callback) {
		// fetch Couchbase value given key
		var self = this;
		key = this.keyPrefix + key;
		
		this.logDebug(9, "Fetching Couchbase Object: " + key);
		
		this.bucket.get( key, function(err, result) {
			if (!result) {
				if (err) {
					// some other error
					err.message = "Failed to fetch key: " + key + ": " + err.message;
					self.logError('couchbase', err.message);
					callback( err, null );
				}
				else {
					// record not found
					// always use "NoSuchKey" in error code
					var err = new Error("Failed to fetch key: " + key + ": Not found");
					err.code = "NoSuchKey";
					
					callback( err, null );
				}
			}
			else {
				var body = result.value;
				
				if (self.storage.isBinaryKey(key)) {
					self.logDebug(9, "Binary fetch complete: " + key, '' + body.length + ' bytes');
				}
				else {
					if (self.config.get('serialize')) {
						try { body = JSON.parse( body.toString() ); }
						catch (e) {
							self.logError('couchbase', "Failed to parse JSON record: " + key + ": " + e);
							callback( e, null );
							return;
						}
					}
					self.logDebug(9, "JSON fetch complete: " + key, self.debugLevel(10) ? body : null);
				}
				
				callback( null, body );
			}
		} );
	},
	
	getStream: function(key, callback) {
		// get readable stream to record value given key
		var self = this;
		key = this.keyPrefix + key;
		
		// The Couchbase Node.JS 2.0 API has no stream support.
		// So, we have to do this the RAM-hard way...
		this.get( key, function(err, buf) {
			if (err) {
				// some other error
				err.message = "Failed to fetch key: " + key + ": " + err.message;
				self.logError('couchbase', err.message);
				return callback(err);
			}
			else if (!buf) {
				// record not found
				var err = new Error("Failed to fetch key: " + key + ": Not found");
				err.code = "NoSuchKey";
				return callback( err, null );
			}
			
			var stream = new BufferStream(buf);
			callback(null, stream);
		} );
	},
	
	delete: function(key, callback) {
		// delete Couchbase key given key
		// Example CB error message: The key does not exist on the server
		var self = this;
		key = this.keyPrefix + key;
		
		this.logDebug(9, "Deleting Couchbase Object: " + key);
		
		this.bucket.remove( key, {}, function(err) {
			if (err) {
				// if error was a non-existent key, make sure we use the standard code
				if (err.message.match(/not\s+exist/i)) err.code = "NoSuchKey";
				
				self.logError('couchbase', "Failed to delete object: " + key + ": " + err.message);
			}
			else self.logDebug(9, "Delete complete: " + key);
			
			callback(err);
		} );
	},
	
	runMaintenance: function(callback) {
		// run daily maintenance
		callback();
	},
	
	shutdown: function(callback) {
		// shutdown storage
		this.logDebug(2, "Shutting down Couchbase");
		this.bucket.disconnect();
		callback();
	}
	
});

// Modified the following snippet from node-streamifier:
// Copyright (c) 2014 Gabriel Llamas, MIT Licensed

var util = require('util');
var stream = require('stream');

var BufferStream = function (object, options) {
  if (object instanceof Buffer || typeof object === 'string') {
    options = options || {};
    stream.Readable.call(this, {
      highWaterMark: options.highWaterMark,
      encoding: options.encoding
    });
  } else {
    stream.Readable.call(this, { objectMode: true });
  }
  this._object = object;
};

util.inherits(BufferStream, stream.Readable);

BufferStream.prototype._read = function () {
  this.push(this._object);
  this._object = null;
};
