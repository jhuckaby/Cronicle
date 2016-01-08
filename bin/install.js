// Cronicle Auto Installer
// Copyright (c) 2015 Joseph Huckaby, MIT License.
// https://github.com/jhuckaby/Cronicle

// To install, issue this command as root:
// curl -s "https://raw.githubusercontent.com/jhuckaby/Cronicle/master/bin/install.js" | node

var path = require('path');
var fs = require('fs');
var util = require('util');
var os = require('os');
var cp = require('child_process');

var installer_version = '1.0';
var base_dir = '/opt/cronicle';
var log_dir = base_dir + '/logs';
var log_file = '';
var gh_repo_url = 'http://github.com/jhuckaby/Cronicle';
var gh_releases_url = 'https://api.github.com/repos/jhuckaby/Cronicle/releases';
var gh_head_tarball_url = 'https://github.com/jhuckaby/Cronicle/archive/master.tar.gz';

var print = function(msg) { 
	process.stdout.write(msg); 
	if (log_file) fs.appendFile(log_file, msg);
};
var warn = function(msg) { 
	process.stderr.write(msg); 
	if (log_file) fs.appendFile(log_file, msg);
};
var die = function(msg) {
	warn "\nERROR: " + msg.trim() + "\n\n";
	process.exit(1);
}
var logonly = function(msg) {
	if (log_file) fs.appendFile(log_file, msg);
};

if (process.getuid() != 0) {
	die( "The Cronicle auto-installer must be run as root." );
}

// create base and log directories
try { cp.execSync( "mkdir -p " + base_dir + " && chmod 775 " + base_dir ); }
catch (err) { die("Failed to create base directory: " + base_dir + ": " + err); }

try { cp.execSync( "mkdir -p " + log_dir + " && chmod 777 " + log_dir ); }
catch (err) { die("Failed to create log directory: " + log_dir + ": " + err); }

// start logging from this point onward
log_file = log_dir + '/install.log';
logonly( "\nStarting install run: " + (new Date()).toString() + "\n" );

print( 
	"\nCronicle Installer v" + installer_version + "\n" + 
	"Copyright (c) 2015 - 2016 PixlCore.com. MIT License.\n\n" 
);

process.chdir( base_dir );

var is_preinstalled = false;
var cur_version = '';
var new_version = process.argv[2] || '';

try {
	var stats = fs.statSync( base_dir + '/package.json' );
	var json = require( base_dir + '/package.json' );
	if (json && json.version) {
		cur_version = json.version;
		is_preinstalled = true;
	}
}
catch (err) {;}

print( "Fetching release list...\n");
logonly( "Releases URL: " + gh_releases_url + "\n" );

cp.exec('curl -s ' + gh_releases_url, function (err, stdout, stderr) {
	if (err) {
		print( stdout.toString() );
		warn( stderr.toString() );
		die("Failed to fetch release list: " + gh_releases_url + ": " + err);
	}
	else {
		logonly( stdout.toString() + stderr.toString() );
	}
	
	var releases = null;
	try { releases = JSON.parse( stdout.toString() ); }
	catch (err) {
		die("Failed to parse JSON from GitHub: " + gh_releases_url + ": " + err);
	}
	
	// util.isArray is DEPRECATED??? Nooooooooode!
	var isArray = Array.isArray || util.isArray;
	if (!isArray(releases)) die("Unexpected response from GitHub Releases API: " + gh_releases_url + ": Not an array");
	
	var release = null;
	for (var idx = 0, len = releases.length; idx < len; idx++) {
		var rel = releases[idx];
		var ver = rel.tag_name.replace(/^\D+/, '');
		rel.version = ver;
		
		if (!new_version || (ver == new_version)) { 
			release = rel; 
			new_version = ver; 
			idx = len; 
		}
	} // foreach release
	
	if (!release) {
		// no release found -- use HEAD rev?
		if (!new_version || new_version.match(/HEAD/i)) {
			release = {
				version: 'HEAD',
				tarball_url: gh_head_tarball_url
			};
		}
		else {
			die("Release not found: " + new_version);
		}
	}
	
	// sanity check
	if (is_preinstalled && (cur_version == new_version)) {
		if (process.argv[2]) print( "\nVersion " + cur_version + " is already installed.\n\n" );
		else print( "\nVersion " + cur_version + " is already installed, and is the latest.\n\n" );
		process.exit(0);
	}
	
	// proceed with installation
	if (is_preinstalled) print("Upgrading from version "+cur_version+" to "+new_version+"...\n");
	else print("Installing version "+new_version+"...\n");
	
	// download tarball and expand into current directory
	var tarball_url = release.tarball_url;
	logonly( "Tarball URL: " + tarball_url + "\n" );
	
	cp.exec('curl -L ' + tarball_url + ' | tar zxf - --strip-components 1', function (err, stdout, stderr) {
		if (err) {
			print( stdout.toString() );
			warn( stderr.toString() );
			die("Failed to download release: " + tarball_url + ": " + err);
		}
		else {
			logonly( stdout.toString() + stderr.toString() );
		}
		
		try {
			var stats = fs.statSync( base_dir + '/package.json' );
			var json = require( base_dir + '/package.json' );
		}
		catch (err) {
			die("Failed to download package: " + tarball_url + ": " + err);
		}
		
		print("Installing dependencies...\n");
		logonly( "Executing command: npm install\n" );
		
		// install dependencies via npm
		cp.exec('npm install --unsafe-perm', function (err, stdout, stderr) {
			if (err) {
				print( stdout.toString() );
				warn( stderr.toString() );
				die("Failed to install dependencies: " + err);
			}
			else {
				logonly( stdout.toString() + stderr.toString() );
			}
			
			print("Running post-install script...\n");
			logonly( "Executing command: node bin/build.js dist\n" );
			
			// finally, run postinstall script
			cp.exec('node bin/build.js dist', function (err, stdout, stderr) {
				print( stdout.toString() );
				warn( stderr.toString() );
				
				if (err) {
					die("Failed to run post-install: " + err);
				}
				
				// Success!
				if (is_preinstalled) print("\nUpgrade complete.\n\n"); 
				else print("\nInstallation complete.\n\n");
				
				logonly( "Completed install run: " + (new Date()).toString() + "\n" );
				
				process.exit(0);
			} ); // build.js
		} ); // npm
	} ); // download
} ); // releases api
