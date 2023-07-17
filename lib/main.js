#!/usr/bin/env node

// Cronicle Server - Main entry point
// Copyright (c) 2015 - 2023 Joseph Huckaby
// Released under the MIT License

// Error out if Node.js version is old
if (process.version.match(/^v?(\d+)/) && (parseInt(RegExp.$1) < 16) && !process.env['CRONICLE_OLD']) {
	console.error("\nERROR: You are using an incompatible version of Node.js (" + process.version + ").  Please upgrade to v16 or later.  Instructions: https://nodejs.org/en/download/package-manager\n\nTo ignore this error and run unsafely, set a CRONICLE_OLD environment variable.  Do this at your own risk.\n");
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
