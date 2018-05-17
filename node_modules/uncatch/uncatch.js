// Uncatch - Global uncaught exception handler
// Allows multiple modules to register listeners and they ALL will run.
// Calls process.exit(1) at the very end, all within the same thread.
// Copyright (c) 2017 Joseph Huckaby and PixlCore.com.  MIT License.

// ENV Vars:
//	NO_UNCATCH - Do not register listener for uncaughtException.
//	NO_UNERROR - Do not emit error to STDERR (silent mode).
//	NO_UNEXIT  - Do not call process.exit (BEWARE THIS).

const EventEmitter = require('events');
const Uncatch = new EventEmitter();

Uncatch.exitCode = 1;

module.exports = Uncatch;

if (!process.env.NO_UNCATCH) {
	process.on('uncaughtException', function(err) {
		Uncatch.emit('uncaughtException', err);
		if (!process.env.NO_UNERROR) console.error(err);
		if (!process.env.NO_UNEXIT) process.exit( Uncatch.exitCode );
	});
}
