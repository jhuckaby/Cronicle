var Class = require("pixl-class");
var Component = require("pixl-server/component");
var mongoClient = require("mongodb").MongoClient;
var Tools = require("pixl-tools");

const Keyv = require('keyv');

var mongoDBClient = null;
var keyv = null;

module.exports = Class.create({
    
    __name: 'MyEngine',
    __parent: Component,
    
    defaultConfig:{
        host:"",
        mongoDB:null,
        password: "",
		serialize: false,
		keyPrefix: "",
		keyTemplate: ""
    },
    
    startup: function(callback) {
        console.log("METHOD: ", "STARTUP");
        // setup initial connection
        var self = this;
        this.logDebug(2, "Setting up MyEngine");
        
        // Connecting to MongoDB
        keyv = new Keyv(this.config.get('host'));
        console.log("HOST: ",this.config.get('host'));
        keyv.on('error', err => console.log('Connection Error', err));
        
        callback();
    },
    
    prepKey: function(key) {
		// prepare key for S3 based on config
		var md5 = Tools.digestHex(key, 'md5');
		
		if (this.keyPrefix) {
			key = this.keyPrefix + key;
		}
		
		if (this.keyTemplate) {
			var idx = 0;
			var temp = this.keyTemplate.replace( /\#/g, function() {
				return md5.substr(idx++, 1);
			} );
			key = Tools.substitute( temp, { key: key, md5: md5 } );
		}
		
		return key;
	},
    
    put: function(key, value, callback) {
        console.log("METHOD: ", "PUT");
        console.log("KEY (PUT): ", key);
        console.log("VALUE (PUT): ",value);

        var self = this;
        key = this.prepKey(key);

        if (this.storage.isBinaryKey(key)) {
            this.logDebug(9, "Storing Couchbase Binary Object: " + key, '' + value.length + ' bytes');
        }
        else {
            this.logDebug(9, "Storing Couchbase JSON Object: " + key, this.debugLevel(10) ? value : null);
            if (this.config.get('serialize')) value = JSON.stringify( value );
        }

        keyv.set(key, value).then((result)=>{
            if(result)
                callback();
        }).catch((err)=>{
            callback(err);
        });

    },
    
    putStream: function(key, inp, callback) {
        console.log("METHOD: ", "PUTSTREAM");
        console.log("KEY (PUTSTREAM): ", key);
        // store key+value in MongoDB using read stream
        var self = this;

        // The MongoDB Node.JS 2.0 API has no stream support.
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
        console.log("METHOD: ", "HEAD");
        console.log("KEY (HEAD): ", key);
		// head mongo value given key
		var self = this;
		
		// The Mongo Node.JS 2.0 API has no way to head / ping an object.
		// So, we have to do this the RAM-hard way...
		
		this.get( key, function(err, data) {
			if (err) {
				// some other error
				err.message = "Failed to head key: " + key + ": " + err.message;
				console.log('mongo', err.message);
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
        console.log("METHOD: ", "GET");
        console.log("KEY (GET): ",key);

        // fetch Couchbase value given key
		var self = this;
		key = this.prepKey(key);
		
		this.logDebug(9, "Fetching KVMongo Object: " + key);
		
        keyv.get(key).then((result)=>{
            console.log("get-result",result);
            if(!result){
                var keyNotFoundError = new Error("Failed to fetch key: " + key + ": Not found");
                keyNotFoundError.code = "NoSuchKey";
                callback(keyNotFoundError,null);
            }else{
                var body = result;
                
                if (self.storage.isBinaryKey(key)) {
                    console.log(9, "Binary fetch complete: " + key, '' + body.length + ' bytes');
				}
                else {
                    if (self.config.get('serialize')) {
						try { body = JSON.parse( body.toString() ); }
						catch (e) {
							console.log('couchbase', "Failed to parse JSON record: " + key + ": " + e);
							callback( e, null );
							return;
						}
					}
					console.log(9, "JSON fetch complete: " + key, self.debugLevel(10) ? body : null);
                    console.log("k: ",key);
                    console.log("body: ",body);
                }
                
                callback( null, body );
            }
            
        }).catch((err)=>{
            console.log("Error has occured: ",err);
            //callback(err,null);
        });
        
    },
    
    getStream: function(key, callback) {
        console.log("METHOD: ", "GETSTREAM");
        console.log("KEY (GETSTREAM): ",key);
        
        // get readable stream to record value given key
        var self = this;

        // The MongoDB Node.JS 2.0 API has no stream support.
        // So, we have to do this the RAM-hard way...
        this.get( key, function(err, buf) {
            if (err) {
                // some error
                err.message = "Failed to fetch key: " + key + ": " + err.message;
                console.log('mongo', err.message);
                return callback(err);
            }
            else if (!buf) {
                // record not found
                var err = new Error("Failed to fetch key: " + key + ": Not found");
                err.code = "NoSuchKey";
                return callback( err, null );
            }

            console.log("BUFFER STREAM: ",buf);

            var stream = new BufferStream(buf);
            callback(null, stream);
        } );
    },
    
    
    delete: function(key, callback) {
        console.log("METHOD", "DELETE");
        console.log("KEY (DELETE): ",key);
        
        var self = this;
		key = this.prepKey(key);
		
		this.logDebug(9, "Deleting KVMongo Object: " + key);
		

        // delete record
        
        keyv.delete(key).then((result)=>{
            if(result){
                console.log(9, "Delete complete: " + key);
                callback(null);
            }
        }).catch((err)=>{
           console.log("Error occured: ",err); 
           console.log('KVMongo', "Failed to delete object: " + key + ": " + err.message);
            callback(err);  
        });

    },
    
    runMaintenance: function(callback) {
        console.log("METHOD: ", "MAINTENANCE");
		// run daily maintenance
		callback();
	},
    
    shutdown: function(callback) {
        console.log("METHOD: ", "SHUTDOWN");

        // shutdown storage
        this.logDebug(2, "Shutting down MyEngine");
        callback();
    }
    
});

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
