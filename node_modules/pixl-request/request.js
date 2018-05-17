// Very simple HTTP request library for Node.js
// Copyright (c) 2015 - 2016 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var zlib = require('zlib');
var util = require('util');

var FormData = require('form-data');
var XML = require('pixl-xml');
var Class = require('pixl-class');
var Perf = require('pixl-perf');
var ErrNo = require('errno');

var pixlreq_agent = "PixlRequest " + require('./package.json').version;
var dns_cache = {};

// util.isArray is DEPRECATED??? Nooooooooode!
var isArray = Array.isArray || util.isArray;

var http_common = require('_http_common');
var checkIsHttpToken = http_common._checkIsHttpToken;
var checkInvalidHeaderChar = http_common._checkInvalidHeaderChar;

module.exports = Class.create({
	
	defaultHeaders: null,
	
	// default socket idle timeout of 30 seconds
	defaultTimeout: 30000,
	
	// do not follow redirects by default
	defaultFollow: false,
	
	// do not cache DNS by default (TTL 0s)
	dnsTTL: 0,
	
	// http code success match for json/xml wrappers
	successMatch: /^2\d\d$/,
	
	// automatically decompress gzip/inflate compression on response
	autoDecompress: true,
	
	__construct: function(useragent) {
		// class constructor
		this.defaultHeaders = {
			'Accept-Encoding': "gzip, deflate"
		};
		this.setUserAgent( useragent || pixlreq_agent );
	},
	
	setHeader: function(name, value) {
		// override or add a default header
		this.defaultHeaders[name] = value;
	},
	
	setUserAgent: function(useragent) {
		// override the default user agent string
		this.setHeader('User-Agent', useragent);
	},
	
	setTimeout: function(timeout) {
		// override the default socket idle timeout (milliseconds)
		this.defaultTimeout = timeout;
	},
	
	setFollow: function(follow) {
		// override the default follow setting (boolean or int)
		// specify integer to set limit of max redirects to allow
		this.defaultFollow = follow;
	},
	
	setDNSCache: function(ttl) {
		// set a DNS cache TTL (seconds) or 0 to disable
		this.dnsTTL = ttl;
	},
	
	flushDNSCache: function() {
		// remove all IPs from the internal DNS cache
		dns_cache = {};
	},
	
	setSuccessMatch: function(regexp) {
		// set success match for http code (json/xml wrappers)
		this.successMatch = regexp;
	},
	
	setAutoDecompress: function(enabled) {
		// set auto decompress (boolean: enabled/disabled)
		this.autoDecompress = enabled;
	},
	
	json: function(url, data, options, callback) {
		// convenience method: get or post json, get json back
		var self = this;
		
		if (!callback) {
			// support 3-arg calling convention
			callback = options;
			options = {};
		}
		
		var method = '';
		if (data) {
			method = 'post';
			options.json = true;
			options.data = data;
		}
		else {
			method = 'get';
		}
		
		this[method]( url, options, function(err, res, data, perf) {
			// got response, check for dns/tcp error
			if (err) return callback( err, null, null, perf );
			
			// check for http error code
			if (!res.statusCode.toString().match(self.successMatch)) {
				err = new Error( "HTTP " + res.statusCode + " " + res.statusMessage );
				err.code = res.statusCode;
				return callback( err, res, data, perf );
			}
			
			// parse json in response
			var json = null;
			try { json = JSON.parse( data.toString() ); }
			catch (err) {
				return callback( err, null, null, perf );
			}
			
			// all good, send json object back
			callback( null, res, json, perf );
		} );
	},
	
	xml: function(url, data, options, callback) {
		// convenience method: get or post xml, get xml back
		var self = this;
		
		if (!callback) {
			// support 3-arg calling convention
			callback = options;
			options = {};
		}
		
		var method = '';
		if (data) {
			method = 'post';
			options.xml = true;
			options.data = data;
		}
		else {
			method = 'get';
		}
		
		this[method]( url, options, function(err, res, data, perf) {
			// got response, check for dns/tcp error
			if (err) return callback( err, null, null, perf );
			
			// check for http error code
			if (!res.statusCode.toString().match(self.successMatch)) {
				err = new Error( "HTTP " + res.statusCode + " " + res.statusMessage );
				err.code = res.statusCode;
				return callback( err, res, data, perf );
			}
			
			// parse xml in response
			var xml = null;
			try { xml = XML.parse( data.toString() ); }
			catch (err) {
				return callback( err, null, null, perf );
			}
			
			// all good, send xml object back
			callback( null, res, xml, perf );
		} );
	},
	
	get: function(url, options, callback) {
		// perform HTTP GET
		// callback will receive: err, res, data
		if (!callback) {
			// support two-argument calling convention: url and callback
			callback = options;
			options = {};
		}
		if (!options) options = {};
		options.method = 'GET';
		this.request( url, options, callback );
	},
	
	head: function(url, options, callback) {
		// perform HTTP HEAD
		// callback will receive: err, res, data
		if (!callback) {
			// support two-argument calling convention: url and callback
			callback = options;
			options = {};
		}
		if (!options) options = {};
		options.method = 'HEAD';
		this.request( url, options, callback );
	},
	
	post: function(url, options, callback) {
		// perform HTTP POST, raw data or key/value pairs
		// callback will receive: err, res, data
		var key;
		if (!options) options = {};
		if (!options.headers) options.headers = {};
		if (!options.data) options.data = '';
		
		options.method = 'POST';
		
		// see if we have a buffer, string or other
		var is_buffer = (options.data instanceof Buffer);
		var is_string = (typeof(options.data) == 'string');
		
		// if string, convert to buffer so content length is correct (unicode)
		if (is_string) {
			// support Node v0.12 and up
			options.data = Buffer.from ? Buffer.from(options.data) : (new Buffer(options.data));
			is_buffer = true;
			is_string = false;
		}
		
		if ((typeof(options.data) == 'object') && !is_buffer) {
			// serialize data into key/value pairs
			if (options.json) {
				// JSON REST
				options.data = JSON.stringify(options.data) + "\n";
				options.data = Buffer.from ? Buffer.from(options.data) : (new Buffer(options.data));
				options.headers['Content-Type'] = 'application/json';
				delete options.json;
			}
			else if (options.xml) {
				// XML REST
				options.data = XML.stringify(options.data, options.xmlRootNode || 'Request') + "\n";
				options.data = Buffer.from ? Buffer.from(options.data) : (new Buffer(options.data));
				options.headers['Content-Type'] = 'text/xml';
				delete options.xml;
				delete options.xmlRootNode;
			}
			else if (options.files || options.multipart) {
				// use FormData
				var form = new FormData();
				
				// POST params (strings or Buffers)
				for (key in options.data) {
					form.append(key, options.data[key]);
				}
				
				// file uploads
				if (options.files) {
					for (key in options.files) {
						var file = options.files[key];
						if (typeof(file) == 'string') {
							// simple file path, convert to readable stream
							form.append( key, fs.createReadStream(file) );
						}
						else if (isArray(file)) {
							// array of [file path or stream or buffer, filename]
							var file_data = file[0];
							if (typeof(file_data) == 'string') file_data = fs.createReadStream(file_data);
							
							form.append( key, file_data, {
								filename: file[1]
							} );
						}
						else {
							// assume user knows what (s)he is doing (should be stream or buffer)
							form.append( key, file );
						}
					} // foreach file
					delete options.files;
				} // files
				
				options.data = form;
			} // multipart
			else {
				// form urlencoded
				options.data = querystring.stringify(options.data);
				options.data = Buffer.from ? Buffer.from(options.data) : (new Buffer(options.data));
				options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			}
		} // serialize data
		
		this.request( url, options, callback );
	},
	
	request: function(url, options, callback) {
		// low-level request sender
		// callback will receive: err, res, data, perf
		var self = this;
		var callback_fired = false;
		var timer = null;
		var key;
		if (!options) options = {};
		else {
			// make shallow copy of options so we don't clobber user's version
			var new_opts = {};
			for (key in options) new_opts[key] = options[key];
			options = new_opts;
		}
		
		// setup perf
		var perf = new Perf();
		perf.begin();
		
		// if no agent is specified, use close connections
		if (!('agent' in options)) {
			options.agent = false;
			options.keepAlive = false;
		}
		
		// parse url into parts
		var parts = require('url').parse(url);
		if (!options.hostname) options.hostname = parts.hostname;
		if (!options.port) options.port = parts.port || ((parts.protocol == 'https:') ? 443 : 80);
		if (!options.path) options.path = parts.path;
		if (!options.auth && parts.auth) options.auth = parts.auth;
		
		// default headers
		if (!options.headers) options.headers = {};
		for (key in this.defaultHeaders) {
			if (!(key in options.headers)) {
				options.headers[key] = this.defaultHeaders[key];
			}
		}
		
		// possibly use dns cache
		if (this.dnsTTL && dns_cache[options.hostname]) {
			var now = (new Date()).getTime() / 1000;
			var obj = dns_cache[options.hostname];
			if (obj.expires > now) {
				// cache is still fresh, swap in IP and add 'Host' header
				options.headers['Host'] = options.hostname;
				options.hostname = obj.ip;
			}
			else {
				// cache object has expired
				delete dns_cache[options.hostname];
			}
		} // dns cache
		
		// prep post data
		var post_data = null;
		var is_form = false;
		
		if (('data' in options) && (options.data !== null)) {
			post_data = options.data;
			delete options.data;
			
			// support FormData and raw data
			if (post_data instanceof FormData) {
				// allow form-data to populate headers (multipart boundary, etc.)
				is_form = true;
				var form_headers = post_data.getHeaders();
				for (key in form_headers) {
					options.headers[key] = form_headers[key];
				}
			}
			else {
				// raw data (string or buffer)
				options.headers['Content-Length'] = post_data.length;
			}
		}
		
		// handle socket timeouts
		var aborted = false;
		var timeout = this.defaultTimeout;
		if ('timeout' in options) {
			timeout = options.timeout;
			delete options.timeout;
		}
		
		// auto-follow redirects
		var follow = this.defaultFollow;
		if ('follow' in options) {
			follow = options.follow;
			delete options.follow;
		}
		
		// stream mode
		var download = null;
		var pre_download = null;
		
		if ('download' in options) {
			download = options.download;
			if (typeof(download) == 'string') {
				try { download = fs.createWriteStream(download); }
				catch (err) {
					if (timer) { clearTimeout(timer); timer = null; }
					if (callback && !callback_fired) { callback_fired = true; callback(err); }
					return;
				}
				download.on('error', function(err) {
					if (timer) { clearTimeout(timer); timer = null; }
					if (callback && !callback_fired) { callback_fired = true; callback(err); }
					return;
				});
			}
			delete options.download;
		}
		if ('pre_download' in options) {
			// special callback to handle raw stream
			pre_download = options.pre_download;
			delete options.pre_download;
		}
		
		// reject bad characters in headers, which can crash node's writeHead() call
		for (var key in options.headers) {
			if (!checkIsHttpToken(key)) {
				callback_fired = true;
				return callback( new Error("Invalid characters in header name: " + key) );
			}
			if (checkInvalidHeaderChar(options.headers[key])) {
				callback_fired = true;
				return callback( new Error("Invalid characters in header value: " + key + ": " + options.headers[key]) );
			}
		}
		
		// construct request object
		var proto_class = (parts.protocol == 'https:') ? https : http;
		var req = proto_class.request( options, function(res) {
			// got response headers
			perf.end('wait', perf.perf.total.start);
			
			// clear initial timeout (first byte received)
			if (timer) { clearTimeout(timer); timer = null; }
			
			// check for auto-redirect
			if (follow && res.statusCode.toString().match(/^(301|302|307|308)$/) && res.headers['location']) {
				// revert options to original state
				options.timeout = timeout;
				options.follow = (typeof(follow) == 'number') ? (follow - 1) : follow;
				options.download = download;
				options.pre_download = pre_download;
				
				delete options.hostname;
				delete options.port;
				delete options.path;
				delete options.auth;
				
				// recurse into self for redirect
				callback_fired = true; // prevent firing twice
				self.request( res.headers['location'], options, callback );
				return;
			}
			
			if (download) {
				// stream content to a pipe
				download.on('finish', function() {
					perf.end('receive', perf.perf.total.start);
					if (callback && !callback_fired) {
						callback_fired = true;
						callback( null, res, download, self.finishPerf(perf) );
					}
				} );
				
				if (pre_download) {
					// special callback to handle raw stream externally
					if (pre_download( null, res, download ) === false) {
						// special pre-abort error case, switch to buffer mode
						download.removeAllListeners('finish');
						download = null;
					}
				}
				else if (self.autoDecompress && res.headers['content-encoding'] && res.headers['content-encoding'].match(/\bgzip\b/i)) {
					// gunzip stream
					res.pipe( zlib.createGunzip() ).pipe( download );
				}
				else if (self.autoDecompress && res.headers['content-encoding'] && res.headers['content-encoding'].match(/\bdeflate\b/i)) {
					// inflate stream
					res.pipe( zlib.createInflate() ).pipe( download );
				}
				else {
					// response is not encoded
					res.pipe( download );
				}
			} // stream mode
			
			if (!download) {
				var chunks = [];
				var total_bytes = 0;
				
				res.on('data', function (chunk) {
					// got chunk of data
					chunks.push( chunk );
					total_bytes += chunk.length;
				} );
				
				res.on('end', function() {
					// end of response
					perf.end('receive', perf.perf.total.start);
					perf.count('bytes_sent', (res.socket.bytesWritten || 0) - (res.socket._pixl_orig_bytes_written || 0));
					perf.count('bytes_received', (res.socket.bytesRead || 0) - (res.socket._pixl_orig_bytes_read || 0));
					res.socket._pixl_orig_bytes_written = res.socket.bytesWritten || 0;
					res.socket._pixl_orig_bytes_read = res.socket.bytesRead || 0;
					
					// prepare data
					if (total_bytes) {
						var buf = Buffer.concat(chunks, total_bytes);
						
						// check for gzip encoding
						if (self.autoDecompress && res.headers['content-encoding'] && res.headers['content-encoding'].match(/\bgzip\b/i) && callback) {
							// gunzip data first
							zlib.gunzip( buf, function(err, data) {
								perf.end('decompress', perf.perf.total.start);
								if (!callback_fired) {
									callback_fired = true;
									callback( err, res, data, self.finishPerf(perf) );
								}
							} );
						}
						else if (self.autoDecompress && res.headers['content-encoding'] && res.headers['content-encoding'].match(/\bdeflate\b/i) && callback) {
							// inflate data first
							zlib.inflate( buf, function(err, data) {
								perf.end('decompress', perf.perf.total.start);
								if (!callback_fired) {
									callback_fired = true;
									callback( err, res, data, self.finishPerf(perf) );
								}
							} );
						}
						else {
							// response content is not encoded
							if (callback && !callback_fired) {
								callback_fired = true;
								callback( null, res, buf, self.finishPerf(perf) );
							}
						}
					}
					else {
						// response content is empty
						if (callback && !callback_fired) {
							callback_fired = true;
							callback( null, res, new Buffer(0), self.finishPerf(perf) );
						}
					}
				} ); // end
			} // buffer mode
			
		} ); // request
		
		req.on('socket', function(socket) {
			// hook some socket events once we have a reference to it
			if (!socket._pixl_request_hooked) {
				socket._pixl_request_hooked = true;
				
				// Disable the Nagle algorithm.
				socket.setNoDelay( true );
				
				socket.on('lookup', function(err, address, family, hostname) {
					// track DNS lookup time
					perf.end('dns', perf.perf.total.start);
					
					// possibly cache IP for future lookups
					if (self.dnsTTL) {
						dns_cache[ options.hostname ] = {
							ip: address,
							expires: ((new Date()).getTime() / 1000) + self.dnsTTL
						};
					}
				} );
				
				socket.on('connect', function() {
					// track socket connect time
					perf.end('connect', perf.perf.total.start);
				} );
				
			} // not hooked
		} ); // socket
		
		req.on('finish', function() {
			// track data send time (only really works for POST/PUT)
			perf.end('send', perf.perf.total.start);
		} );
		
		req.on('error', function(e) {
			// handle socket errors
			if (callback && !aborted) {
				var msg = e.toString();
				if (msg.match(/ENOTFOUND/)) msg = "DNS: Failed to lookup IP from hostname: " + options.hostname;
				else if (msg.match(/ECONNREFUSED/)) msg = "Connection Refused: Failed to connect to host: " + options.hostname;
				else if (e.errno && ErrNo.code[e.errno]) {
					msg = ucfirst(ErrNo.code[e.errno].description) + " (" + e.message + ")";
				}
				if (timer) { clearTimeout(timer); timer = null; }
				if (!callback_fired) {
					callback_fired = true;
					callback( new Error(msg), null, null, self.finishPerf(perf) );
				}
			}
		} );
		
		if (timeout) {
			// set initial socket timeout which aborts the request
			// this is cleared at first byte, then we rely on the socket idle timeout
			timer = setTimeout( function() {
				if (!aborted) {
					aborted = true;
					req.abort();
					if (callback && !callback_fired) {
						callback_fired = true;
						callback( new Error("Socket Timeout ("+timeout+" ms)"), null, null, self.finishPerf(perf) );
					}
				}
			}, timeout );
		}
		
		if (post_data !== null) {
			// write post data to socket
			if (is_form) post_data.pipe( req );
			else {
				req.write( post_data );
				req.end();
			}
		}
		else req.end();
	},
	
	finishPerf: function(perf) {
		// finalize perf, adjust metrics and total
		// order: dns, connect, send, wait, receive, decompress
		var p = perf.perf;
		
		if (p.decompress && p.receive) p.decompress.elapsed -= p.receive.elapsed;
		if (p.receive && p.wait) p.receive.elapsed -= p.wait.elapsed;
		if (p.wait && p.send) p.wait.elapsed -= p.send.elapsed;
		if (p.send && p.connect) p.send.elapsed -= p.connect.elapsed;
		if (p.connect && p.dns) p.connect.elapsed -= p.dns.elapsed;
		
		for (var key in p) {
			if (p[key].elapsed) p[key].elapsed = Math.max(0, p[key].elapsed);
		}
		
		perf.end();
		return perf;
	}
	
});

function ucfirst(text) {
	// capitalize first character only, lower-case rest
	return text.substring(0, 1).toUpperCase() + text.substring(1, text.length).toLowerCase();
};
