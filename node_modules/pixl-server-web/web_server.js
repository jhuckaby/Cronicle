// Simple HTTP / HTTPS Web Server
// A component for the pixl-server daemon framework.
// Copyright (c) 2015 - 2018 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var os = require('os');
var zlib = require('zlib');
var async = require('async');
var Formidable = require('formidable');
var Querystring = require('querystring');
var Static = require('node-static');
var ErrNo = require('errno');
var Netmask = require('netmask').Netmask;
var StreamMeter = require("stream-meter");
var Class = require("pixl-class");
var Component = require("pixl-server/component");
var Perf = require('pixl-perf');

module.exports = Class.create({
	
	__name: 'WebServer',
	__parent: Component,
	
	version: require( __dirname + '/package.json' ).version,
	
	defaultConfig: {
		http_regex_private_ip: "(^127\\.0\\.0\\.1)|(^10\\.)|(^172\\.1[6-9]\\.)|(^172\\.2[0-9]\\.)|(^172\\.3[0-1]\\.)|(^192\\.168\\.)",
		http_regex_text: "(text|javascript|json|css|html)",
		http_regex_json: "(javascript|js|json)",
		http_keep_alives: 1,
		http_timeout: 120,
		http_static_index: "index.html",
		http_static_ttl: 0,
		http_max_upload_size: 32 * 1024 * 1024,
		http_temp_dir: os.tmpdir(),
		http_gzip_opts: { level: zlib.Z_DEFAULT_COMPRESSION, memLevel: 8 },
		http_default_acl: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
		http_log_requests: false,
		http_recent_requests: 10,
		http_max_connections: 0,
		http_clean_headers: false
	},
	
	conns: null,
	numConns: 0,
	nextId: 1,
	uriFilters: null,
	uriHandlers: null,
	methodHandlers: null,
	defaultACL: [],
	stats: null,
	recent: null,
	
	startup: function(callback) {
		// start http server
		var self = this;
		
		this.logDebug(2, "pixl-server-web v" + this.version + " starting up");
		
		// setup connections and handlers
		this.conns = {};
		this.uriFilters = [];
		this.uriHandlers = [];
		this.methodHandlers = [];
		this.regexPrivateIP = new RegExp( this.config.get('http_regex_private_ip') );
		this.regexTextContent = new RegExp( this.config.get('http_regex_text'), "i" );
		this.regexJSONContent = new RegExp( this.config.get('http_regex_json'), "i" );
		this.logRequests = this.config.get('http_log_requests');
		this.regexLogRequests = this.logRequests ? (new RegExp( this.config.get('http_regex_log') || '.+' )) : null;
		this.keepRecentRequests = this.config.get('http_recent_requests');
		this.stats = { current: {}, last: {} };
		this.recent = [];
		
		// keep-alives
		this.keepAlives = this.config.get('http_keep_alives');
		if (this.keepAlives === false) this.keepAlives = 0;
		else if (this.keepAlives === true) this.keepAlives = 1;
		
		// prep static file server
		this.fileServer = new Static.Server( this.config.get('http_htdocs_dir'), {
			cache: this.config.get('http_static_ttl'),
			serverInfo: this.config.get('http_server_signature') || this.__name,
			gzip: this.config.get('http_gzip_text') ? this.regexTextContent : false,
			headers: JSON.parse( JSON.stringify(this.config.get('http_response_headers') || {}) ),
			indexFile: this.config.get('http_static_index')
		} );
		
		// special file server for internal redirects
		this.internalFileServer = new Static.Server( '/', {
			cache: this.config.get('http_static_ttl'),
			serverInfo: this.config.get('http_server_signature') || this.__name,
			gzip: this.config.get('http_gzip_text') ? this.regexTextContent : false,
			headers: JSON.parse( JSON.stringify(this.config.get('http_response_headers') || {}) ),
			indexFile: this.config.get('http_static_index')
		} );
		
		// front-end https header detection
		var ssl_headers = this.config.get('https_header_detect');
		if (ssl_headers) {
			this.ssl_header_detect = {};
			for (var key in ssl_headers) {
				this.ssl_header_detect[ key.toLowerCase() ] = new RegExp( ssl_headers[key] );
			}
		}
		
		// initialize default ACL blocks
		if (this.config.get('http_default_acl')) {
			try {
				this.config.get('http_default_acl').forEach( function(block) {
					self.defaultACL.push( new Netmask(block) );
				} );
			}
			catch (err) {
				var err_msg = "Failed to initialize ACL: " + err.message;
				this.logError('acl', err_msg);
				throw new Error(err_msg);
			}
		}
		
		// listen for tick events to swap stat buffers
		this.server.on( 'tick', this.tick.bind(this) );
		
		// start listeners
		this.startHTTP( function() {
			// also start HTTPS listener?
			if (self.config.get('https')) {
				self.startHTTPS( callback );
			} // https
			else callback();
		} );
	},
	
	startHTTP: function(callback) {
		// start http server
		var self = this;
		var port = this.config.get('http_port');
		var max_conns = this.config.get('http_max_connections') || 0;
		
		this.logDebug(2, "Starting HTTP server on port: " + port);
		
		this.http = require('http').createServer( function(request, response) {
			if (self.config.get('https_force')) {
				self.logDebug(6, "Forcing redirect to HTTPS (SSL)");
				request.headers.ssl = 1; // force SSL url
				var redirect_url = self.getSelfURL(request, request.url);
				if (!redirect_url) {
					self.sendHTTPResponse( { response: response }, "400 Bad Request", {}, "" );
					return;
				}
				
				self.sendHTTPResponse( 
					{ response: response }, 
					"301 Moved Permanently", 
					{ 'Location': redirect_url }, 
					"" // empty body
				);
			}
			else {
				self.parseHTTPRequest( request, response );
			}
		} );
		
		this.http.on('connection', function(socket) {
			var ip = socket.remoteAddress || '';
			
			if (max_conns && (self.numConns >= max_conns)) {
				// reached maximum concurrent connections, abort new ones
				self.logError('maxconns', "Maximum concurrent connections reached, denying connection from: " + ip, { ip: ip, max: max_conns });
				socket.end();
				socket.unref();
				socket.destroy(); // hard close
				return;
			}
			if (self.server.shut) {
				// server is shutting down, abort new connections
				self.logError('shutdown', "Server is shutting down, denying connection from: " + ip, { ip: ip });
				socket.end();
				socket.unref();
				socket.destroy(); // hard close
				return;
			}
			
			var id = self.getNextId('c');
			self.conns[ id ] = socket;
			self.numConns++;
			self.logDebug(8, "New incoming HTTP connection: " + id, { ip: ip, num_conns: self.numConns });
			
			// Disable the Nagle algorithm.
			socket.setNoDelay( true );
			
			// add our own metadata to socket
			socket._pixl_data = {
				id: id,
				proto: 'http',
				port: port,
				time_start: (new Date()).getTime(),
				num_requests: 0,
				bytes_in: 0,
				bytes_out: 0
			};
			
			socket.on('error', function(err) {
				// client aborted connection?
				var msg = err.message;
				if (err.errno && ErrNo.code[err.errno]) {
					msg = ucfirst(ErrNo.code[err.errno].description) + " (" + err.message + ")";
				}
				self.logError(err.code || 1, "Socket error: " + id + ": " + msg, { ip: ip });
			} );
			
			socket.on('close', function() {
				// socket has closed
				var now = (new Date()).getTime();
				self.logDebug(8, "HTTP connection has closed: " + id, {
					ip: ip,
					total_elapsed: now - socket._pixl_data.time_start,
					num_requests: socket._pixl_data.num_requests,
					bytes_in: socket._pixl_data.bytes_in,
					bytes_out: socket._pixl_data.bytes_out
				});
				delete self.conns[ id ];
				self.numConns--;
			} );
		} );
		
		this.http.listen( port, function(err) {
			if (err) {
				self.logError('startup', "Failed to start HTTP listener: " + err.message);
				throw err;
				return;
			}
			if (!port) {
				port = self.http.address().port;
				self.config.set('http_port', port);
				self.logDebug(3, "Actual HTTP listener port chosen: " + port);
			}
			callback();
		} );
		
		// set idle socket timeout
		if (this.config.get('http_timeout')) {
			this.http.setTimeout( this.config.get('http_timeout') * 1000 );
		}
	},
	
	startHTTPS: function(callback) {
		// start https server
		var self = this;
		var port = this.config.get('https_port');
		var max_conns = this.config.get('https_max_connections') || this.config.get('http_max_connections') || 0;
		
		this.logDebug(2, "Starting HTTPS (SSL) server on port: " + port);
		
		var opts = {
			cert: fs.readFileSync( this.config.get('https_cert_file') ),
			key: fs.readFileSync( this.config.get('https_key_file') )
		};
		
		this.https = require('https').createServer( opts, function(request, response) {
			// add a flag in headers for downstream code to detect
			request.headers['ssl'] = 1;
			request.headers['https'] = 1;
			
			self.parseHTTPRequest( request, response );
		} );
		
		this.https.on('secureConnection', function(socket) {
			var ip = socket.remoteAddress || '';
			
			if (max_conns && (self.numConns >= max_conns)) {
				// reached maximum concurrent connections, abort new ones
				self.logError('maxconns', "Maximum concurrent connections reached, denying request from: " + ip, { ip: ip, max: max_conns });
				socket.end();
				socket.unref();
				socket.destroy(); // hard close
				return;
			}
			if (self.server.shut) {
				// server is shutting down, abort new connections
				self.logError('shutdown', "Server is shutting down, denying connection from: " + ip, { ip: ip });
				socket.end();
				socket.unref();
				socket.destroy(); // hard close
				return;
			}
			
			var id = self.getNextId('cs');
			self.conns[ id ] = socket;
			self.numConns++;
			self.logDebug(8, "New incoming HTTPS (SSL) connection: " + id, { ip: ip, num_conns: self.numConns });
			
			// Disable the Nagle algorithm.
			socket.setNoDelay( true );
			
			// add our own metadata to socket
			socket._pixl_data = {
				id: id,
				proto: 'https',
				port: port,
				time_start: (new Date()).getTime(),
				num_requests: 0,
				bytes_in: 0,
				bytes_out: 0
			};
			
			socket.on('error', function(err) {
				// client aborted connection?
				var msg = err.message;
				if (err.errno && ErrNo.code[err.errno]) {
					msg = ucfirst(ErrNo.code[err.errno].description) + " (" + err.message + ")";
				}
				self.logError(err.code || 1, "Socket error: " + id + ": " + msg, { ip: ip });
			} );
			
			socket.on('close', function() {
				// socket has closed
				var now = (new Date()).getTime();
				self.logDebug(8, "HTTPS (SSL) connection has closed: " + id, {
					ip: ip,
					total_elapsed: now - socket._pixl_data.time_start,
					num_requests: socket._pixl_data.num_requests,
					bytes_in: socket._pixl_data.bytes_in,
					bytes_out: socket._pixl_data.bytes_out
				});
				delete self.conns[ id ];
				self.numConns--;
			} );
		} );
		
		this.https.listen( port, function(err) {
			if (err) {
				self.logError('startup', "Failed to start HTTPS listener: " + err.message);
				throw err;
				return;
			}
			if (!port) {
				port = self.https.address().port;
				self.config.set('https_port', port);
				self.logDebug(3, "Actual HTTPS listener port chosen: " + port);
			}
			callback();
		} );
		
		// set idle socket timeout
		var timeout_sec = this.config.get('https_timeout') || this.config.get('http_timeout') || 0;
		if (timeout_sec) {
			this.https.setTimeout( timeout_sec * 1000 );
		}
	},
	
	addURIFilter: function(uri, name, callback) {
		// add custom filter (chainable pre-handler) for URI
		this.logDebug(3, "Adding custom URI filter: " + uri + ": " + name);
		
		if (typeof(uri) == 'string') {
			uri = new RegExp("^" + uri + "$");
		}
		
		this.uriFilters.push({
			regexp: uri,
			name: name,
			callback: callback
		});
	},
	
	removeURIFilter: function(name) {
		// remove filter for URI given name
		this.uriFilters = this.uriFilters.filter( function(item) {
			return( item.name != name );
		} );
	},
	
	addURIHandler: function() {
		// add custom handler for URI
		// Calling conventions:
		//		uri, name, callback
		//		uri, name, acl, callback
		var self = this;
		var uri = arguments[0];
		var name = arguments[1];
		var acl = false;
		var callback = null;
		
		if (arguments.length == 4) { acl = arguments[2]; callback = arguments[3]; }
		else { callback = arguments[2]; }
		
		if (acl) {
			if (Array.isArray(acl)) {
				// custom ACL for this handler
				var blocks = [];
				try {
					acl.forEach( function(block) {
						blocks.push( new Netmask(block) );
					} );
					acl = blocks;
				}
				catch (err) {
					var err_msg = "Failed to initialize custom ACL: " + err.message;
					this.logError('acl', err_msg);
					throw new Error(err_msg);
				}
			}
			else {
				// use default ACL list
				acl = this.defaultACL;
			}
		} // acl
		
		this.logDebug(3, "Adding custom URI handler: " + uri + ": " + name);
		if (typeof(uri) == 'string') {
			uri = new RegExp("^" + uri + "$");
		}
		
		// special case: pass string as callback for internal file redirect
		if (typeof(callback) == 'string') {
			var target_file = callback;
			callback = function(args, cb) {
				self.logDebug(9, "Performing internal redirect to: " + target_file);
				args.internalFile = target_file;
				cb(false);
			};
		}
		
		this.uriHandlers.push({
			regexp: uri,
			name: name,
			acl: acl,
			callback: callback
		});
	},
	
	removeURIHandler: function(name) {
		// remove handler for URI given name
		this.uriHandlers = this.uriHandlers.filter( function(item) {
			return( item.name != name );
		} );
	},
	
	addMethodHandler: function(method, name, callback) {
		// add a handler for an entire request method, e.g. OPTIONS
		this.logDebug(3, "Adding custom request method handler: " + method + ": " + name);
		this.methodHandlers.push({
			method: method,
			name: name,
			callback: callback
		});
	},
	
	removeMethodHandler: function(name) {
		// remove handler for method given name
		this.methodHandlers = this.methodHandlers.filter( function(item) {
			return( item.name != name );
		} );
	},
	
	parseHTTPRequest: function(request, response) {
		// handle raw http request
		var self = this;
		var ips = this.getAllClientIPs(request);
		var ip = this.getPublicIP(ips);
		var args = {};
		
		this.logDebug(8, "New HTTP request: " + request.method + " " + request.url + " (" + ips.join(', ') + ")", {
			socket: request.socket._pixl_data.id,
			version: request.httpVersion
		});
		this.logDebug(9, "Incoming HTTP Headers:", request.headers);
		
		// detect front-end https
		if (!request.headers.ssl && this.ssl_header_detect) {
			for (var key in this.ssl_header_detect) {
				if (request.headers[key] && request.headers[key].match(this.ssl_header_detect[key])) {
					this.logDebug(9, "Detected front-end HTTPS request: " + key + ": " + request.headers[key]);
					request.headers.ssl = 1;
					request.headers.https = 1;
					break;
				}
			}
		}
		
		// parse query string
		var query = {};
		if (request.url.match(/\?(.+)$/)) {
			query = Querystring.parse( RegExp.$1 );
		}
		
		// determine how to process request body
		var params = {};
		var files = {};
		
		// setup args for call to handler
		args.request = request;
		args.response = response;
		args.ip = ip;
		args.ips = ips;
		args.query = query;
		args.params = params;
		args.files = files;
		args.server = this;
		args.state = 'reading';
		
		// parse HTTP cookies, if present
		args.cookies = {};
		if (request.headers['cookie']) {
			var pairs = request.headers['cookie'].split(/\;\s*/);
			for (var idx = 0, len = pairs.length; idx < len; idx++) {
				if (pairs[idx].match(/^([^\=]+)\=(.*)$/)) {
					args.cookies[ RegExp.$1 ] = RegExp.$2;
				}
			} // foreach cookie
		} // headers.cookie
		
		// track performance of request
		args.perf = new Perf();
		args.perf.begin();
		args.perf.begin('read');
		
		// we have to guess at the http raw status + raw header size
		// as Node's http.js has already parsed it
		var raw_bytes_read = 0;
		raw_bytes_read += [request.method, request.url, 'HTTP/' + request.httpVersion + "\r\n"].join(' ').length;
		raw_bytes_read += request.rawHeaders.join("\r\n").length + 4; // CRLFx2
		args.perf.count('bytes_in', raw_bytes_read);
		
		// track current request in socket metadata
		request.socket._pixl_data.current = args;
		
		// post or get/head
		if (request.method == 'POST') {
			var content_type = request.headers['content-type'] || '';
			
			if (content_type.match(/(multipart|urlencoded)/i)) {
				// use formidable for the heavy lifting
				var form = new Formidable.IncomingForm();
				form.keepExtensions = true;
				form.maxFieldsSize = self.config.get('http_max_upload_size');
				form.hash = false;
				form.uploadDir = self.config.get('http_temp_dir');
				
				form.on('progress', function(bytesReceived, bytesExpected) {
					self.logDebug(10, "Upload progress: " + bytesReceived + " of " + bytesExpected + " bytes");
					args.perf.count('bytes_in', bytesReceived);
				} );
				
				form.parse(request, function(err, _fields, _files) {
					args.perf.end('read');
					if (err) {
						self.logError(400, "Error processing POST from: " + ip + ": " + request.url + ": " + err);
						self.sendHTTPResponse( args, "400 Bad Request", {}, "400 Bad Request" );
						return;
					}
					else {
						args.params = _fields || {};
						args.files = _files || {};
						self.filterHTTPRequest(args);
					}
				} );
			}
			else {
				// parse ourselves (i.e. raw json)
				var bytesMax = self.config.get('http_max_upload_size');
				var bytesExpected = request.headers['content-length'] || "(Unknown)";
				var total_bytes = 0;
				var chunks = [];
				
				request.on('data', function(chunk) {
					// receive data chunk
					chunks.push( chunk );
					total_bytes += chunk.length;
					args.perf.count('bytes_in', chunk.length);
					
					self.logDebug(10, "Upload progress: " + total_bytes + " of " + bytesExpected + " bytes");
					if (total_bytes > bytesMax) {
						self.logError(413, "Error processing POST from: " + ip + ": " + request.url + ": Max POST size exceeded");
						request.socket.end();
						return;
					}
				} );
				request.on('end', function() {
					// request body is complete
					var body = Buffer.concat(chunks, total_bytes);
					
					if (content_type.match( self.regexJSONContent )) {
						// parse json
						try {
							args.params = JSON.parse( body.toString() );
						}
						catch (e) {
							self.logError(400, "Error processing POST from: " + ip + ": " + request.url + ": Failed to parse JSON: " + e);
							self.sendHTTPResponse( args, "400 Bad Request", {}, "400 Bad Request" );
							return;
						}
					}
					else {
						// raw post, no parse
						args.params.raw = body;
					}
					
					// now we can handle the full request
					args.perf.end('read');
					self.filterHTTPRequest(args);
				} );
			}
		} // post
		else {
			// non-post, i.e. get or head, handle right away
			args.perf.end('read');
			this.filterHTTPRequest(args);
		}
	},
	
	filterHTTPRequest: function(args) {
		// apply URL filters to request, if any, before calling handlers
		var self = this;
		
		// quick early exit: no filters, jump out now
		if (!this.uriFilters.length) return this.handleHTTPRequest(args);
		
		// see which filters need to be applied
		var uri = args.request.url.replace(/\?.*$/, '');
		var filters = [];
		
		for (var idx = 0, len = this.uriFilters.length; idx < len; idx++) {
			if (uri.match(this.uriFilters[idx].regexp)) filters.push( this.uriFilters[idx] );
		}
		
		// if no filters matched, another quick early exit
		if (!filters.length) return this.handleHTTPRequest(args);
		
		args.state = 'filtering';
		
		// use async to allow filters to run in sequence
		async.eachSeries( filters,
			function(filter, callback) {
				self.logDebug(8, "Invoking filter for request: " + args.request.method + ' ' + uri + ": " + filter.name);
				
				args.perf.begin('filter');
				filter.callback( args, function() {
					// custom filter complete
					args.perf.end('filter');
					
					if ((arguments.length == 3) && (typeof(arguments[0]) == "string")) {
						// filter sent status, headers and body
						self.sendHTTPResponse( args, arguments[0], arguments[1], arguments[2] );
						return callback("ABORT");
					}
					else if (arguments[0] === true) {
						// true means filter sent the raw response itself
						self.logDebug(9, "Filter sent custom response");
						return callback("ABORT");
					}
					else if (arguments[0] === false) {
						// false means filter exited normally
						self.logDebug(9, "Filter passthru, continuing onward");
						return callback();
					}
					else {
						// unknown response
						self.sendHTTPResponse( args, 
							"500 Internal Server Error", 
							{ 'Content-Type': "text/html" }, 
							"500 Internal Server Error: URI filter " + filter.name + " returned unknown data type.\n"
						);
						return callback("ABORT");
					}
				} );
			},
			function(err) {
				// all filters complete
				// if a filter handled the response, we're done
				if (err === "ABORT") return;
				
				// otherwise, proceed to handling the request proper (method / URI handlers)
				self.handleHTTPRequest(args);
			}
		); // eachSeries
	},
	
	handleHTTPRequest: function(args) {
		// determine if we have an API route
		var self = this;
		var uri = args.request.url.replace(/\?.*$/, '');
		var handler = null;
		
		args.state = 'processing';
		args.perf.begin('process');
		
		// check method handlers first, e.g. OPTIONS
		for (var idx = 0, len = this.methodHandlers.length; idx < len; idx++) {
			if (this.methodHandlers[idx].method && (this.methodHandlers[idx].method == args.request.method)) {
				handler = this.methodHandlers[idx];
				idx = len;
			}
		}
		
		// only check URI handlers if no method handler matched
		if (!handler) {
			for (var idx = 0, len = this.uriHandlers.length; idx < len; idx++) {
				var matches = uri.match(this.uriHandlers[idx].regexp);
				if (matches) {
					args.matches = matches;
					handler = this.uriHandlers[idx];
					idx = len;
				}
			}
		}
		
		if (handler) {
			this.logDebug(6, "Invoking handler for request: " + args.request.method + ' ' + uri + ": " + handler.name);
			
			// Check ACL here
			if (handler.acl) {
				var allowed = true;
				var bad_ip = '';
				
				for (var idx = 0, len = args.ips.length; idx < len; idx++) {
					var ip = args.ips[idx];
					if (ip.match(/(\d+\.\d+\.\d+\.\d+)/)) ip = RegExp.$1; // extract IPv4
					else ip = '0.0.0.0'; // unsupported format, probably ipv6
					var contains = false;
					
					for (var idy = 0, ley = handler.acl.length; idy < ley; idy++) {
						var block = handler.acl[idy];
						
						try { 
							if (block.contains(ip)) { contains = true; idy = ley; }
						}
						catch (err) {;}
					} // foreach acl
					
					if (!contains) {
						// All ACLs rejected, so that's it
						allowed = false;
						bad_ip = ip;
						idx = len;
					}
				} // foreach ip
				
				if (allowed) {
					// yay!
					this.logDebug(9, "ACL allowed request", args.ips);
				}
				else {
					// nope
					this.logError(403, "Forbidden: IP address rejected by ACL: " + bad_ip, {
						ips: args.ips,
						useragent: args.request.headers['user-agent'] || '',
						referrer: args.request.headers['referer'] || '',
						cookie: args.request.headers['cookie'] || '',
						url: this.getSelfURL(args.request, args.request.url) || args.request.url
					});
					
					args.perf.end('process');
					
					this.sendHTTPResponse( args, 
						"403 Forbidden", 
						{ 'Content-Type': "text/html" }, 
						"403 Forbidden: ACL disallowed request.\n"
					);
					
					this.deleteUploadTempFiles(args);
					return;
				} // not allowed
			} // acl check
			
			handler.callback( args, function() {
				// custom handler complete, send response
				if ((arguments.length == 3) && (typeof(arguments[0]) == "string")) {
					// handler sent status, headers and body
					args.perf.end('process');
					self.sendHTTPResponse( args, arguments[0], arguments[1], arguments[2] );
				}
				else if (arguments[0] === true) {
					// true means handler sent the raw response itself
					self.logDebug(9, "Handler sent custom response");
				}
				else if (arguments[0] === false) {
					// false means handler did nothing, fall back to static
					self.logDebug(9, "Handler declined, falling back to static file");
					args.perf.end('process');
					self.sendStaticResponse( args );
				}
				else if (typeof(arguments[0]) == "object") {
					// REST-style JSON response
					var json = arguments[0];
					self.logDebug(10, "API Response JSON:", json);
					args.perf.end('process');
					
					var status = arguments[1] || "200 OK";
					var headers = arguments[2] || {};
					var payload = args.query.pretty ? JSON.stringify(json, null, "\t") : JSON.stringify(json);
					
					if (args.query.format && (args.query.format.match(/html/i)) && args.query.callback) {
						// old school IFRAME style response
						headers['Content-Type'] = "text/html";
						self.sendHTTPResponse( args, 
							status, 
							headers, 
							'<html><head><script>' + 
								args.query.callback + "(" + payload + ");\n" + 
								'</script></head><body>&nbsp;</body></html>' + "\n"
						);
					}
					else if (args.query.callback) {
						// JSON with JS callback wrapper
						headers['Content-Type'] = "text/javascript";
						self.sendHTTPResponse( args, 
							status, 
							headers, 
							args.query.callback + "(" + payload + ");\n"
						);
					}
					else {
						// pure json
						headers['Content-Type'] = "application/json";
						self.sendHTTPResponse( args, 
							status, 
							headers, 
							payload + "\n"
						);
					} // pure json
				} // json response
				else {
					// unknown response
					self.sendHTTPResponse( args, 
						"500 Internal Server Error", 
						{ 'Content-Type': "text/html" }, 
						"500 Internal Server Error: URI handler " + handler.name + " returned unknown data type.\n"
					);
				}
				
				// delete temp files
				self.deleteUploadTempFiles(args);
			} );
		} // uri handler
		else {
			// no uri handler, serve static file instead
			args.perf.end('process');
			this.sendStaticResponse( args );
			
			// delete temp files
			this.deleteUploadTempFiles(args);
		}
	},
	
	deleteUploadTempFiles: function(args) {
		// delete leftover temp files created by Formidable
		for (var key in args.files) {
			var file = args.files[key];
			fs.unlink( file.path, function(err) {
				// file may have been moved / deleted already, so ignore error here
			} );
		}
	},
	
	sendStaticResponse: function(args) {
		// serve static file for URI
		var self = this;
		var request = args.request;
		var response = args.response;
		this.logDebug(9, "Serving static file for: " + args.request.url);
		
		args.state = 'writing';
		args.perf.begin('write');
		
		response.on('finish', function() {
			// response actually completed writing
			self.logDebug(9, "Response finished writing to socket");
			args.perf.end('write');
			self.finishRequest(args);
		} );
		
		var handleFileServerResponse = function(err, result) {
			var headers = null;
			if (err) {
				self.logError(err.status, "Error serving static file: " + request.url + ": HTTP " + err.status + ' ' + err.message, {
					ips: args.ips,
					useragent: request.headers['user-agent'] || '',
					referrer: request.headers['referer'] || '',
					cookie: request.headers['cookie'] || '',
					url: self.getSelfURL(request, request.url) || request.url
				});
				args.http_code = err.status;
				args.http_status = err.message;
				headers = err.headers;
				
				if (self.writeHead(args, err.status, err.message, err.headers)) {
					response.write( "Error: HTTP " + err.status + ' ' + err.message + "\n" );
					response.end();
				}
			}
			else {
				self.logDebug(8, "Static HTTP response sent: HTTP " + result.status, result.headers);
				args.perf.count('bytes_out', result.headers['Content-Length'] || 0);
				
				args.http_code = result.status;
				args.http_status = "OK";
				headers = result.headers;
			}
			
			// guess number of bytes in response header, minus data payload
			args.perf.count('bytes_out', ("HTTP " + args.http_code + " OK\r\n").length);
			for (var key in headers) {
				args.perf.count('bytes_out', (key + ": " + headers[key] + "\r\n").length);
			}
			args.perf.count('bytes_out', 4); // CRLFx2
		};
		
		if (args.internalFile) {
			// special case, serve up any specified file as surrogage (internal redirect)
			request.url = args.internalFile;
			this.internalFileServer.serve(request, response, handleFileServerResponse);
		}
		else {
			this.fileServer.serve(request, response, handleFileServerResponse);
		}
	},
	
	sendHTTPResponse: function(args, status, headers, body) {
		// send http response
		var self = this;
		var request = args.request;
		var response = args.response;
		
		// copy headers object so we don't clobber user data
		if (headers) headers = Object.assign({}, headers);
		else headers = {};
		
		// in case the URI handler called sendHTTPResponse() directly, end the process metric
		if (args.perf.perf.process && !args.perf.perf.process.end) args.perf.end('process');
		
		args.state = 'writing';
		args.perf.begin('write');
		
		// merge in default response headers
		var default_headers = this.config.get('http_response_headers') || null;
		if (default_headers) {
			for (var key in default_headers) {
				if (typeof(headers[key]) == 'undefined') headers[key] = default_headers[key];
			}
		}
		if (typeof(headers['Server']) == 'undefined') {
			headers['Server'] = this.config.get('http_server_signature') || this.__name;
		}
		
		// parse code and status
		var http_code = 200;
		var http_status = "OK";
		if (status.match(/^(\d+)\s+(.+)$/)) {
			http_code = parseInt( RegExp.$1 );
			http_status = RegExp.$2;
		}
		args.http_code = http_code;
		args.http_status = http_status;
		
		// use duck typing to see if we have a stream, buffer or string
		var is_stream = (body && body.pipe);
		var is_buffer = (body && body.fill);
		var is_string = (body && !is_stream && !is_buffer);
		
		// if string, convert to buffer so content length is correct (unicode)
		if (is_string) {
			body = new Buffer(body);
		}
		
		// set content-type if not already set
		if (body && !is_stream && (typeof(headers['Content-Length']) == 'undefined')) {
			headers['Content-Length'] = body.length;
		}
		
		// track stream bytes, if applicable
		var meter = null;
		
		response.on('finish', function() {
			// response actually completed writing
			self.logDebug(9, "Response finished writing to socket");
			
			// guess number of bytes in response header, minus data payload
			args.perf.count('bytes_out', ("HTTP " + args.http_code + " OK\r\n").length);
			for (var key in headers) {
				args.perf.count('bytes_out', (key + ": " + headers[key] + "\r\n").length);
			}
			args.perf.count('bytes_out', 4); // CRLFx2
			
			// add metered bytes if streamed
			if (meter) args.perf.count('bytes_out', meter.bytes || 0);
			
			// done writing
			args.perf.end('write');
			self.finishRequest(args);
		} );
		
		// handle stream errors (abort response)
		if (is_stream) {
			body.on('error', function(err) {
				self.logError('stream', "Stream error serving response: " + request.url + ": " + err.message, {
					ips: args.ips,
					useragent: request.headers['user-agent'] || '',
					referrer: request.headers['referer'] || '',
					cookie: request.headers['cookie'] || '',
					url: self.getSelfURL(request, request.url) || request.url
				});
				
				args.http_code = 500;
				args.http_status = "Internal Server Error";
				args.perf.count('errors', 1);
				
				body.unpipe();
				response.end();
			});
		}
		
		// auto-gzip response based on content type
		if (body && 
			(http_code == 200) && 
			this.config.get('http_gzip_text') && 
			headers['Content-Type'] && 
			headers['Content-Type'].match(this.regexTextContent) && 
			!headers['Content-Encoding'] && // do not encode if already encoded
			args.request && 
			args.request.headers['accept-encoding'] && 
			args.request.headers['accept-encoding'].match(/\bgzip\b/i)) {
			
			if (is_stream) {
				// stream pipe
				self.logDebug(9, "Sending streaming text output with gzip encoding");
				headers['Content-Encoding'] = 'gzip';
				
				self.logDebug(9, "Sending streaming HTTP response: " + status, headers);
				
				if (self.writeHead( args, http_code, http_status, headers )) {
					var gzip = zlib.createGzip( self.config.get('http_gzip_opts') || {} );
					meter = new StreamMeter();
					
					body.pipe( gzip ).pipe( meter ).pipe( response );
					
					self.logDebug(9, "Request complete");
				}
			}
			else {
				zlib.gzip(body, self.config.get('http_gzip_opts') || {}, function(err, data) {
					if (err) {
						// should never happen
						self.logError('gzip', "Failed to gzip compress content: " + err);
						data = body;
					}
					else {
						// no error
						body = null; // free up memory
						self.logDebug(9, "Compressed text output with gzip: " + headers['Content-Length'] + " bytes down to: " + data.length + " bytes");
						headers['Content-Length'] = data.length;
						headers['Content-Encoding'] = 'gzip';
					}
					
					self.logDebug(9, "Sending HTTP response: " + status, headers);
					
					// send data
					if (self.writeHead( args, http_code, http_status, headers )) {
						response.write( data );
						response.end();
						
						args.perf.count('bytes_out', data.length);
						self.logDebug(9, "Request complete");
					}
				}); // zlib.gzip
			} // buffer or string
		} // gzip
		else {
			// no compression
			if (is_stream) {
				this.logDebug(9, "Sending streaming HTTP response: " + status, headers);
				
				if (self.writeHead( args, http_code, http_status, headers )) {
					meter = new StreamMeter();
					body.pipe( meter ).pipe( response );
				}
			}
			else {
				this.logDebug(9, "Sending HTTP response: " + status, headers);
				
				// send data
				if (self.writeHead( args, http_code, http_status, headers )) {
					if (body) {
						response.write( body );
						args.perf.count('bytes_out', body.length);
					}
					response.end();
				}
			}
			this.logDebug(9, "Request complete");
		}
	},
	
	writeHead: function(args, http_code, http_status, headers) {
		// wrap call to response.writeHead(), as it can throw
		var request = args.request;
		var response = args.response;
		
		if (headers && this.config.get('http_clean_headers')) {
			// prevent bad characters in headers, which can crash node's writeHead() call
			for (var key in headers) {
				headers[key] = headers[key].toString().replace(/([\x80-\xFF\x00-\x1F\u00FF-\uFFFF])/g, '');
			}
		}
		
		response.writeHead( http_code, http_status, headers || {} );
		return true;
	},
	
	finishRequest: function(args) {
		// finish up request tracking
		args.perf.count('num_requests', 1);
		args.perf.end();
		
		var socket_data = args.request.socket._pixl_data;
		var metrics = args.perf.metrics();
		
		this.logDebug(9, "Request performance metrics:", metrics);
		
		// write to access log
		if (this.logRequests && args.request.url.match(this.regexLogRequests)) {
			this.logTransaction( 'HTTP ' + args.http_code + ' ' + args.http_status, args.request.url, {
				proto: args.request.headers['ssl'] ? 'https' : socket_data.proto,
				ips: args.ips,
				host: args.request.headers['host'] || '',
				ua: args.request.headers['user-agent'] || '',
				perf: metrics
			} );
		}
		
		// keep a list of the most recent N requests
		if (this.keepRecentRequests) {
			this.recent.unshift({
				when: (new Date()).getTime() / 1000,
				proto: args.request.headers['ssl'] ? 'https' : socket_data.proto,
				port: socket_data.port,
				code: args.http_code,
				status: args.http_status,
				uri: args.request.url,
				ips: args.ips,
				host: args.request.headers['host'] || '',
				ua: args.request.headers['user-agent'] || '',
				perf: metrics
			});
			if (this.recent.length > this.keepRecentRequests) this.recent.pop();
		}
		
		// add metrics to socket
		socket_data.num_requests++;
		socket_data.bytes_in += metrics.counters.bytes_in || 0;
		socket_data.bytes_out += metrics.counters.bytes_out || 0;
		
		// add metrics to stats system
		var stats = this.stats.current;
		
		for (var key in metrics.perf) {
			var elapsed = metrics.perf[key];
			if (!stats[key]) {
				stats[key] = {
					'st': 'mma', // stat type: "min max avg"
					'min': elapsed,
					'max': elapsed,
					'total': elapsed,
					'count': 1
				};
			}
			else {
				var stat = stats[key];
				if (elapsed < stat.min) stat.min = elapsed;
				else if (elapsed > stat.max) stat.max = elapsed;
				stat.total += elapsed;
				stat.count++;
			}
		}
		
		for (var key in metrics.counters) {
			var amount = metrics.counters[key];
			if (!stats[key]) stats[key] = 0;
			stats[key] += amount;
		}
		
		// remove reference to current request
		delete socket_data.current;
		
		// Handle HTTP Keep-Alives
		var request = args.request;
		
		switch (this.keepAlives) {
			case 0:
			case 'close':
				// KA disabled, always close
				this.logDebug(9, "Closing socket: " + request.socket._pixl_data.id);
				request.socket.end(); // close nicely
			break;
			
			case 1:
			case 'request':
				// KA enabled only if client explicitly requests it
				if (!request.headers.connection || !request.headers.connection.match(/keep\-alive/i)) {
					// close socket
					this.logDebug(9, "Closing socket: " + request.socket._pixl_data.id);
					request.socket.end(); // close nicely
				}
				else {
					this.logDebug(9, "Keeping socket open for keep-alives: " + request.socket._pixl_data.id);
				}
			break;
			
			case 2:
			case 'default':
				// KA enabled by default, only disable if client says close
				if (request.headers.connection && request.headers.connection.match(/close/i)) {
					this.logDebug(9, "Closing socket: " + request.socket._pixl_data.id);
					request.socket.end(); // close nicely
				}
				else {
					this.logDebug(9, "Keeping socket open for keep-alives: " + request.socket._pixl_data.id);
				}
			break;
		}
	},
	
	tick: function() {
		// swap current and last stat buffers
		// called every 1s via server tick event
		this.stats.last = this.stats.current;
		this.stats.current = {};
	},
	
	getStats: function() {
		// get current stats, merged with live socket and request info
		var socket_info = {};
		var now = (new Date()).getTime();
		
		for (var key in this.conns) {
			var socket = this.conns[key];
			var socket_data = socket._pixl_data;
			var info = {
				state: 'idle',
				ip: socket.remoteAddress,
				proto: socket_data.proto,
				port: socket_data.port,
				elapsed_ms: now - socket_data.time_start,
				num_requests: socket_data.num_requests,
				bytes_in: socket_data.bytes_in,
				bytes_out: socket_data.bytes_out
			};
			if (socket_data.current) {
				// current request in progress, merge this in
				var args = socket_data.current;
				info.ips = args.ips;
				info.state = args.state;
				info.method = args.request.method;
				info.uri = args.request.url;
				info.host = args.request.headers['host'] || '';
				info.elapsed_ms = args.perf.calcElapsed( args.perf.perf.total.start );
			}
			socket_info[key] = info;
		}
		
		var stats = this.stats.last;
		if (!stats.num_requests) stats.num_requests = 0;
		if (!stats.bytes_in) stats.bytes_in = 0;
		if (!stats.bytes_out) stats.bytes_out = 0;
		
		['total', 'read', 'process', 'write'].forEach( function(key) {
			if (!stats[key]) stats[key] = { "st": "mma", "min": 0, "max": 0, "total": 0, "count": 0 };
		} );
		
		for (var key in stats) {
			var stat = stats[key];
			if ((stat.st == "mma") && ("total" in stat) && ("count" in stat)) {
				stat.avg = stat.total / (stat.count || 1);
			}
		}
		
		return {
			server: {
				uptime_sec: Math.floor(now / 1000) - this.server.started,
				hostname: this.server.hostname,
				ip: this.server.ip,
				name: this.server.__name,
				version: this.server.__version
			},
			stats: stats,
			sockets: socket_info,
			recent: this.recent
		};
	},
	
	getAllClientIPs: function(request) {
		// create array of all IPs from the request, using the socket IP and X-Forwarded-For, if applicable
		var ips = [];
		if (request.headers['x-forwarded-for']) {
			ips = request.headers['x-forwarded-for'].split(/\,\s*/);
		}
		
		// add socket ip to end of array
		ips.push( request.socket.remoteAddress );
		
		return ips;
	},
	
	getPublicIP: function(ips) {
		// determine first public IP from list of IPs
		for (var idx = 0, len = ips.length; idx < len; idx++) {
			if (!ips[idx].match(this.regexPrivateIP)) return ips[idx];
		}
		
		// default to first ip
		return ips[0];
	},
	
	getSelfURL: function(request, uri) {
		// build self referencing URL given request object
		// and optional replacement URI
		if (!request.headers.host) return null;
		
		var ssl = !!request.headers.ssl;
		var url = ssl ? 'https://' : 'http://';
		url += request.headers.host.replace(/\:\d+$/, '');
		
		if (ssl && this.config.get('https_port') && (this.config.get('https_port') != 443)) {
			url += ':' + this.config.get('https_port');
		}
		else if (!ssl && this.config.get('http_port') && (this.config.get('http_port') != 80)) {
			url += ':' + this.config.get('http_port');
		}
		
		url += (uri || '/');
		
		return url;
	},
	
	getNextId: function(prefix) {
		// get unique ID with prefix
		return '' + prefix + Math.floor(this.nextId++);
	},
	
	shutdown: function(callback) {
		// shutdown http server
		var self = this;
		
		if (this.http) {
			this.logDebug(2, "Shutting down HTTP server");
			
			for (var id in this.conns) {
				this.logDebug(9, "Closing HTTP connection: " + id);
				// this.conns[id].destroy();
				this.conns[id].end();
				this.conns[id].unref();
				this.numConns--;
			}
			
			this.http.close( function() { self.logDebug(3, "HTTP server has shut down."); } );
			
			if (this.https) {
				this.https.close( function() { self.logDebug(3, "HTTPS server has shut down."); } );
			}
			// delete this.http;
		}
		
		callback();
	}
	
});

function ucfirst(text) {
	// capitalize first character only, lower-case rest
	return text.substring(0, 1).toUpperCase() + text.substring(1, text.length).toLowerCase();
};
