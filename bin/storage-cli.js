#!/usr/bin/env node

// CLI for Storage System
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var path = require('path');
var cp = require('child_process');
var os = require('os');
var fs = require('fs');
var async = require('async');

var Args = require('pixl-args');
var Tools = require('pixl-tools');
var StandaloneStorage = require('pixl-server-storage/standalone');

// chdir to the proper server root dir
process.chdir( path.dirname( __dirname ) );

// load app's config file
var config = require('../conf/config.json');

// shift commands off beginning of arg array
var argv = JSON.parse( JSON.stringify(process.argv.slice(2)) );
var commands = [];
while (argv.length && !argv[0].match(/^\-/)) {
	commands.push( argv.shift() );
}

// now parse rest of cmdline args, if any
var args = new Args( argv, {
	debug: false,
	verbose: false,
	quiet: false
} );
args = args.get(); // simple hash

// copy debug flag into config (for standalone)
config.Storage.debug = args.debug;

var print = function(msg) {
	// print message to console
	if (!args.quiet) process.stdout.write(msg);
};
var verbose = function(msg) {
	// print only in verbose mode
	if (args.verbose) print(msg);
};

if (config.uid && (process.getuid() != 0)) {
	print( "ERROR: Must be root to use this script.\n" );
	process.exit(1);
}

// determine server hostname
var hostname = (process.env['HOSTNAME'] || process.env['HOST'] || os.hostname()).toLowerCase();

// find the first external IPv4 address
var ip = '';
var ifaces = os.networkInterfaces();
var addrs = [];
for (var key in ifaces) {
	addrs = addrs.concat( addrs, ifaces[key] );
}
var addr = Tools.findObject( addrs, { family: 'IPv4', internal: false } );
if (addr && addr.address && addr.address.match(/^\d+\.\d+\.\d+\.\d+$/)) {
	ip = addr.address;
}
else {
	print( "ERROR: Could not determine server's IP address.\n" );
	process.exit(1);
}

// util.isArray is DEPRECATED??? Nooooooooode!
var isArray = Array.isArray || util.isArray;

