// JSON Buffer Stream
// Handles buffering JSON records over standard streams (pipes or sockets)
//
// Assumes one entire JSON document per line, delimited by EOL.
// Emits 'json' event for each JSON document received.
// write() method accepts object to be JSON-stringified and written to stream.
// Passes errors thru on 'error' event (with addition of JSON parse errors).
//
// Copyright (c) 2014 - 2016 Joseph Huckaby
// Released under the MIT License

var os = require('os');
var Class = require("pixl-class");

module.exports = Class.create({
	
	streamIn: null,
	streamOut: null,
	buffer: '',
	perf: null,
	recordRegExp: /^\s*\{/,
	EOL: os.EOL,
	
	__construct: function(stream_in, stream_out) {
		// class constructor
		if (!stream_out) stream_out = stream_in;
		
		this.streamIn = stream_in;
		this.streamOut = stream_out;
		
		this.init();
	},
	
	setPerf: function(perf) { this.perf = perf; },
	
	init: function() {
		// hook stream read
		var self = this;
		
		this.streamIn.setEncoding('utf8');
		this.streamIn.on('data', function(data) {
			if (self.buffer) {
				data = self.buffer + data;
				self.buffer = '';
			}
			
			var records = data.split( self.EOL );
			
			// see if data ends on EOL -- if not, we have a partial block
			// fill buffer for next read
			if (data.substring(data.length - self.EOL.length) != self.EOL) {
				self.buffer = records.pop();
			}
			
			var record = '';
			var json = null;
			
			for (var idx = 0, len = records.length; idx < len; idx++) {
				record = records[idx];
				if (record.match(self.recordRegExp)) {
					json = null;
					
					if (self.perf) self.perf.begin('json_parse');
					try { json = JSON.parse(record); }
					catch (e) {
						self.emit('error', new Error("JSON Parse Error: " + e.message), record);
					}
					if (self.perf) self.perf.end('json_parse');
					
					if (json) {
						self.emit('json', json);
					}
				} // record has json
				else if (record.length && record.match(/\S/)) {
					// non-json garbage, emit just in case app cares
					self.emit('text', record + self.EOL);
				}
			} // foreach record
			
		} );
		
		// catch errors on both streams
		if (this.streamOut != this.streamIn) {
			// separate streams
			this.streamIn.on('error', function(err) {
				self.emit('error', "Error in input stream: " + err.message);
			} );
			this.streamOut.on('error', function(err) {
				self.emit('error', "Error in output stream: " + err.message);
			} );
		}
		else {
			// bi-directional stream
			this.streamIn.on('error', function(err) {
				self.emit('error', err);
			} );
		}
		
		// catch end of stream
		this.streamIn.on('end', function() {
			self.emit('end');
		} );
	},
	
	write: function(json, callback) {
		// write json data to stream plus EOL
		if (this.perf) this.perf.begin('json_compose');
		var data = JSON.stringify(json);
		if (this.perf) this.perf.end('json_compose');
		
		this.streamOut.write( data + this.EOL, callback );
	}
	
});
