// Unit tests for pixl-server-web
// Copyright (c) 2017 Joseph Huckaby
// Released under the MIT License

var os = require('os');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var Class = require("pixl-class");
var PixlServer = require('pixl-server');

var PixlRequest = require('pixl-request');
var request = new PixlRequest();

var http = require('http');
var agent = new http.Agent({ keepAlive: true });

// allow SSL to work with snakeoil cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

process.chdir( __dirname );

var server = new PixlServer({
	
	__name: 'WebServerTest',
	__version: "1.0",
	
	config: {
		"log_dir": __dirname,
		"log_filename": "test.log",
		"debug_level": 9,
		"debug": 1,
		"echo": 0,
		
		"WebServer": {
			"http_port": 3020,
			"http_htdocs_dir": __dirname,
			"http_max_upload_size": 1024 * 10,
			"http_static_ttl": 3600,
			"http_static_index": "index.html",
			"http_server_signature": "WebServerTest 1.0",
			"http_gzip_text": 1,
			"http_timeout": 5,
			"http_response_headers": {
				"Via": "WebServerTest 1.0"
			},
			
			"http_log_requests": false,
			"http_regex_log": ".+",
			"http_recent_requests": 10,
			"http_max_connections": 10,
			
			"https": 1,
			"https_port": 3021,
			"https_cert_file": "ssl.crt",
			"https_key_file": "ssl.key",
			"https_force": 0,
			"https_timeout": 5,
			"https_header_detect": {
				"Front-End-Https": "^on$",
				"X-Url-Scheme": "^https$",
				"X-Forwarded-Protocol": "^https$",
				"X-Forwarded-Proto": "^https$",
				"X-Forwarded-Ssl": "^on$"
			}
		}
	},
	
	components: [
		require('pixl-server-web')
	]
	
});

// Unit Tests

