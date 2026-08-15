#!/usr/bin/env node

// Cronicle Server - Main entry point
// Copyright (c) 2015 - 2023 Joseph Huckaby
// Released under the MIT License

// Cronicle's UI does not currently implement CSRF token handling.
// Force this off in code so upgrades do not require user configuration changes.
process.env.CRONICLE_User__use_csrf = "false";

// sanitize-html v2.17.6+ depends on the ESM-only htmlparser2 v12 package.
// Node.js v22.12.0 is the first supported release that can require it from CommonJS without a flag.
var node_version = process.version.match(/^v?(\d+)\.(\d+)/);
var node_major = node_version ? parseInt(node_version[1], 10) : 0;
var node_minor = node_version ? parseInt(node_version[2], 10) : 0;
var node_too_old = node_version && ((node_major < 22) || ((node_major === 22) && (node_minor < 12)));

// Fail early with a useful message, before loading any dependencies that require modern Node.js.
if (node_too_old) {
	console.error("\nERROR: You are using an incompatible version of Node.js (" + process.version + ").  Cronicle requires v22.12.0 or later.  Instructions: https://nodejs.org/en/download/package-manager\n");
	process.exit(1);
}

var PixlServer = require("pixl-server");

// chdir to the proper server root dir
process.chdir( require('path').dirname( __dirname ) );

var server = new PixlServer({
	
	__name: 'Cronicle',
	__version: require('../package.json').version,
	
	configFile: "conf/config.json",
	
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
	process.title = server.__name + ' Server';
} );
