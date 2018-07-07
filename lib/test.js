// Unit tests for Cronicle (run using `npm test`)
// Copyright (c) 2016 - 2017 Joseph Huckaby
// Released under the MIT License

var cp = require('child_process');
var fs = require('fs');
var async = require('async');
var glob = require('glob');
var moment = require('moment-timezone');

var Tools = require('pixl-tools');
var PixlServer = require("pixl-server");

// we need a few config files
var config = require('../sample_conf/config.json');
var setup = require('../sample_conf/setup.json');

// override things for the unit tests
config.debug = true;
config.echo = false;
config.color = false;
config.master = false;

config.WebServer.http_port = 4012;
config.base_app_url = "http://localhost:4012";
config.udp_broadcast_port = 4014;

config.email_from = "test@localhost";
config.smtp_hostname = "localhost";
config.secret_key = "UNIT_TEST";
config.log_filename = "unit.log";
config.pid_file = "logs/unit.pid";
config.debug_level = 10;
config.scheduler_startup_grace = 0;
config.job_startup_grace = 1;
config.Storage.Filesystem.base_dir = "data/unittest";
config.web_hook_config_keys = ["base_app_url", "something_custom"];
config.something_custom = "nonstandard property";
config.track_manual_jobs = true;

// chdir to the proper server root dir
process.chdir( require('path').dirname( __dirname ) );

// global refs
var server = null;
var storage = null;
var cronicle = null;
var request = null;
var api_url = '';
var session_id = '';