module.exports = {
	setUp: function (callback) {
		var self = this;
		this.server = server;
		
		// delete old unit test log
		fs.unlink( "test.log", function(err) {
			// startup mock server
			server.startup( function() {
				// startup complete
				var web_server = self.web_server = server.WebServer;
				
				// write log in sync mode, for troubleshooting
				server.logger.set('sync', true);
				
				web_server.addURIHandler( '/json', 'JSON Test', function(args, callback) {
					// send custom JSON response
					callback( {
						code: 0,
						description: "Success",
						user: { Name: "Joe", Email: "foo@bar.com" },
						params: args.params,
						query: args.query,
						cookies: args.cookies,
						files: args.files,
						headers: args.request.headers,
						socket_id: args.request.socket._pixl_data.id || 0
					} );
				} );
				
				web_server.addURIHandler( '/sleep', 'Sleep Test', function(args, callback) {
					// send custom JSON response
					var ms = parseInt( args.query.ms );
					
					setTimeout( function() {
						if (args.query.error) {
							callback( 
								"500 Internal Server Error", 
								{ 'X-Sleep': 1 },
								null
							);
						}
						else {
							callback( {
								code: 0,
								description: "Slept for " + ms + "ms",
								ms: ms
							} );
						}
					}, ms );
				} );
				
				web_server.addURIHandler( '/redirect', 'Redirect Test', function(args, callback) {
					// send custom redirect response
					callback( 
						"302 Found", 
						{ 'Location': web_server.getSelfURL(args.request, "/json?redirected=1") },
						null
					);
				} );
				
				web_server.addURIHandler( '/server-status', "Server Status", true, function(args, callback) {
					// send web stats (JSON), ACL protected endpoint
					callback( server.WebServer.getStats() );
				} );
				
				// test suite ready
				callback();
				
			} ); // startup
		} ); // delete
	},
	
	tests: [
		
		function testSimpleRequest(test) {
			// test simple HTTP GET request to webserver backend
			request.json( 'http://127.0.0.1:3020/json', false,
				{
					headers: {
						'X-Test': "Test"
					}
				},
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.user, "Found user object in JSON response" );
					test.ok( json.user.Name == "Joe", "Correct user name in JSON response: " + json.user.Name );
					
					// request headers will be echoed back
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					
					test.done();
				} 
			);
		},
		
		// query string
		function testQueryString(test) {
			// test simple HTTP GET request with query string
			request.json( 'http://127.0.0.1:3020/json?foo=bar1234&baz=bop%20pog', false,
				{
					headers: {
						'X-Test': "Test"
					}
				},
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.user, "Found user object in JSON response" );
					test.ok( json.user.Name == "Joe", "Correct user name in JSON response: " + json.user.Name );
					
					test.ok( !!json.query, "Found query object in JSON response" );
					test.ok( json.query.foo == "bar1234", "Query contains correct foo key" );
					test.ok( json.query.baz == "bop pog", "Query contains correct baz key (URL encoding)" );
					
					// request headers will be echoed back
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					
					test.done();
				} 
			);
		},
		
		// Cookies in request
		function testCookieRequest(test) {
			// test simple HTTP GET request with cookies
			request.json( 'http://127.0.0.1:3020/json', false,
				{
					headers: {
						'Cookie': "COOKIE1=foo1234; COOKIE2=bar5678;",
						'X-Test': "Test"
					}
				},
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.user, "Found user object in JSON response" );
					test.ok( json.user.Name == "Joe", "Correct user name in JSON response: " + json.user.Name );
					
					test.ok( !!json.cookies, "Found cookies in JSON response" );
					test.ok( json.cookies.COOKIE1 == "foo1234", "Correct COOKIE1 value" );
					test.ok( json.cookies.COOKIE2 == "bar5678", "Correct COOKIE2 value" );
					
					// request headers will be echoed back
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					
					test.done();
				} 
			);
		},
		
		// HTTP POST (Standard)
		function testStandardPost(test) {
			request.post( 'http://127.0.0.1:3020/json',
				{
					headers: {
						'X-Test': "Test"
					},
					data: {
						myparam: "foobar4567"
					}
				},
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					
					// parse json in response
					var json = null;
					try { json = JSON.parse( data.toString() ); }
					catch (err) {
						test.ok( false, "Error parsing JSON: " + err );
						test.done();
					}
					
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.params, "Found params object in JSON response" );
					test.ok( json.params.myparam == "foobar4567", "Correct param in JSON response: " + json.params.myparam );
					
					// request headers will be echoed back
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					
					test.done();
				} 
			);
		},
		
		// HTTP POST + File Upload
		function testMultipartPost(test) {
			request.post( 'http://127.0.0.1:3020/json',
				{
					headers: {
						'X-Test': "Test"
					},
					multipart: true,
					data: {
						myparam: "foobar5678"
					},
					files: {
						file1: "spacer.gif"
					}
				},
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					
					// parse json in response
					var json = null;
					try { json = JSON.parse( data.toString() ); }
					catch (err) {
						test.ok( false, "Error parsing JSON: " + err );
						test.done();
					}
					
					// test.debug( "JSON Response: ", json );
					
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.params, "Found params object in JSON response" );
					test.ok( json.params.myparam == "foobar5678", "Correct param in JSON response: " + json.params.myparam );
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					test.ok( !!json.files, "Found files object in JSON response" );
					test.ok( !!json.files.file1, "Found file1 object in JSON response" );
					test.ok( json.files.file1.size == 43, "Uploaded file has correct size (43): " + json.files.file1.size );
					test.done();
				} 
			);
		},
		
		// JSON POST
		function testJSONPOST(test) {
			// test JSON HTTP POST request to webserver backend
			request.json( 'http://127.0.0.1:3020/json', { foo: 'barpost' },
				{
					headers: {
						'X-Test': "Test"
					}
				},
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					test.debug( "JSON Response", json );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					
					test.ok( !!json.params, "Found params object in JSON response" );
					test.ok( json.params.foo == "barpost", "Correct param in JSON response: " + json.params.foo );
					
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					
					test.done();
				} 
			);
		},
		
		// Error (404)
		function testFileNotFound(test) {
			request.get( 'http://127.0.0.1:3020/noexist',
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 404, "Got 404 response: " + resp.statusCode );
					test.done();
				} 
			);
		},
		
		// Error (Front-end Timeout)
		function testFrontEndTimeout(test) {
			request.get( 'http://127.0.0.1:3020/sleep?ms=750',
				{
					timeout: 500
				},
				function(err, resp, data, perf) {
					test.ok( !!err, "Got error from PixlRequest" );
					test.ok( err.toString().match(/timeout|timed out/i), "Correct error message: " + err );
					test.done();
				} 
			);
		},
		
		// static file get
		// check ttl, check gzip
		function testStaticTextRequest(test) {
			// test simple HTTP GET to webserver backend
			request.get( 'http://127.0.0.1:3020/index.html',
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					
					test.ok( !!resp.headers['content-type'], "Content-Type header present" );
					test.ok( !!resp.headers['content-type'].match(/text\/html/), "Content-Type header contains correct value" );
					
					test.ok( !!resp.headers['cache-control'], "Cache-Control header present" );
					test.ok( !!resp.headers['cache-control'].match(/max\-age\=3600/), "Cache-Control header contains correct TTL" );
					
					test.ok( !!resp.headers['content-encoding'], "Content-Encoding header present" );
					test.ok( !!resp.headers['content-encoding'].match(/gzip/), "Content-Encoding header contains gzip" );
					
					test.ok( !!data, "Got HTML in response" );
					test.ok( data.toString() === fs.readFileSync('index.html', 'utf8'), "index.html content is correct" );
					
					test.done();
				} 
			);
		},
		
		// binary get
		// should NOT be gzip encoded
		function testStaticBinaryRequest(test) {
			// test simple HTTP GET to webserver backend
			request.get( 'http://127.0.0.1:3020/spacer.gif',
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					
					test.ok( !!resp.headers['content-type'], "Content-Type header present" );
					test.ok( !!resp.headers['content-type'].match(/image\/gif/), "Content-Type header contains correct value" );
					
					test.ok( !!resp.headers['cache-control'], "Cache-Control header present" );
					test.ok( !!resp.headers['cache-control'].match(/max\-age\=3600/), "Cache-Control header contains correct TTL" );
					
					test.ok( !resp.headers['content-encoding'], "Content-Encoding header should NOT be present!" );
					
					test.ok( !!data, "Got data in response" );
					
					test.done();
				} 
			);
		},
		
		// http_max_connections
		function testMaxConnections(test) {
			// test going over max concurrent connections (10)
			// this test is very perf and timing sensitive, may fail on overloaded or underpowered servers
			// we need ALL sockets to be closed for this, hence the initial delay
			setTimeout( function() {
				// open 10 concurrent
				for (var idx = 0; idx < 10; idx++) {
					request.get( 'http://127.0.0.1:3020/sleep?ms=500',
						function(err, resp, data, perf) {
							// ignore
						} 
					);
				} // loop
				
				// sleep for 250ms, then test
				setTimeout( function() {
					// now, all 10 requests should be in progress, so 11th should fail
					request.get( 'http://127.0.0.1:3020/json',
						function(err, resp, data, perf) {
							test.ok( !!err, "Expected error from PixlRequest" );
							setTimeout( function() { test.done(); }, 500 ); // wait for all 10 to complete
						} 
					);
				}, 250 );
			}, 500 );
		},
		
		// post size too large
		function testLargeMultipartPost(test) {
			request.post( 'http://127.0.0.1:3020/json',
				{
					multipart: true,
					data: {
						myparam: crypto.randomBytes( (1024 * 10) + 1 )
					}
				},
				function(err, resp, data, perf) {
					// multi-part relies on 'formidable' to throw an error, so it is a HTTP 400
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 400, "Got 400 response: " + resp.statusCode );
					test.done();
				} 
			);
		},
		function testLargeRawPost(test) {
			request.post( 'http://127.0.0.1:3020/json',
				{
					headers: {
						'Content-Type': "application/octet-stream"
					},
					data: crypto.randomBytes( (1024 * 10) + 1 )
				},
				function(err, resp, data, perf) {
					// pure post generates a socket-closing super error
					test.ok( !!err, "Expected error from PixlRequest" );
					test.done();
				} 
			);
		},
		
		// keep-alives
		function testKeepAlives(test) {
			// test keep-alive sockets
			var sendReqGetSocketID = function(ka, callback) {
				request.json( 'http://127.0.0.1:3020/json', false, { agent: ka ? agent : null },
					function(err, resp, json, perf) {
						if (err && !json && !json.socket_id) return callback(false);
						callback( json.socket_id );
					} 
				); // request.json
			}; // sendReqGetSocketID
			
			sendReqGetSocketID( false, function(socket1) {
				test.ok( !!socket1, "Got Socket ID 1 (close)" );
				
				sendReqGetSocketID( false, function(socket2) {
					test.ok( !!socket2, "Got Socket ID 2 (close)" );
					
					test.ok( socket1 != socket2, "Socket IDs differ with close" );
					
					// now try it again with KA
					sendReqGetSocketID( true, function(socket3) {
						test.ok( !!socket3, "Got Socket ID 3 (KA)" );
						
						sendReqGetSocketID( true, function(socket4) {
							test.ok( !!socket4, "Got Socket ID 4 (KA)" );
							
							test.ok( socket3 == socket4, "Socket IDs same with KA" );
							test.done();
							
						} ); // req 4
					} ); // req 3
				} ); // req 2
			} ); // req 1
		},
		
		// redirect
		function testRedirect(test) {
			request.get( 'http://127.0.0.1:3020/redirect',
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 302, "Got 302 response: " + resp.statusCode );
					test.ok( !!resp.headers['location'], "Got Location header" );
					test.ok( !!resp.headers['location'].match(/redirected/), "Correct Location header");
					test.done();
				} 
			);
		},
		
		// acl block
		function testACL(test) {
			request.get( 'http://127.0.0.1:3020/server-status', // ACL'ed endpoint
				{
					headers: {
						"X-Forwarded-For": "1.2.3.4" // external IP
					}
				},
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 403, "Got 403 response: " + resp.statusCode );
					test.done();
				} 
			);
		},
		
		// get stats
		function testStats(test) {
			// test stats API (this also tests ACL pass)
			request.json( 'http://127.0.0.1:3020/server-status', false,
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					
					// test.debug("Web Server Stats", json);
					test.ok( !!json.server, "server obj in stats" );
					test.ok( json.server.name == "WebServerTest", "Correct server name in stats" );
					test.ok( !!json.stats, "stats present" );
					test.ok( !!json.stats.total, "total in stats" );
					test.ok( !!json.sockets, "sockets in stats" );
					test.ok( Object.keys(json.sockets).length == 2, "Exactly 2 active sockets" );
					test.ok( !!json.recent, "recent in stats" );
					test.ok( json.recent.length > 0, "recent has length" );
					
					test.done();
				} 
			);
		},
		
		// https
		function testHTTPSRequest(test) {
			// test HTTPS GET request to webserver backend
			request.json( 'https://127.0.0.1:3021/json', false,
				{
					headers: {
						'X-Test': "Test"
					}
				},
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.user, "Found user object in JSON response" );
					test.ok( json.user.Name == "Joe", "Correct user name in JSON response: " + json.user.Name );
					
					// request headers will be echoed back
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					test.ok( !!json.headers.ssl, "SSL pseudo-header present in echo" );
					
					test.done();
				} 
			);
		},
		
		function testHTTPSPost(test) {
			request.post( 'https://127.0.0.1:3021/json',
				{
					headers: {
						'X-Test': "Test"
					},
					data: {
						myparam: "foobar4567"
					}
				},
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					
					// parse json in response
					var json = null;
					try { json = JSON.parse( data.toString() ); }
					catch (err) {
						test.ok( false, "Error parsing JSON: " + err );
						test.done();
					}
					
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.params, "Found params object in JSON response" );
					test.ok( json.params.myparam == "foobar4567", "Correct param in JSON response: " + json.params.myparam );
					
					// request headers will be echoed back
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					test.ok( !!json.headers.ssl, "SSL pseudo-header present in echo" );
					
					test.done();
				} 
			);
		},
		
		// HTTPS POST + File Upload
		function testHTTPSMultipartPost(test) {
			request.post( 'https://127.0.0.1:3021/json',
				{
					headers: {
						'X-Test': "Test"
					},
					multipart: true,
					data: {
						myparam: "foobar5678"
					},
					files: {
						file1: "spacer.gif"
					}
				},
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					
					// parse json in response
					var json = null;
					try { json = JSON.parse( data.toString() ); }
					catch (err) {
						test.ok( false, "Error parsing JSON: " + err );
						test.done();
					}
					
					// test.debug( "JSON Response: ", json );
					
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.params, "Found params object in JSON response" );
					test.ok( json.params.myparam == "foobar5678", "Correct param in JSON response: " + json.params.myparam );
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					test.ok( !!json.headers.ssl, "SSL pseudo-header present in echo" );
					test.ok( !!json.files, "Found files object in JSON response" );
					test.ok( !!json.files.file1, "Found file1 object in JSON response" );
					test.ok( json.files.file1.size == 43, "Uploaded file has correct size (43): " + json.files.file1.size );
					test.done();
				} 
			);
		},
		
		// SSL JSON POST
		function testHTTPSJSONPOST(test) {
			// test JSON HTTPS POST request to webserver backend
			request.json( 'https://127.0.0.1:3021/json', { foo: 'barpost' },
				{
					headers: {
						'X-Test': "Test"
					}
				},
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					test.debug( "JSON Response", json );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					
					test.ok( !!json.params, "Found params object in JSON response" );
					test.ok( json.params.foo == "barpost", "Correct param in JSON response: " + json.params.foo );
					
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					test.ok( !!json.headers.ssl, "SSL pseudo-header present in echo" );
					
					test.done();
				} 
			);
		},
		
		// https_header_detect
		function testHTTPSHeaderDetect(test) {
			// test HTTP GET request to webserver backend, simulating an external SSL proxy (LB, etc.)
			request.json( 'http://127.0.0.1:3020/json', false,
				{
					headers: {
						'X-Forwarded-Proto': "https",
						'X-Test': "Test"
					}
				},
				function(err, resp, json, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
					test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
					test.ok( !!json, "Got JSON in response" );
					test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
					test.ok( !!json.user, "Found user object in JSON response" );
					test.ok( json.user.Name == "Joe", "Correct user name in JSON response: " + json.user.Name );
					
					// request headers will be echoed back
					test.ok( !!json.headers, "Found headers echoed in JSON response" );
					test.ok( json.headers['x-test'] == "Test", "Found Test header echoed in JSON response" );
					
					// even though this wasn't an SSL request, we simulated one, which should have triggered https_header_detect
					test.ok( !!json.headers.ssl, "SSL pseudo-header present in echo" );
					
					test.done();
				} 
			);
		},
		
		// filters
		function testFilterPassthrough(test) {
			// setup filter for passthrough
			var self = this;
			
			this.web_server.addURIFilter( /^\/json/, "Test Filter", function(args, callback) {
				// add a nugget into request query
				args.query.filter_nugget = 42;
				
				// add a custom response header too
				args.response.setHeader('X-Filtered', "4242");
				
				callback(false); // passthru
			} );
			
			request.json( 'http://127.0.0.1:3020/json', false, function(err, resp, json, perf) {
				test.ok( !err, "No error from PixlRequest: " + err );
				test.ok( !!resp, "Got resp from PixlRequest" );
				test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
				test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
				test.ok( !!json, "Got JSON in response" );
				test.ok( json.code == 0, "Correct code in JSON response: " + json.code );
				
				// did our query nugget make it all the way through?
				test.ok( json.query.filter_nugget == "42", "Found filter nugget infused into query" );
				
				// and our response header nugget too?
				test.ok( resp.headers['x-filtered'] == "4242", "Correct X-Filtered header: " + resp.headers['x-filtered'] );
				
				// remove filter
				self.web_server.removeURIFilter('Test Filter');
				
				test.done();
			} );
		},
		
		function testFilterIntercept(test) {
			// setup filter for intercepting request and sending custom response
			var self = this;
			
			this.web_server.addURIFilter( /.+/, "Test Filter 418", function(args, callback) {
				// send our own custom response
				callback(
					"418 I'm a teapot", 
					{ 'X-Filtered': 42 },
					null
				);
			} );
			
			request.get( 'http://127.0.0.1:3020/index.html',
				function(err, resp, data, perf) {
					test.ok( !err, "No error from PixlRequest: " + err );
					test.ok( !!resp, "Got resp from PixlRequest" );
					test.ok( resp.statusCode == 418, "Got 418 response: " + resp.statusCode );
					test.ok( resp.headers['x-filtered'] == 42, "Correct X-Filtered header: " + resp.headers['x-filtered'] );
					
					// remove filter
					self.web_server.removeURIFilter('Test Filter 418');
					
					// make sure things are back to good
					request.get( 'http://127.0.0.1:3020/index.html',
						function(err, resp, data, perf) {
							test.ok( !err, "No error from PixlRequest: " + err );
							test.ok( !!resp, "Got resp from PixlRequest" );
							test.ok( resp.statusCode == 200, "Got 200 response: " + resp.statusCode );
							test.ok( resp.headers['via'] == "WebServerTest 1.0", "Correct Via header: " + resp.headers['via'] );
							test.done();
						}
					); // request.get #2
				}
			); // request.get #1
		}
		
	], // tests
	
	tearDown: function (callback) {
		// clean up
		var self = this;
		
		this.server.shutdown( function() {
			callback();
		} );
	}
	
};
