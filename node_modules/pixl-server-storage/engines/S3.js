// Amazon AWS S3 Storage Plugin
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var Class = require("pixl-class");
var Component = require("pixl-server/component");
var AWS = require('aws-sdk');

module.exports = Class.create({
	
	__name: 'S3',
	__parent: Component,
	
	startup: function(callback) {
		// setup Amazon AWS connection
		var self = this;
		
		this.setup();
		this.config.on('reload', function() { self.setup(); } );
		
		callback();
	},
	
	setup: function() {
		// setup AWS connection
		var aws_config = this.storage.config.get('AWS') || this.server.config.get('AWS');
		var s3_config = this.config.get();
		
		this.logDebug(2, "Setting up Amazon S3 (" + aws_config.region + ")");
		this.logDebug(3, "S3 Bucket ID: " + s3_config.params.Bucket);
		
		this.keyPrefix = (s3_config.keyPrefix || '').replace(/^\//, '');
		if (this.keyPrefix && !this.keyPrefix.match(/\/$/)) this.keyPrefix += '/';
		delete s3_config.keyPrefix;
		
		AWS.config.update( aws_config );
		this.s3 = new AWS.S3( s3_config );
	},
	
	put: function(key, value, callback) {
		// store key+value in s3
		var self = this;
		key = this.keyPrefix + key;
		
		var params = {};
		params.Key = key;
		params.Body = value;
		
		// serialize json if needed
		if (this.storage.isBinaryKey(key)) {
			this.logDebug(9, "Storing S3 Binary Object: " + key, '' + value.length + ' bytes');
		}
		else {
			this.logDebug(9, "Storing S3 JSON Object: " + key, this.debugLevel(10) ? params.Body : null);
			params.Body = JSON.stringify( params.Body );
			params.ContentType = 'application/json';
		}
		
		this.s3.putObject( params, function(err, data) {
			if (err) {
				self.logError('s3', "Failed to store object: " + key + ": " + err.message);
			}
			else self.logDebug(9, "Store complete: " + key);
			
			if (callback) callback(err, data);
		} );
	},
	
	putStream: function(key, inp, callback) {
		// store key+stream of data to S3
		var self = this;
		key = this.keyPrefix + key;
		
		var params = {};
		params.Key = key;
		params.Body = inp;
		
		this.logDebug(9, "Storing S3 Binary Stream: " + key);
		
		this.s3.upload(params, function(err, data) {
			if (err) {
				self.logError('s3', "Failed to store stream: " + key + ": " + err.message);
			}
			else self.logDebug(9, "Stream store complete: " + key);
			
			if (callback) callback(err, data);
		} );
	},
	
	head: function(key, callback) {
		// head s3 value given key
		var self = this;
		key = this.keyPrefix + key;
		
		this.logDebug(9, "Pinging S3 Object: " + key);
		
		this.s3.headObject( { Key: key }, function(err, data) {
			if (err) {
				if (err.code != 'NoSuchKey') {
					self.logError('s3', "Failed to head key: " + key + ": " + err.message);
				}
				callback( err, null );
				return;
			}
			
			self.logDebug(9, "Head complete: " + key);
			callback( null, {
				mod: Math.floor((new Date(data.LastModified)).getTime() / 1000),
				len: data.ContentLength
			} );
		} );
	},
	
	get: function(key, callback) {
		// fetch s3 value given key
		var self = this;
		key = this.keyPrefix + key;
		
		this.logDebug(9, "Fetching S3 Object: " + key);
		
		this.s3.getObject( { Key: key }, function(err, data) {
			if (err) {
				if (err.code == 'NoSuchKey') {
					// key not found, special case, don't log an error
					// always include "Not found" in error message
					err = new Error("Failed to fetch key: " + key + ": Not found");
					err.code = "NoSuchKey";
				}
				else {
					// some other error
					self.logError('s3', "Failed to fetch key: " + key + ": " + err.message);
				}
				callback( err, null );
				return;
			}
			
			var body = null;
			if (self.storage.isBinaryKey(key)) {
				body = data.Body;
				self.logDebug(9, "Binary fetch complete: " + key, '' + body.length + ' bytes');
			}
			else {
				body = data.Body.toString();
				try { body = JSON.parse( body ); }
				catch (e) {
					self.logError('s3', "Failed to parse JSON record: " + key + ": " + e);
					callback( e, null );
					return;
				}
				self.logDebug(9, "JSON fetch complete: " + key, self.debugLevel(10) ? body : null);
			}
			
			callback( null, body );
		} );
	},
	
	getStream: function(key, callback) {
		// get readable stream to record value given key
		var self = this;
		key = this.keyPrefix + key;
		
		this.logDebug(9, "Fetching S3 Stream: " + key);
		
		var params = { Key: key };
		var download = this.s3.getObject(params);
		
		download.on('httpHeaders', function(statusCode, headers) {
			if (statusCode < 300) {
				var stream = this.response.httpResponse.createUnbufferedStream();
				callback( null, stream );
			}
			else {
				this.abort();
			}
		} );
		
		download.on('error', function(err) {
			if (err.code == 'NoSuchKey') {
				// key not found, special case, don't log an error
				// always include "Not found" in error message
				err = new Error("Failed to fetch key: " + key + ": Not found");
				err.code = "NoSuchKey";
			}
			else {
				// some other error
				self.logError('s3', "Failed to fetch key: " + key + ": " + err.message);
			}
			callback( err );
			return;
		} );
		
		download.on('complete', function() {
			self.logDebug(9, "S3 stream download complete: " + key);
		} );
		
		download.send();
	},
	
	delete: function(key, callback) {
		// delete s3 key given key
		var self = this;
		key = this.keyPrefix + key;
		
		this.logDebug(9, "Deleting S3 Object: " + key);
		
		this.s3.deleteObject( { Key: key }, function(err, data) {
			if (err) {
				self.logError('s3', "Failed to delete object: " + key + ": " + err.message);
			}
			else self.logDebug(9, "Delete complete: " + key);
			
			if (callback) callback(err, data);
		} );
	},
	
	runMaintenance: function(callback) {
		// run daily maintenance
		callback();
	},
	
	shutdown: function(callback) {
		// shutdown storage
		this.logDebug(2, "Shutting down S3 storage");
		delete this.s3;
		callback();
	}
	
});