// construct standalone storage server
var storage = new StandaloneStorage(config.Storage, function(err) {
	if (err) throw err;
	// storage system is ready to go
	
	// become correct user
	if (config.uid && (process.getuid() == 0)) {
		print( "Switching to user: " + config.uid + "\n" );
		process.setuid( config.uid );
	}
	
	// process command
	var cmd = commands.shift();
	print("\n");
	
	switch (cmd) {
		case 'setup':
		case 'install':
			// setup new master server
			var setup = require('../conf/setup.json');
			
			// make sure this is only run once
			storage.get( 'global/users', function(err) {
				if (!err) {
					print( "Storage has already been set up.  There is no need to run this command again.\n\n" );
					process.exit(1);
				}
				
				async.eachSeries( setup.storage,
					function(params, callback) {
						verbose( "Executing: " + JSON.stringify(params) + "\n" );
						// [ "listCreate", "global/users", { "page_size": 100 } ]
						var func = params.shift();
						params.push( callback );
						
						// massage a few params
						if (typeof(params[1]) == 'object') {
							var obj = params[1];
							if (obj.created) obj.created = Tools.timeNow(true);
							if (obj.modified) obj.modified = Tools.timeNow(true);
							if (obj.regexp && (obj.regexp == '_HOSTNAME_')) obj.regexp = '^(' + Tools.escapeRegExp( hostname ) + ')$';
							if (obj.hostname && (obj.hostname == '_HOSTNAME_')) obj.hostname = hostname;
							if (obj.ip && (obj.ip == '_IP_')) obj.ip = ip;
						}
						
						// call storage directly
						storage[func].apply( storage, params );
					},
					function(err) {
						if (err) throw err;
						if (args.verbose) print("\n");
						
						print( "Setup completed successfully!\n" );
						print( "This server ("+hostname+") has been added as the single primary master server.\n" );
						print( "An administrator account has been created with username 'admin' and password 'admin'.\n" );
						print( "You should now be able to start the service by typing: '/opt/cronicle/bin/control.sh start'\n" );
						print( "Then, the web interface should be available at: http://"+hostname+":"+config.WebServer.http_port+"/\n" );
						print( "Please allow for up to 60 seconds for the server to become master.\n\n" );
					}
				);
			} );
		break;
		
		case 'admin':
			// create admin account
			// Usage: ./storage-cli.js admin USERNAME PASSWORD
			var username = commands.shift();
			var password = commands.shift();
			if (!username || !password) {
				print( "\nUsage: bin/storage-cli.js admin USERNAME PASSWORD\n\n" );
				process.exit(1);
			}
			if (!username.match(/^[\\w\\-\\.]+$/)) {
				print( "\nERROR: Username must contain only alphanumerics, dash and period.\n\n" );
				process.exit(1);
			}
			username = username.toLowerCase();
			
			var user = {
				username: username,
				password: password,
				full_name: "Administrator",
				email: "admin@cronicle.com"
			};
			
			user.active = 1;
			user.created = user.modified = Tools.timeNow(true);
			user.salt = Tools.generateUniqueID( 64, user.username );
			user.password = Tools.digestHex( '' + user.password + user.salt );
			user.privileges = { admin: 1 };
			
			storage.put( 'users/' + username, user, function(err) {
				if (err) throw err;
				print( "\nAdministrator '"+username+"' created successfully.\n" );
				print("\n");
			} );
		break;
		
		case 'get':
		case 'fetch':
		case 'view':
		case 'cat':
			// get storage key
			// Usage: ./storage-cli.js get users/jhuckaby
			var key = commands.shift();
			storage.get( key, function(err, data) {
				if (err) throw err;
				if (storage.isBinaryKey(key)) print( data.toString() + "\n" );
				else print( ((typeof(data) == 'object') ? JSON.stringify(data, null, "\t") : data) + "\n" );
				print("\n");
			} );
		break;
		
		case 'edit':
		case 'vi':
			var key = commands.shift();
			storage.get( key, function(err, data) {
				if (err) data = {};
				print("Spawning editor to edit record: " + key + "\n");
				
				// save to local temp file
				var temp_file = path.join( os.tmpdir(), 'cli-temp-' + process.pid + '.json' );
				fs.writeFileSync( temp_file, JSON.stringify(data, null, "\t") + "\n" );
				var stats = fs.statSync( temp_file );
				var old_mod = Math.floor( stats.mtime.getTime() / 1000 );
				
				// spawn vi but inherit terminal
				var child = cp.spawn(process.env.EDITOR || 'vi', [temp_file], {
					stdio: 'inherit'
				} );
				child.on('exit', function (e, code) {
					var stats = fs.statSync( temp_file );
					var new_mod = Math.floor( stats.mtime.getTime() / 1000 );
					if (new_mod != old_mod) {
						print("Saving new data back into record: "+key+"\n");
						
						var json_raw = fs.readFileSync( temp_file, { encoding: 'utf8' } );
						fs.unlinkSync( temp_file );
						
						var data = JSON.parse( json_raw );
						
						storage.put( key, data, function(err, data) {
							if (err) throw err;
							print("Record successfully saved with your changes: "+key+"\n");
						} );
					}
					else {
						fs.unlinkSync( temp_file );
						print("File has not been changed, record was not touched: "+key+"\n");
					}
				} );
				
			} ); // got data
		break;
		
		case 'delete':
			// delete storage key
			// Usage: ./storage-cli.js delete users/jhuckaby
			var key = commands.shift();
			storage.delete( key, function(err, data) {
				if (err) throw err;
				print("Record '"+key+"' deleted successfully.\n");
				print("\n");
			} );
		break;
		
		case 'list_create':
			// create new list
			// Usage: ./storage-cli.js list_create key
			var key = commands.shift();
			storage.listCreate( key, null, function(err) {
				if (err) throw err;
				print("List created successfully: " + key + "\n");
				print("\n");
			} );
		break;
		
		case 'list_pop':
			// pop item off end of list
			// Usage: ./storage-cli.js list_pop key
			var key = commands.shift();
			storage.listPop( key, function(err, item) {
				if (err) throw err;
				print("Item popped off list: " + key + ": " + JSON.stringify(item, null, "\t") + "\n");
				print("\n");
			} );
		break;
		
		case 'list_get':
			// fetch items from list
			// Usage: ./storage-cli.js list_get key idx len
			var key = commands.shift();
			var idx = commands.shift() || 0;
			var len = commands.shift() || 0;
			storage.listGet( key, idx, len, function(err, items) {
				if (err) throw err;
				print("Fetched items from list: " + key + ": " + JSON.stringify(items, null, "\t") + "\n");
				print("\n");
			} );
		break;
		
		case 'list_info':
			// fetch info about list
			// Usage: ./storage-cli.js list_info key
			var key = commands.shift();
			
			storage.listGetInfo( key, function(err, list) {
				if (err) throw err;
				print("List Header: " + key + ": " + JSON.stringify(list, null, "\t") + "\n\n");
				var page_idx = list.first_page;
				var item_idx = 0;
				async.whilst(
					function() { return page_idx <= list.last_page; },
					function(callback) {
						// load each page
						storage._listLoadPage(key, page_idx++, false, function(err, page) {
							if (err) return callback(err);
							print("Page " + Math.floor(page_idx - 1) + ": " + page.items.length + " items\n");
							callback();
						} ); // page loaded
					},
					function(err) {
						// all pages iterated
						if (err) throw err;
						print("\n");
					} // pages complete
				); // whilst
			} );
		break;
		
		case 'list_delete':
			// delete list
			// Usage: ./storage-cli.js list_delete key
			var key = commands.shift();
			storage.listDelete( key, null, function(err) {
				if (err) throw err;
				print("List deleted successfully: " + key + "\n");
				print("\n");
			} );
		break;
		
		case 'maint':
		case 'maintenance':
			// perform daily maintenance, specify date or defaults to current day
			// Usage: ./storage-cli.js maint 2015-05-31
			storage.runMaintenance( commands.shift(), function() {
				print( "Daily maintenance completed successfully.\n" );
				print("\n");
			} );
		break;
		
		case 'upgrade_logs':
			// upgrade all non-compressed logs to gzip-compressed
			// This is part of Cronicle Version 0.5 and can be discarded after that release
			var zlib = require('zlib');
			print( "Special Cronicle v0.5 Log Upgrade\n" );
			print( "Compressing all job logs...\n\n" );
			
			storage.listEach( 'logs/completed', 
				function(item, idx, callback) {
					var job_path = 'jobs/' + item.id;
					var old_path = 'jobs/' + item.id + '/log.txt';
					var new_path = old_path + '.gz';
					
					storage.get( job_path, function(err, job) {
						if (err) {
							// silently skip -- job record deleted or already converted
							return callback();
						}
						
						storage.getStream( old_path, function(err, stream) {
							if (err) {
								// silently skip -- log deleted or already converted
								return callback();
							}
							
							print( "Compressing: " + old_path + "..." );
							
							var gzip = zlib.createGzip( config['gzip_opts'] || {} );
							stream.pipe( gzip );
							
							storage.putStream( new_path, gzip, function(err) {
								if (err) {
									print("Failed to store job log: " + new_path + ": " + err + "\n");
									return callback();
								}
								
								// delete uncompressed log
								storage.delete( old_path, function(err, data) {
									if (err) {
										print("Failed to delete job log: " + old_path + ": " + err + "\n");
										return callback();
									}
									
									// set new expiration
									var expiration = Math.floor(job.time_end || Tools.timeNow()) + (86400 * (job.log_expire_days || config['job_data_expire_days']));
									var dargs = Tools.getDateArgs( expiration );
									verbose( "<<" + dargs.yyyy_mm_dd + ">>" );
									
									storage.expire( new_path, expiration );
									
									print( "OK.\n" );
									callback();
								} ); // delete
							} ); // putStream
						} ); // getStream
					} ); // get
				}, 
				function(err) {
					print( "\nAll job logs compressed.\nExiting.\n\n");
				}
			);
		break;
		
	} // switch
});
