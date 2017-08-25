#!/usr/bin/env node

// Detached Plugin Runner for Cronicle
// Copyright (c) 2015 - 2017 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var os = require('os');
var cp = require('child_process');
var path = require('path');
var sqparse = require('shell-quote').parse;
var JSONStream = require('pixl-json-stream');
var Tools = require('pixl-tools');

var args = process.argv.slice(-2);
if (!args[1] || !args[1].match(/\.json$/)) {
	throw new Error("Usage: ./run-detached.js detached /PATH/TO/JSON/FILE.json");
}

var job_file = args[1];
var job = require( job_file );
fs.unlink( job_file, function(err) {;} );

var child_cmd = job.command;
var child_args = [];

// if command has cli args, parse using shell-quote
if (child_cmd.match(/\s+(.+)$/)) {
	var cargs_raw = RegExp.$1;
	child_cmd = child_cmd.replace(/\s+(.+)$/, '');
	child_args = sqparse( cargs_raw, process.env );
}

var child = cp.spawn( child_cmd, child_args, { 
	stdio: ['pipe', 'pipe', fs.openSync(job.log_file, 'a')] 
} );

var updates = { detached_pid: child.pid };
var kill_timer = null;
var update_timer = null;

var cstream = new JSONStream( child.stdout, child.stdin );
cstream.recordRegExp = /^\s*\{.+\}\s*$/;

cstream.on('json', function(data) {
	// received JSON data from child
	// store in object and send to Cronicle on exit
	for (var key in data) updates[key] = data[key];
} );

cstream.on('text', function(line) {
	// received non-json text from child, just log it
	fs.appendFileSync(job.log_file, line);
} );

cstream.on('error', function(err, text) {
	// Probably a JSON parse error (child emitting garbage)
	if (text) fs.appendFileSync(job.log_file, text + "\n");
} );

child.on('error', function (err) {
	// child error
	updates = {};
	if (kill_timer) clearTimeout(kill_timer);
	if (update_timer) clearTimeout(update_timer);
	
	var queue_file = job.queue_dir + '/' + job.id + '-' + Date.now() + '.json';
	fs.writeFileSync( queue_file + '.tmp', JSON.stringify({
		action: "detachedJobUpdate",
		id: job.id,
		complete: 1,
		code: 1,
		description: "Script failed: " + Tools.getErrorDescription(err)
	}) );
	fs.renameSync( queue_file + '.tmp', queue_file );
} );

child.on('exit', function (code, signal) {
	// child exited
	if (kill_timer) clearTimeout(kill_timer);
	if (update_timer) clearTimeout(update_timer);
	
	code = (code || signal || 0);
	if (code && !updates.code) {
		updates.code = code;
		updates.description = "Plugin exited with code: " + code;
	}
	
	updates.action = "detachedJobUpdate";
	updates.id = job.id;
	updates.complete = 1;
	updates.time_end = Tools.timeNow();
	
	// write file atomically, just in case
	var queue_file = job.queue_dir + '/' + job.id + '-complete.json';
	fs.writeFileSync( queue_file + '.tmp', JSON.stringify(updates) );
	fs.renameSync( queue_file + '.tmp', queue_file );
} );

// silence EPIPE errors on child STDIN
child.stdin.on('error', function(err) {
	// ignore
} );

// send initial job + params
cstream.write( job );

// we're done writing to the child -- don't hold open its stdin
child.stdin.end();

// send updates every N seconds, if the child sent us anything (i.e. progress updates)
// randomize interval so we don't bash the queue dir when multiple detached jobs are running
update_timer = setInterval( function() {
	if (Tools.numKeys(updates) && !updates.complete) {
		
		updates.action = "detachedJobUpdate";
		updates.id = job.id;
		updates.in_progress = 1;
		
		// write file atomically, just in case
		var queue_file = job.queue_dir + '/' + job.id + '-' + Date.now() + '.json';
		fs.writeFileSync( queue_file + '.tmp', JSON.stringify(updates) );
		fs.renameSync( queue_file + '.tmp', queue_file );
		
		updates = {};
	}
}, 30000 + Math.floor( Math.random() * 25000 ) );

// Handle termination (server shutdown or job aborted)
process.on('SIGTERM', function() { 
	// console.log("Caught SIGTERM, killing child: " + child.pid);
	if (update_timer) clearTimeout(update_timer);
	
	kill_timer = setTimeout( function() {
		// child didn't die, kill with prejudice
		// console.log("Child did not exit, killing harder: " + child.pid);
		child.kill('SIGKILL');
	}, 9 * 1000 );
	
	// try killing nicely first
	child.kill('SIGTERM');
} );