module.exports = {
	logDebug: function(level, msg, data) {
		// proxy request to system logger with correct component
		if (cronicle && cronicle.logger) {
			cronicle.logger.set( 'component', 'UnitTest' );
			cronicle.logger.debug( level, msg, data );
		}
	},
	
	setUp: function (callback) {
		// always called before tests start
		var self = this;
		
		// make sure another unit test isn't running
		var pid = false;
		try { pid = fs.readFileSync('logs/unit.pid', { encoding: 'utf8' }); }
		catch (e) {;}
		if (pid) {
			var alive = true;
			try { process.kill(parseInt(pid), 0); }
			catch (e) { alive = false; }
			if (alive) {
				console.warn("Another unit test is already running (PID " + pid + "). Exiting.");
				process.exit(1);
			}
		}
		
		// clean out data from last time
		try { cp.execSync('rm -rf logs/unit.pid data/unittest'); }
		catch (e) {;}
		
		// construct server object
		server = new PixlServer({
			
			__name: 'Cronicle',
			__version: require('../package.json').version,
			
			config: config,
			
			components: [
				require('pixl-server-storage'),
				require('pixl-server-web'),
				require('pixl-server-api'),
				require('pixl-server-user'),
				require('./engine.js')
			]
			
		});

		server.startup( function() {
			// server startup complete
			storage = server.Storage;
			cronicle = server.Cronicle;
			
			// prepare to make api calls
			request = cronicle.request;
			api_url = server.config.get('base_app_url') + server.API.config.get('base_uri');
			
			// cancel auto ticks, so we can send our own later
			clearTimeout( server.tickTimer );
			delete server.tickTimer;
			
			// bootstrap storage with initial records
			async.eachSeries( setup.storage,
				function(params, callback) {
					var func = params.shift();
					params.push( callback );
					
					// massage a few params
					if (typeof(params[1]) == 'object') {
						var obj = params[1];
						if (obj.created) obj.created = Tools.timeNow(true);
						if (obj.modified) obj.modified = Tools.timeNow(true);
						if (obj.regexp && (obj.regexp == '_HOSTNAME_')) obj.regexp = '^(' + Tools.escapeRegExp( server.hostname ) + ')$';
						if (obj.hostname && (obj.hostname == '_HOSTNAME_')) obj.hostname = server.hostname;
						if (obj.ip && (obj.ip == '_IP_')) obj.ip = server.ip;
					}
					
					// call storage directly
					storage[func].apply( storage, params );
				},
				function(err) {
					if (err) throw err;
					
					// begin unit tests
					callback();
				}
			); // async.eachSeries
		} ); // server.startup
	}, // setUp
	
	beforeEach: function(test) {
		// called just before each test
		this.logDebug(10, "Starting unit test: " + test.name );
	},
	
	afterEach: function(test) {
		// called after each test completes
		this.logDebug(10, "Unit test complete: " + test.name );
	},
	
	//
	// Tests Array:
	//
	
	tests: [
		
		function testServerStarted(test) {
			test.ok( server.started > 0, 'Cronicle started up successfully');
			test.done();
		},
		
		function testStorage(test) {
			storage.get( 'users/admin', function(err, user) {
				test.ok( !err, "No error fetching admin user" );
				test.ok( !!user, "User record is non-null" );
				test.ok( user.username == "admin", "Username is correct" );
				test.ok( user.created > 0, "User creation date is non-zero" );
				
				test.done();
			} );
		},
		
		function testcheckMasterEligibility(test) {
			cronicle.checkMasterEligibility( function() {
				test.ok( cronicle.multi.cluster == true, "Server found in cluster" );
				test.ok( cronicle.multi.eligible == true, "Server is eligible for master" );
				test.ok( cronicle.multi.master == false, "Server is not yet master" );
				test.ok( cronicle.multi.slave == false, "Server is not a slave" );
				
				test.done();
			} );
		},
		
		function testGoMaster(test) {
			cronicle.goMaster();
			
			test.ok( cronicle.multi.master == true, "Server became master" );
			test.ok( cronicle.multi.slave == false, "Server is not a slave" );
			test.ok( cronicle.multi.cluster == true, "Server is still found in cluster" );
			test.ok( cronicle.multi.masterHostname == server.hostname, "Server masterHostname is self" );
			test.ok( !!cronicle.multi.lastPingSent, "Server lastPingSent is non-zero" );
			test.ok( !!cronicle.tz, "Server has a timezone set" );
			
			// need a rest here, so async sub-components can start up
			setTimeout( function() { test.done(); }, 500 );
		},
		
		function testAPIPing(test) {
			// make basic REST API call, check response
			request.json( api_url + '/app/ping', {}, function(err, resp, data) {
				
				test.ok( !err, "No error requesting ping API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from ping API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				test.done();
			} );
		},
		
		function testAPILoginBadUsername(test) {
			// login with unknown username
			var params = { 
				username: "nobody", 
				password: "foo" 
			};
			request.json( api_url + '/user/login', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting user/login API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from user/login API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code != 0, "Code is non-zero (we expect an error)" );
				test.ok( !data.session_id, "No session_id in response" );
				
				test.done();
			} );
		},
		
		function testAPILoginBadPassword(test) {
			// login with good user but bad password
			var params = { 
				username: "admin", 
				password: "adminnnnnnn" 
			};
			request.json( api_url + '/user/login', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting user/login API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from user/login API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code != 0, "Code is non-zero (we expect an error)" );
				test.ok( !data.session_id, "No session_id in response" );
				
				test.done();
			} );
		},
		
		function testAPIUserLogin(test) {
			// login as admin (successfully), save session id for downstream tests
			var params = { 
				username: "admin", 
				password: "admin" 
			};
			request.json( api_url + '/user/login', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting user/login API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from user/login API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.session_id, "Found session_id in response" );
				
				// save session_id for later
				session_id = data.session_id;
				
				test.done();
			} );
		},
		
		function testAPIConfig(test) {
			// test app/config api
			var params = {};
			request.json( api_url + '/app/config', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.config, "Found config in response data" );
				
				test.done();
			} );
		},
		
		// app/create_plugin
		
		function testAPICreatePlugin(test) {
			// test app/create_plugin api
			var self = this;
			var params = {"params":[{"type":"textarea","id":"script","title":"Script Source","rows":10,"value":"#!/bin/sh\n\n# Enter your shell script code here"}],"title":"Copy of Shell Script","command":"bin/shell-plugin.js","enabled":1,"session_id":session_id};
			
			request.json( api_url + '/app/create_plugin', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.id, "Found new id in data" );
				
				// save plugin id for later
				self.plugin_id = data.id;
				
				// check to see that plugin actually got saved to storage
				storage.listFind( 'global/plugins', { id: data.id }, function(err, plugin) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!plugin, "Data record record is non-null" );
					test.ok( plugin.username == "admin", "Username is correct" );
					test.ok( plugin.created > 0, "Record creation date is non-zero" );
					
					test.done();
				} );
			} );
		},
		
		// app/update_plugin
		
		function testAPIUpdatePlugin(test) {
			// test app/update_plugin api
			var self = this;
			var params = {"id":this.plugin_id, "title":"Updated Plugin Title","session_id":session_id};
			
			request.json( api_url + '/app/update_plugin', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that plugin actually got saved to storage
				storage.listFind( 'global/plugins', { id: self.plugin_id }, function(err, plugin) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!plugin, "Data record is non-null" );
					test.ok( plugin.username == "admin", "Username is correct" );
					test.ok( plugin.created > 0, "Record creation date is non-zero" );
					test.ok( plugin.title == "Updated Plugin Title", "Title was updated correctly" );
					
					test.done();
				} );
			} );
		},
		
		// app/delete_plugin
		
		function testAPIDeletePlugin(test) {
			// test app/delete_plugin api
			var self = this;
			var params = {"id":this.plugin_id, "session_id":session_id};
			
			request.json( api_url + '/app/delete_plugin', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that plugin actually got deleted from storage
				storage.listFind( 'global/plugins', { id: self.plugin_id }, function(err, plugin) {
					test.ok( !err, "No error expected for missing data" );
					test.ok( !plugin, "Data record should be null (deleted)" );
					
					delete self.plugin_id;
					
					test.done();
				} );
			} );
		},
		
		// app/create_category
		
		function testAPICreateCategory(test) {
			// test app/create_category api
			var self = this;
			var params = {"title":"test will del cat","description":"yo","max_children":0,"enabled":1,"notify_success":"","notify_fail":"","web_hook":"","cpu_limit":0,"cpu_sustain":0,"memory_limit":0,"memory_sustain":0,"log_max_size":0,"session_id":session_id};
			
			request.json( api_url + '/app/create_category', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.id, "Found new id in data" );
				
				// save cat id for later
				self.cat_id = data.id;
				
				// check to see that cat actually got saved to storage
				storage.listFind( 'global/categories', { id: data.id }, function(err, cat) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!cat, "Data record record is non-null" );
					test.ok( cat.username == "admin", "Username is correct" );
					test.ok( cat.created > 0, "Record creation date is non-zero" );
					
					test.done();
				} );
			} );
		},
		
		// app/update_category
		
		function testAPIUpdateCategory(test) {
			// test app/update_category api
			var self = this;
			var params = {"id":this.cat_id, "title":"Updated Category Title","session_id":session_id};
			
			request.json( api_url + '/app/update_category', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that cat actually got saved to storage
				storage.listFind( 'global/categories', { id: self.cat_id }, function(err, cat) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!cat, "Data record is non-null" );
					test.ok( cat.username == "admin", "Username is correct" );
					test.ok( cat.created > 0, "Record creation date is non-zero" );
					test.ok( cat.title == "Updated Category Title", "Title was updated correctly" );
					
					test.done();
				} );
			} );
		},
		
		// app/delete_category
		
		function testAPIDeleteCategory(test) {
			// test app/delete_category api
			var self = this;
			var params = {"id":this.cat_id, "session_id":session_id};
			
			request.json( api_url + '/app/delete_category', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that cat actually got deleted from storage
				storage.listFind( 'global/categories', { id: self.cat_id }, function(err, cat) {
					test.ok( !err, "No error expected for missing data" );
					test.ok( !cat, "Data record should be null (deleted)" );
					
					delete self.cat_id;
					
					test.done();
				} );
			} );
		},
		
		// app/create_server_group
		
		function testAPICreateServerGroup(test) {
			// test app/create_server_group api
			var self = this;
			var params = {"title":"del gap","regexp":"dasds","master":0,"session_id":session_id};
			
			request.json( api_url + '/app/create_server_group', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.id, "Found new id in data" );
				
				// save group id for later
				self.group_id = data.id;
				
				// check to see that group actually got saved to storage
				storage.listFind( 'global/server_groups', { id: data.id }, function(err, group) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!group, "Data record record is non-null" );
					test.ok( group.title == "del gap", "Title is correct" );
					test.ok( group.regexp == "dasds", "Regexp is correct" );
					
					test.done();
				} );
			} );
		},
		
		// app/update_server_group
		
		function testAPIUpdateServerGroup(test) {
			// test app/update_server_group api
			var self = this;
			var params = {"id":this.group_id, "title":"Updated Group Title","session_id":session_id};
			
			request.json( api_url + '/app/update_server_group', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that group actually got saved to storage
				storage.listFind( 'global/server_groups', { id: self.group_id }, function(err, group) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!group, "Data record is non-null" );
					test.ok( group.title == "Updated Group Title", "Title was updated correctly" );
					
					test.done();
				} );
			} );
		},
		
		// app/delete_server_group
		
		function testAPIDeleteServerGroup(test) {
			// test app/delete_server_group api
			var self = this;
			var params = {"id":this.group_id, "session_id":session_id};
			
			request.json( api_url + '/app/delete_server_group', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that group actually got deleted from storage
				storage.listFind( 'global/server_groups', { id: self.group_id }, function(err, group) {
					test.ok( !err, "No error expected for missing data" );
					test.ok( !group, "Data record should be null (deleted)" );
					
					delete self.group_id;
					
					test.done();
				} );
			} );
		},
		
		// app/create_api_key
		
		function testAPICreateAPIKey(test) {
			// test app/create_api_key api
			var self = this;
			var params = {"key":"35b60c12892dd4503cf3a8dbf22d3354","privileges":{"admin":0,"create_events":0,"edit_events":0,"delete_events":1,"run_events":0,"abort_events":0,"state_update":0},"active":"1","title":"test will delete","description":"dshfdwsfs","session_id":session_id};
			
			request.json( api_url + '/app/create_api_key', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.id, "Found new id in data" );
				test.ok( !!data.key, "Found new api key in data" );
				
				// save api key id for later
				self.apikey_id = data.id;
				self.apikey_key = data.key;
				
				// check to see that api key actually got saved to storage
				storage.listFind( 'global/api_keys', { id: data.id }, function(err, api_key) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!api_key, "Data record is non-null" );
					test.ok( api_key.username == "admin", "Username is correct" );
					test.ok( api_key.created > 0, "Record creation date is non-zero" );
					test.ok( !!api_key.key, "API Key record has key" );
					test.ok( api_key.key == "35b60c12892dd4503cf3a8dbf22d3354", "API Key is correct" );
					
					test.done();
				} );
			} );
		},
		
		function testAPIKeyUsage(test) {
			// try to hit an API using the API Key as auth (not a user session id)
			var self = this;
			var params = { "api_key": this.apikey_key, offset: 0, limit: 100 };
			
			request.json( api_url + '/app/get_schedule', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				test.done();
			} );
		},
		
		function testAPIKeyUnauthorized(test) {
			// try to access an API that is unauthorized for an API Key
			// an error is expected here
			var self = this;
			var params = {"title":"this should fail","description":"yo key","max_children":0,"enabled":1,"notify_success":"","notify_fail":"","web_hook":"","cpu_limit":0,"cpu_sustain":0,"memory_limit":0,"memory_sustain":0,"api_key":this.apikey_key};
			
			request.json( api_url + '/app/create_category', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API", err );
				test.ok( resp.statusCode == 200, "HTTP 200 from API", resp.statusCode );
				test.ok( "code" in data, "Found code prop in JSON response", data );
				test.ok( data.code != 0, "Code is non-zero (error is expected)", data );
				
				test.done();
			} );
		},
		
		// app/update_api_key
		
		function testAPIUpdateAPIKey(test) {
			// test app/update_api_key api
			var self = this;
			var params = {"id":this.apikey_id, "title":"Updated API Key Title","session_id":session_id};
			
			request.json( api_url + '/app/update_api_key', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that api key actually got saved to storage
				storage.listFind( 'global/api_keys', { id: self.apikey_id }, function(err, api_key) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!api_key, "Data record is non-null" );
					test.ok( api_key.username == "admin", "Username is correct" );
					test.ok( api_key.created > 0, "Record creation date is non-zero" );
					test.ok( api_key.title == "Updated API Key Title", "Title was updated correctly" );
					
					test.done();
				} );
			} );
		},
		
		// app/get_api_keys
		
		function testAPIGetAPIKeys(test) {
			// test app/get_api_keys api
			var self = this;
			var params = { "session_id": session_id, offset: 0, limit: 100 };
			
			request.json( api_url + '/app/get_api_keys', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.rows, "Found rows in response" );
				test.ok( !!data.rows.length, "Rows has length" );
				
				var api_key = Tools.findObject( data.rows, { id: self.apikey_id } );
				test.ok( !!api_key, "Found our API Key in rows" );
				test.ok( api_key.id == self.apikey_id, "API Key ID matches our query" );
				test.ok( api_key.username == "admin", "Username is correct" );
				test.ok( api_key.created > 0, "Record creation date is non-zero" );
				test.ok( !!api_key.key, "API Key record has key" );
				
				test.done();
				
			} );
		},
		
		// app/get_api_key
		
		function testAPIGetAPIKey(test) {
			// test app/get_api_key api
			var self = this;
			var params = { "session_id": session_id, id: this.apikey_id };
			
			request.json( api_url + '/app/get_api_key', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				var api_key = data.api_key;
				test.ok( !!api_key, "Found our API Key in data" );
				test.ok( api_key.id == self.apikey_id, "API Key ID matches our query" );
				test.ok( api_key.username == "admin", "Username is correct" );
				test.ok( api_key.created > 0, "Record creation date is non-zero" );
				test.ok( !!api_key.key, "API Key record has key" );
				
				test.done();
				
			} );
		},
		
		// app/delete_api_key
		
		function testAPIDeleteAPIKey(test) {
			// test app/delete_api_key api
			var self = this;
			var params = {"id":this.apikey_id, "session_id":session_id};
			
			request.json( api_url + '/app/delete_api_key', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that api key actually got deleted from storage
				storage.listFind( 'global/api_keys', { id: self.apikey_id }, function(err, api_key) {
					test.ok( !err, "No error expected for missing data" );
					test.ok( !api_key, "Data record should be null (deleted)" );
					
					delete self.apikey_id;
					
					test.done();
				} );
			} );
		},
		
		// app/create_event
		
		function testAPICreateEvent(test) {
			// test app/create_event api
			var self = this;
			var params = {
				"enabled": 1,
				"params": {
					"duration": "10",
					"progress": 1,
					"action": "Success",
					"secret": "foo"
				},
				"timing": {
					"years": [2001], // we'll run it manually first
					"minutes": [0]
				},
				"max_children": 1,
				"timeout": 300,
				"catch_up": 0,
				"timezone": cronicle.tz,
				"plugin": "testplug",
				"title": "Well Test!",
				"category": "general",
				"target": "maingrp",
				"multiplex": 0,
				"retries": 0,
				"retry_delay": 0,
				"detached": 0,
				"notify_success": "",
				"notify_fail": "",
				"web_hook": "",
				"cpu_limit": 0,
				"cpu_sustain": 0,
				"memory_limit": 0,
				"memory_sustain": 0,
				"notes": "",
				"session_id": session_id
			};
			
			request.json( api_url + '/app/create_event', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.id, "Found new id in data" );
				
				// save event id for later
				self.event_id = data.id;
				
				// check to see that event actually got saved to storage
				storage.listFind( 'global/schedule', { id: data.id }, function(err, event) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!event, "Data record record is non-null" );
					test.ok( event.username == "admin", "Username is correct" );
					test.ok( event.created > 0, "Record creation date is non-zero" );
					
					test.done();
				} );
			} );
		},
		
		// app/update_event
		
		function testAPIUpdateEvent(test) {
			// test app/update_event api
			var self = this;
			var params = {
				"id": this.event_id,
				"title": "Updated Event Title",
				"session_id": session_id
			};
			
			request.json( api_url + '/app/update_event', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that event actually got saved to storage
				storage.listFind( 'global/schedule', { id: self.event_id }, function(err, event) {
					test.ok( !err, "No error fetching data" );
					test.ok( !!event, "Data record record is non-null" );
					test.ok( event.username == "admin", "Username is correct" );
					test.ok( event.created > 0, "Record creation date is non-zero" );
					test.ok( event.title == "Updated Event Title", "New title is correct" );
					
					test.done();
				} );
			} );
		},
		
		// app/get_schedule
		
		function testAPIGetSchedule(test) {
			// test app/get_schedule api
			var self = this;
			var params = { "session_id": session_id, offset: 0, limit: 100 };
			
			request.json( api_url + '/app/get_schedule', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.rows, "Found rows in response" );
				test.ok( !!data.rows.length, "Rows has length" );
				
				var event = Tools.findObject( data.rows, { id: self.event_id } );
				test.ok( !!event, "Found our event in rows" );
				test.ok( event.id == self.event_id, "Event ID matches our query" );
				test.ok( event.username == "admin", "Username is correct" );
				test.ok( event.created > 0, "Record creation date is non-zero" );
				
				test.done();
				
			} );
		},
		
		// app/get_event
		
		function testAPIGetEvent(test) {
			// test app/get_event api
			var self = this;
			var params = { "session_id": session_id, id: this.event_id };
			
			request.json( api_url + '/app/get_event', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				var event = data.event;
				test.ok( !!event, "Found our event in data" );
				test.ok( event.id == self.event_id, "Event ID matches our query" );
				test.ok( event.username == "admin", "Username is correct" );
				test.ok( event.created > 0, "Record creation date is non-zero" );
				
				test.done();
				
			} );
		},
		
		// app/run_event
		
		function testAPIRunEvent(test) {
			// test app/run_event api
			// run event manually, specify an override
			var self = this;
			var params = {
				"session_id": session_id, 
				id: this.event_id,
				notify_fail: 'test@test.com'
			};
			
			request.json( api_url + '/app/run_event', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.ids, "Found ids in response" );
				test.ok( data.ids.length == 1, "Data ids has length of 1" );
				test.ok( !!data.ids[0], "Found Job ID in response data" );
				
				var job_id = data.ids[0];
				self.job_id = job_id;
				
				// wait a few seconds here for job to start and get to around 50%
				setTimeout( function() {
					test.done();
				}, 1000 * 5 );
				
			} );
		},
		
		function testJobInProgress(test) {
			// make sure job is in progress
			var self = this;
			var all_jobs = cronicle.getAllActiveJobs();
			var job = all_jobs[ this.job_id ];
			
			test.ok( !!job, "Found our job in active list" );
			test.ok( job.event == this.event_id, "Job has correct Event ID" );
			test.ok( job.progress > 0, "Job has positive progress" );
			test.ok( job.notify_fail == "test@test.com", "Our notify_fail override made it in" );
			test.ok( !!job.pid, "Job has a PID" );
			
			// try to ping pid
			var ping = false;
			try { ping = process.kill( job.pid, 0 ); }
			catch (e) {;}
			test.ok( !!ping, "Job PID was successfully pinged" );
			
			// force cronicle to measure mem/cpu
			cronicle.monitorServerResources( function(err) {
				test.ok( !err, "No error calling monitorServerResources", err );
				test.done();
			} );
		},
		
		// app/get_live_job_log
		
		function testAPIGetLiveJobLog(test) {
			// test get_live_job_log API (raw HTTP get, not a JSON API)
			var self = this;
			
			request.get( api_url + '/app/get_live_job_log?id=' + this.job_id, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( !!data, "Got data buffer" );
				test.ok( data.length > 0, "Data buffer has length" );
				
				test.done();
				
			} );
		},
		
		// app/get_job_status
		
		function testAPIGetJobStatus(test) {
			// test app/get_job_status api
			var self = this;
			var params = {
				"session_id": session_id, 
				id: this.job_id
			};
			
			request.json( api_url + '/app/get_job_status', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				test.ok( !!data.job, "Found job in data" );
				
				var job = data.job;
				test.ok( job.id == self.job_id, "Job ID matches" );
				test.ok( job.progress > 0, "Job progress is still non-zero" );
				
				test.ok( !!job.cpu, "Job has CPU metrics" );
				test.ok( job.cpu.count > 0, "Job CPU count is non-zero" );
				// test.ok( job.cpu.current > 0, "Job CPU current is non-zero" );
				
				test.ok( !!job.mem, "Job has memory metrics" );
				test.ok( job.mem.count > 0, "Job memory count is non-zero" );
				// test.ok( job.mem.current > 0, "Job memory current is non-zero" );
				
				test.done();
				
			} );
		},
		
		// app/update_job
		
		function testAPIUpdateJob(test) {
			// test app/update_job api
			var self = this;
			var params = {
				"session_id": session_id, 
				id: this.job_id,
				notify_fail: 'test2@test.com'
			};
			
			request.json( api_url + '/app/update_job', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				var all_jobs = cronicle.getAllActiveJobs();
				var job = all_jobs[ self.job_id ];
				
				test.ok( !!job, "Found our job in active list" );
				test.ok( job.event == self.event_id, "Job has correct Event ID" );
				test.ok( job.notify_fail == "test2@test.com", "Our notify_fail update was applied" );
				
				test.done();
				
			} );
		},
		
		// wait for job to complete
		
		function testWaitJobComplete(test) {
			// go into wait loop while job is still in progress
			var self = this;
			var params = {
				"session_id": session_id, 
				id: this.job_id,
				need_log: 1
			};
			var details = { code: 1 };
			var count = 0;
			
			async.doWhilst(
				function (callback) {
					// poll get_job_details API
					request.json( api_url + '/app/get_job_details', params, function(err, resp, data) {
						if (err) return callback(err);
						if (resp.statusCode != 200) return callback(new Error("HTTP " + resp.statusCode + " " + resp.statusMessage));
						
						// e-brake to prevent infinite loop
						if (count++ > 100) return callback(new Error("Too many loop iterations polling get_job_details API"));
						
						details = data;
						setTimeout( callback, 500 );
					} );
				},
				function () { return (details.code != 0); },
				function (err) {
					// job is complete
					var job = details.job;
					
					test.ok( !!job, "Got job details in response" );
					test.ok( job.id == self.job_id, "Job ID matches" );
					test.ok( !!job.complete, "Job is marked as complete" );
					test.ok( job.code == 0, "Job is not marked as an error" );
					test.ok( !!job.perf, "Job has perf metrics" );
					test.ok( !!job.pid, "Job record still has a pid" );
					
					// job pid should be dead at this point
					var ping = false;
					try { ping = process.kill( job.pid, 0 ); }
					catch (e) {;}
					test.ok( !ping, "Job PID is dead" );
					
					test.done();
				}
			);
		},
		
		// app/get_job_log
		
		function testAPIGetJobLog(test) {
			// test get_job_log API (raw HTTP get, not a JSON API)
			var self = this;
			
			request.get( api_url + '/app/get_job_log?id=' + this.job_id, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( !!data, "Got data buffer" );
				test.ok( data.length > 0, "Data buffer has length" );
				test.ok( data.toString().match(/success/i), "Log buffer contains expected string" );
				
				test.done();
				
			} );
		},
		
		// app/get_event_history
		
		function testAPIGetEventHistory(test) {
			// go into wait loop while event history is being written
			var self = this;
			var params = {
				"session_id": session_id, 
				id: this.event_id,
				offset: 0,
				limit: 100
			};
			var details = { rows: [] };
			var count = 0;
			
			async.doWhilst(
				function (callback) {
					// poll get_event_history API
					request.json( api_url + '/app/get_event_history', params, function(err, resp, data) {
						if (err) return callback(err);
						if (resp.statusCode != 200) return callback(new Error("HTTP " + resp.statusCode + " " + resp.statusMessage));
						
						// e-brake to prevent infinite loop
						if (count++ > 10) return callback(new Error("Too many loop iterations polling get_event_history API"));
						
						details = data;
						setTimeout( callback, 500 );
					} );
				},
				function () { return ( !details.rows || !details.rows.length ); },
				function (err) {
					// history is written
					var stub = details.rows[0];
					
					test.ok( !!stub, "Got event history in response" );
					test.ok( stub.id == self.job_id, "History ID matches Job ID" );
					test.ok( stub.code == 0, "Correct code in history item" );
					test.ok( stub.event == self.event_id, "History item Event ID matching Event ID" );
					test.ok( stub.elapsed > 0, "History item has non-zero elapsed time" );
					test.ok( stub.action == "job_complete", "History item has correct action" );
					
					test.done();
				}
			);
		},
		
		// app/get_history
		
		function testAPIGetHistory(test) {
			// go into wait loop while history is being written
			var self = this;
			var params = {
				"session_id": session_id,
				offset: 0,
				limit: 100
			};
			var details = { rows: [] };
			var count = 0;
			
			async.doWhilst(
				function (callback) {
					// poll get_history API
					request.json( api_url + '/app/get_history', params, function(err, resp, data) {
						if (err) return callback(err);
						if (resp.statusCode != 200) return callback(new Error("HTTP " + resp.statusCode + " " + resp.statusMessage));
						
						// e-brake to prevent infinite loop
						if (count++ > 10) return callback(new Error("Too many loop iterations polling get_history API"));
						
						details = data;
						setTimeout( callback, 500 );
					} );
				},
				function () { return ( !details.rows || !details.rows.length ); },
				function (err) {
					// history is written
					var stub = details.rows[0];
					
					test.ok( !!stub, "Got event history in response" );
					test.ok( stub.id == self.job_id, "History ID matches Job ID" );
					test.ok( stub.code == 0, "Correct code in history item" );
					test.ok( stub.event == self.event_id, "History item Event ID matching Event ID" );
					test.ok( stub.elapsed > 0, "History item has non-zero elapsed time" );
					test.ok( stub.action == "job_complete", "History item has correct action" );
					
					test.done();
				}
			);
		},
		
		// app/get_activity
		
		function testAPIGetActivity(test) {
			// go into wait loop while activity log is being written
			var self = this;
			var params = {
				"session_id": session_id,
				offset: 0,
				limit: 100
			};
			var details = { rows: [] };
			var count = 0;
			
			async.doWhilst(
				function (callback) {
					// poll get_activity API
					request.json( api_url + '/app/get_activity', params, function(err, resp, data) {
						if (err) return callback(err);
						if (resp.statusCode != 200) return callback(new Error("HTTP " + resp.statusCode + " " + resp.statusMessage));
						
						// e-brake to prevent infinite loop
						if (count++ > 10) return callback(new Error("Too many loop iterations polling get_activity API"));
						
						details = data;
						setTimeout( callback, 500 );
					} );
				},
				function () { return ( !details.rows || !details.rows.length || (details.rows[0].id != self.job_id) ); },
				function (err) {
					// activity is written
					// test.debug("Activity response:", details);
					
					var stub = details.rows[0];
					test.debug("Activity first item:", stub);
					
					test.ok( !!stub, "Got activity in response" );
					test.ok( stub.id == self.job_id, "Activity ID matches Job ID" );
					test.ok( stub.event == self.event_id, "Activity item Event ID matches Event ID" );
					test.ok( stub.action == "job_run", "Activity item has correct action" );
					
					test.done();
				}
			);
		},
		
		function testSchedulerEventTiming(test) {
			// test various formats of event timing
			
			// timestamp for testing: Epoch 1454797620
			// Sat Feb  6 14:27:00 2016 (PST)
			
			var cursor = 1454797620;
			var tz = "America/Los_Angeles";
			
			test.ok( !!cronicle.checkEventTiming( {}, cursor, tz ), "Every minute should run" );
			
			test.ok( !!cronicle.checkEventTiming( { minutes: [27] }, cursor, tz ), "Hourly should run" );
			test.ok( !cronicle.checkEventTiming( { minutes: [28] }, cursor, tz ), "Hourly should not run" );
			
			test.ok( !!cronicle.checkEventTiming( { hours: [14], minutes: [27] }, cursor, tz ), "Daily should run" );
			test.ok( !!cronicle.checkEventTiming( { hours: [14] }, cursor, tz ), "Daily every minute should run" );
			test.ok( !cronicle.checkEventTiming( { hours: [17], minutes: [27] }, cursor, tz ), "Daily should not run" );
			
			test.ok( !!cronicle.checkEventTiming( { weekdays: [6], hours: [14], minutes: [27] }, cursor, tz ), "Weekly should run" );
			test.ok( !!cronicle.checkEventTiming( { weekdays: [6], minutes: [27] }, cursor, tz ), "Weekly hourly should run" );
			test.ok( !cronicle.checkEventTiming( { weekdays: [0], hours: [14], minutes: [27] }, cursor, tz ), "Weekly should not run" );
			
			test.ok( !!cronicle.checkEventTiming( { days: [6], hours: [14], minutes: [27] }, cursor, tz ), "Monthly should run" );
			test.ok( !!cronicle.checkEventTiming( { days: [6], minutes: [27] }, cursor, tz ), "Monthly hourly should run" );
			test.ok( !cronicle.checkEventTiming( { days: [5], hours: [14], minutes: [27] }, cursor, tz ), "Monthly should not run" );
			
			test.ok( !!cronicle.checkEventTiming( { months: [2], days: [6], hours: [14], minutes: [27] }, cursor, tz ), "Yearly should run" );
			test.ok( !!cronicle.checkEventTiming( { months: [2], minutes: [27] }, cursor, tz ), "Yearly hourly should run" );
			test.ok( !cronicle.checkEventTiming( { months: [12], days: [6], hours: [14], minutes: [27] }, cursor, tz ), "Yearly should not run" );
			
			test.ok( !!cronicle.checkEventTiming( { years: [2016], months: [2], days: [6], hours: [14], minutes: [27] }, cursor, tz ), "Single should run" );
			test.ok( !cronicle.checkEventTiming( { years: [2015], months: [2], days: [6], hours: [14], minutes: [27] }, cursor, tz ), "Single should not run" );
			
			// now test same timestamp in a different timezone
			tz = "America/New_York";
			
			test.ok( !!cronicle.checkEventTiming( { hours: [17], minutes: [27] }, cursor, tz ), "New York should run" );
			test.ok( !cronicle.checkEventTiming( { hours: [14], minutes: [27] }, cursor, tz ), "New York should not run" );
			
			test.done();
		},
		
		function testUpdateEventForSchedule(test) {
			// update event with hourly timing and a simple shell command
			var self = this;
			
			var params = {
				"params": {
					"script": "#!/bin/sh\n\necho \"UNIT TEST STRING\""
				},
				"timing": {
					"minutes": [25] // hourly on the 25th minute
				},
				"plugin": "shellplug",
				"web_hook": api_url + '/app/unit_test_web_hook'
			};
			
			storage.listFindUpdate( 'global/schedule', { id: this.event_id }, params, function(err) {
				test.ok( !err, "Failed to update event: " + err );
				test.done();
			} );
		},
		
		function testSchedulerTick(test) {
			// tick scheduler with false time, which should start our job
			var self = this;
			
			test.ok( !!cronicle.state.enabled, "Scheduler state is currently enabled" );
			
			// add API handler for testing web hooks
			cronicle.api_unit_test_web_hook = function(args, callback) {
				// hello
				var params = args.params || {};
				
				if (self.expect_web_hook && self.current_test && (params.action == 'job_complete')) {
					var test = self.current_test;
					delete self.current_test;
					
					self.web_hook_data = params;
					test.ok( !!params, "Got web hook data" );
					test.done();
				}
				
				callback({ code: 0 });
			}; // web hook handler
			
			// set props for api callback to detect
			self.expect_web_hook = true;
			self.web_hook_data = null;
			self.current_test = test;
			
			// setup our fake timestamp to match event timing settings
			var dargs = Tools.getDateArgs( Tools.timeNow(true) );
			dargs.min = 25; // match our event timing
			
			// tick the scheduler
			cronicle.schedulerMinuteTick( dargs );
		},
		
		function testWebHookData(test) {
			// web hook should have got us here, so let's examine the data
			var job = this.web_hook_data;
			test.debug("Web hook data:", job);
			
			delete this.web_hook_data;
			delete this.expect_web_hook;
			
			test.ok( !!job, "Got web hook data" );
			test.ok( !!job.id, "Job has an ID", job );
			test.ok( job.id != this.job_id, "Job ID does not match previous job", job );
			test.ok( job.code == 0, "Job is not marked as an error", job );
			test.ok( job.event == this.event_id, "Job Event ID matches", job );
			test.ok( job.category == "general", "Job has correct category", job );
			test.ok( job.plugin == "shellplug", "Job has correct Plugin", job );
			test.ok( !!job.base_app_url, "Job has correct key pulled from config via web hook", job );
			test.ok( job.something_custom == "nonstandard property", "Job has correct custom web hook property", job );
			test.ok( !job.smtp_hostname, "Job does not have config key not in the web hook key list", job );
			
			test.done();
		},
		
		function testRunFailedEvent(test) {
			// run an event that fails
			var self = this;
			
			// set props for api callback to detect
			this.expect_web_hook = true;
			this.web_hook_data = null;
			this.current_test = test;
			
			storage.listFind( 'global/schedule', { id: this.event_id }, function(err, event) {
				test.ok( !err, "No error locating event in schedule" );
				test.ok( !!event, "Found event in schedule" );
				
				var job = Tools.copyHash( event, true );
				job.params.script = "#!/bin/sh\n\necho \"UNIT TEST DELIBERATE FAILURE\"\nexit 1\n";
				
				cronicle.launchJob( job, function(err, jobs) {
					// not doing anything here, as web hook should fire automatically and finish the test
				} );
			} );
		},
		
		function testRunFailedResults(test) {
			// make sure failed event really failed
			var job = this.web_hook_data;
			test.debug( "Web hook data: ", job );
			
			delete this.web_hook_data;
			delete this.expect_web_hook;
			
			test.ok( !!job, "Got web hook data" );
			test.ok( !!job.id, "Job has an ID" );
			test.ok( job.code != 0, "Job is marked as an error" );
			test.ok( !!job.description, "Job has an error description" );
			test.ok( job.event == this.event_id, "Job Event ID matches" );
			test.ok( job.category == "general", "Job has correct category" );
			test.ok( job.plugin == "shellplug", "Job has correct Plugin" );
			
			// need rest here, for async logs to finish inserting
			setTimeout( function() {
				test.done();
			}, 500 );
		},
		
		function testRunDetachedEvent(test) {
			// run event in detached mode
			var self = this;
			
			storage.listFind( 'global/schedule', { id: this.event_id }, function(err, event) {
				test.ok( !err, "No error locating event in schedule" );
				test.ok( !!event, "Found event in schedule" );
				
				var job = Tools.copyHash( event, true );
				job.detached = 1;
				
				cronicle.launchJob( job, function(err, jobs) {
					test.ok( !err, "No error launching job" );
					test.ok( !!jobs, "Got array of launched jobs" );
					test.ok( jobs.length == 1, "Launched exactly one job" );
					test.ok( jobs[0].id, "Got Job ID" );
					
					// save new job id
					self.detached_job_id = jobs[0].id;
					
					test.done();
				} );
			} );
		},
		
		function testWaitForDetachedQueue(test) {
			// monitor queue directory until finished file shows up
			var self = this;
			var file_spec = server.config.get('queue_dir') + '/*.json';
			var files_found = false;
			
			async.doWhilst(
				function (callback) {
					// poll queue dir
					glob(file_spec, {}, function (err, files) {
						// got task files
						if (files && files.length) {
							files_found = true;
						}
						setTimeout( callback, 250 );
					} );
				},
				function () { return (!files_found); },
				function (err) {
					// got files, we're done
					test.done();
				}
			);
		},
		
		function testFinishDetachedEvent(test) {
			// force external queue to run to process finished event
			
			// set props for api callback to detect
			this.expect_web_hook = true;
			this.web_hook_data = null;
			this.current_test = test;
			
			cronicle.monitorExternalQueue();
			// not calling test.done() as it should fire via web hook
		},
		
		function testDetachedWebHookData(test) {
			// web hook should have got us here, so let's examine the data
			var job = this.web_hook_data;
			test.debug( "Detached web hook data: ", job );
			
			delete this.web_hook_data;
			delete this.expect_web_hook;
			
			test.ok( !!job, "Got web hook data" );
			test.ok( !!job.id, "Job has an ID" );
			test.ok( job.id == this.detached_job_id, "Job ID matches our detached job" );
			test.ok( job.code == 0, "Job is not marked as an error" );
			test.ok( job.event == this.event_id, "Job Event ID matches" );
			test.ok( job.category == "general", "Job has correct category" );
			test.ok( job.plugin == "shellplug", "Job has correct Plugin" );
			
			// need rest here, for async logs to finish inserting,
			// before we delete the associated event (which also deletes logs!)
			setTimeout( function() {
				test.done();
			}, 500 );
		},
		
		// app/delete_event
		
		function testAPIDeleteEvent(test) {
			// test app/delete_event api
			var self = this;
			var params = {
				"id": this.event_id,
				"session_id": session_id
			};
			
			request.json( api_url + '/app/delete_event', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that event actually got deleted from storage
				storage.listFind( 'global/schedule', { id: self.event_id }, function(err, event) {
					
					test.ok( !err, "No error expected for missing data" );
					test.ok( !event, "Data record should be null (deleted)" );
					
					delete self.event_id;
					
					test.done();
				} );
			} );
		},
		
		
		
		// TODO: app/abort_job
		// TODO: app/abort_jobs
		
		// TODO: catch-up event
		
		
		
		// app/update_master_state
		
		function testAPIUpdateMasterState(test) {
			// test app/update_master_state api
			var self = this;
			var params = {
				"session_id": session_id,
				"enabled": 0
			};
			
			// pre-check that state is currently enabled
			test.ok( !!cronicle.state.enabled, "Scheduler state is currently enabled" );
			
			// disable it via API
			request.json( api_url + '/app/update_master_state', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that change took effect
				test.ok( !cronicle.state.enabled, "State is actually disabled" );
				
				test.done();
			} );
		},
		
		// user/logout
		
		function testAPIUserLogout(test) {
			// test user/logout api
			var self = this;
			var params = {
				"session_id": session_id
			};
			
			request.json( api_url + '/user/logout', params, function(err, resp, data) {
				
				test.ok( !err, "No error requesting API" );
				test.ok( resp.statusCode == 200, "HTTP 200 from API" );
				test.ok( "code" in data, "Found code prop in JSON response" );
				test.ok( data.code == 0, "Code is zero (no error)" );
				
				// check to see that session actually got deleted from storage
				storage.get('sessions/' + session_id, function(err, data) {
					
					test.ok( !!err, "Error expected for missing session" );
					test.ok( !data, "Data record should be null (deleted)" );
					
					test.done();
				} );
			} );
		}
		
	], // tests array
	
	tearDown: function (callback) {
		// always called right before shutdown
		this.logDebug(1, "Running tearDown");
		
		// add some delays here so async storage ops can complete
		setTimeout( function() { 
			server.shutdown( function() {
				// delete our mess after a short rest (just so no errors are logged)
				setTimeout( function() {
					try { cp.execSync('rm -rf data/unittest'); }
					catch (e) {;}
					
					callback();
				}, 500 );
			} );
		}, 500 );
	}
};
