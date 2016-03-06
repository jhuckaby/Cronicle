#!/usr/bin/env node

// Test Plugin for Cronicle
var js = require('fs');
var JSONStream = require('pixl-json-stream');
var Logger = require('pixl-logger');
var Tools = require('pixl-tools');
var Perf = require('pixl-perf');

var perf = new Perf();
perf.setScale( 1 ); // seconds
perf.begin();

// setup stdin / stdout streams 
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

console.warn("Printed this with console.warn, should go to stderr, and thus straight to our logfile.");
console.log("Printed this with console.log, should be ignored as not json, and also end up in our logfile.");

if (process.argv.length > 2) console.log("ARGV: " + JSON.stringify(process.argv));

/*process.on('SIGTERM', function() {
	console.warn("Caught SIGTERM and ignoring it!  Hahahahaha!");
} );*/

var stream = new JSONStream( process.stdin, process.stdout );
stream.on('json', function(job) {
	// got job from parent 
	var columns = ['hires_epoch', 'date', 'hostname', 'category', 'code', 'msg', 'data'];
	var logger = new Logger( job.log_file, columns );
	logger.set('hostname', job.hostname);
	// logger.set('component', job.id);
	logger.set('debugLevel', 9);
	
	logger.debug(1, "This is a test debug log entry");
	logger.debug(9, "Here is our job, delivered via JSONStream:", job);
	logger.debug(9, "The current date/time for our job is: " + (new Date(job.now * 1000)).toString() );
	
	// use some memory so we show up on the mem graph
	var buf = new Buffer( 1024 * 1024 * Math.floor( 128 + (Math.random() * 128) ) );
	
	var start = Tools.timeNow();
	var duration = parseInt( job.params.duration );
	var idx = 0;
	
	var timer = setInterval( function() {
		var now = Tools.timeNow();
		var elapsed = now - start;
		var progress = Math.min( elapsed / duration, 1.0 );
		
		buf.fill( String.fromCharCode( Math.floor( Math.random() * 256 ) ) );
		
		if (job.params.progress) {
			// report progress
			logger.debug(9, "Progress: " + progress);
			stream.write({
				progress: progress
			});
		}
		
		idx++;
		if (idx % 10 == 0) {
			logger.debug(9, "Now is the time for all good men to come to the aid of their country! " + progress);
		}
		
		if (progress >= 1.0) {
			logger.debug(9, "We're done!");
			perf.end();
			clearTimeout( timer );
			
			// insert some fake random stats into perf
			var max = perf.scale * (duration / 5);
			var rand_range = function(low, high) { return low + (Math.random() * (high - low)); };
			
			perf.perf.db_query = { end: 1, elapsed: rand_range(0, max * 0.3) };
			perf.perf.db_connect = { end: 1, elapsed: rand_range(max * 0.2, max * 0.5) };
			perf.perf.log_read = { end: 1, elapsed: rand_range(max * 0.4, max * 0.7) };
			perf.perf.gzip_data = { end: 1, elapsed: rand_range(max * 0.6, max * 0.9) };
			perf.perf.http_post = { end: 1, elapsed: rand_range(max * 0.8, max * 1) };
			
			switch (job.params.action) {
				case 'Success':
					logger.debug(9, "Simulating a successful response");
					stream.write({
						complete: 1,
						code: 0,
						description: "Success!",
						perf: perf.summarize()
					});
				break;
				
				case 'Failure':
					logger.debug(9, "Simulating a failure response");
					stream.write({
						complete: 1,
						code: 999,
						description: "Simulating an error message here.  Something went wrong!",
						perf: perf.summarize()
					});
				break;
				
				case 'Crash':
					logger.debug(9, "Simulating a crash");
					setTimeout( function() { 
						// process.exit(1); 
						throw new Error("Test Crash");
					}, 100 );
				break;
			}
			
			// process.exit(0);
		}
		else {
			// chew up some CPU so we show up on the chart
			var temp = Tools.timeNow();
			while (Tools.timeNow() - temp < 0.10) {
				var x = Math.PI * 32768 / 100.3473847384 * Math.random();
			}
		}
		
	}, 150 );
	
} );
