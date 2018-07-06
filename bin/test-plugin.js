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
	var buf = null;
	if (job.params.burn) {
		buf = Buffer.alloc( 1024 * 1024 * Math.floor( 128 + (Math.random() * 128) ) );
	}
	
	var start = Tools.timeNow();
	var idx = 0;
	var duration = 0;
	
	if (job.params.duration.toString().match(/^(\d+)\-(\d+)$/)) {
		var low = RegExp.$1;
		var high = RegExp.$2;
		low = parseInt(low);
		high = parseInt(high);
		duration = Math.round( low + (Math.random() * (high - low)) );
		logger.debug(9, "Chosen random duration: " + duration + " seconds");
	}
	else {
		duration = parseInt( job.params.duration );
	}
	
	var timer = setInterval( function() {
		var now = Tools.timeNow();
		var elapsed = now - start;
		var progress = Math.min( elapsed / duration, 1.0 );
		
		if (buf) buf.fill( String.fromCharCode( Math.floor( Math.random() * 256 ) ) );
		
		if (job.params.progress) {
			// report progress
			logger.debug(9, "Progress: " + progress);
			stream.write({
				progress: progress
			});
		}
		
		idx++;
		if (idx % 10 == 0) {
			logger.debug(9, "Now is the ⏱ for all good 🏃 to come to the 🏥 of their 🇺🇸! " + progress);
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
			
			// include a table with some stats
			var table = {
				title: "Sample Job Stats",
				header: [
					"IP Address", "DNS Lookup", "Flag", "Count", "Percentage"
				],
				rows: [
					["62.121.210.2", "directing.com", "MaxEvents-ImpsUserHour-DMZ", 138, "0.0032%" ],
					["97.247.105.50", "hsd2.nm.comcast.net", "MaxEvents-ImpsUserHour-ILUA", 84, "0.0019%" ],
					["21.153.110.51", "grandnetworks.net", "InvalidIP-Basic", 20, "0.00046%" ],
					["95.224.240.69", "hsd6.mi.comcast.net", "MaxEvents-ImpsUserHour-NM", 19, "0.00044%" ],
					["72.129.60.245", "hsd6.nm.comcast.net", "InvalidCat-Domestic", 17, "0.00039%" ],
					["21.239.78.116", "cable.mindsprung.com", "InvalidDog-Exotic", 15, "0.00037%" ],
					["172.24.147.27", "cliento.mchsi.com", "MaxEvents-ClicksPer", 14, "0.00035%" ],
					["60.203.211.33", "rgv.res.com", "InvalidFrog-Croak", 14, "0.00030%" ],
					["24.8.8.129", "dsl.att.com", "Pizza-Hawaiian", 12, "0.00025%" ],
					["255.255.1.1", "favoriteisp.com", "Random-Data", 10, "0%" ]
				],
				caption: "This is an example stats table you can generate from within your Plugin code."
			};
			
			// include a custom html report
			var html = {
				title: "Sample Job Report",
				content: "<pre>This is a sample text report you can generate from within your Plugin code (can be HTML too).\n\n-------------------------------------------------\n          Date/Time | 2015-10-01 6:28:38 AM      \n       Elapsed Time | 1 hour 15 minutes          \n     Total Log Rows | 4,313,619                  \n       Skipped Rows | 15                         \n  Pre-Filtered Rows | 16,847                     \n             Events | 4,296,757                  \n        Impressions | 4,287,421                  \n Backup Impressions | 4,000                      \n             Clicks | 5,309 (0.12%)              \n      Backup Clicks | 27 (0.00062%)              \n       Unique Users | 1,239,502                  \n      Flagged Users | 1,651                      \n      Ignored Users | 1,025,910                  \n        Other Users | 211,941                    \n     Flagged Events | 6,575 (0.15%)              \nFlagged Impressions | 6,327 (0.14%)              \n     Flagged Clicks | 241 (4.53%)                \n       Memory Usage | 7.38 GB                    \n-------------------------------------------------</pre>",
				caption: ""
			};
			
			switch (job.params.action) {
				case 'Success':
					logger.debug(9, "Simulating a successful response");
					stream.write({
						complete: 1,
						code: 0,
						description: "Success!",
						perf: perf.summarize(),
						table: table,
						html: html
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
			// burn up some CPU so we show up on the chart
			if (job.params.burn) {
				var temp = Tools.timeNow();
				while (Tools.timeNow() - temp < 0.10) {
					var x = Math.PI * 32768 / 100.3473847384 * Math.random();
				}
			}
		}
		
	}, 150 );
	
} );
