#!/usr/bin/env node

// Shell Script Runner for Cronicle
// Invoked via the 'Shell Script' Plugin
// Copyright (c) 2015 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var os = require('os');
var cp = require('child_process');
var path = require('path');
var JSONStream = require('pixl-json-stream');
var Tools = require('pixl-tools');

// setup stdin / stdout streams 
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

var stream = new JSONStream( process.stdin, process.stdout );
stream.on('json', function(job) {
	// got job from parent 
	var script_file = path.join( os.tmpdir(), 'cronicle-script-temp-' + job.id + '.sh' );
	fs.writeFileSync( script_file, job.params.script, { mode: "775" } );
	
	var child = cp.spawn( script_file, [], { 
		stdio: ['pipe', 'pipe', fs.openSync(job.log_file, 'a')] 
	} );
	
	var kill_timer = null;
	
	var cstream = new JSONStream( child.stdout, child.stdin );
	cstream.recordRegExp = /^\s*\{.+\}\s*$/;
	
	cstream.on('json', function(data) {
		// received JSON data from child, pass along to Cronicle
		stream.write(data);
	} );
	
	cstream.on('text', function(line) {
		// received non-json text from child
		// look for plain number from 0 to 100, treat as progress update
		if (line.match(/^\s*(\d+)\%?\s*$/)) {
			var progress = Math.max( 0, Math.min( 100, parseInt( RegExp.$1 ) ) ) / 100;
			stream.write({
				progress: progress
			});
		}
		else {
			// otherwise just log it
			fs.appendFile(job.log_file, line);
		}
	} );
	
	cstream.on('error', function(err, text) {
		// Probably a JSON parse error (child emitting garbage)
		if (text) fs.appendFile(job.log_file, text + "\n");
	} );
	
	child.on('error', function (err) {
		// child error
		stream.write({
			complete: 1,
			code: 1,
			description: "Script failed: " + Tools.getErrorDescription(err)
		});
		
		fs.unlink( script_file );
	} );
	
	child.on('exit', function (code, signal) {
		// child exited
		if (kill_timer) clearTimeout(kill_timer);
		code = (code || signal || 0);
		
		stream.write({
			complete: 1,
			code: code,
			description: code ? ("Script exited with code: " + code) : ""
		});
		
		fs.unlink( script_file );
	} ); // exit
	
	// pass job down to child process (harmless for shell, useful for php/perl/node)
	cstream.write( job );
	
	// Handle shutdown
	process.on('SIGTERM', function() { 
		console.log("Caught SIGTERM, killing child: " + child.pid);
		
		kill_timer = setTimeout( function() {
			// child didn't die, kill with prejudice
			console.log("Child did not exit, killing harder: " + child.pid);
			child.kill('SIGKILL');
		}, 9 * 1000 );
		
		// try killing nicely first
		child.kill('SIGTERM');
	} );
	
} ); // stream
