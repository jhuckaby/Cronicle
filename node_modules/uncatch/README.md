## Overview

**Uncatch** is a cooperative uncaught exception manager, which allows multiple modules to register listeners for uncaught exceptions, and *all of them will be executed* before the process finally exits.  The module also handles emitting the error and stack trace to STDERR.

### Why

The reason for this module is that Node.js behaves differently when you register an [uncaught exception handler](https://nodejs.org/api/process.html#process_event_uncaughtexception).  If any listeners are defined for this global event, then the stack trace is no longer emitted to the console, and the process does not exit.  It is up to your listener code to handle both operations.  This is bad because multiple modules may all want to execute their own emergency shutdown / cleanup code, especially in larger applications, but if any of them were to call `process.exit()` ([as they should](https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly)) then not all the listeners get a chance to execute.

Uncatch solves this problem by offering its own global [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) upon which multiple modules may all register listeners.  Uncatch then registers a single global uncaught exception handler and fires its own `uncaughtException` event, executing **all** of its listeners before finally emitting the error and stack trace to STDERR, and calling `process.exit(1)`.

All modules in your application have to agree to use Uncatch for this to really work.  If any module in your stack registers a global uncaught exception handler and calls `process.exit()` then all bets are off.

### Use Case

Imagine a modular Node.js daemon application that spawns and manages child processes.  If the root daemon suffers an uncaught exception, it should kill off its children as it goes down.  This is fine, but what happens when it adds a global uncaught exception handler?  That handler needs to call `process.exit()` as per [best practices](https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly), but then no other modules can do anything.  For example, the application may have another module that *also* needs to perform shutdown operations, like logging the exception to a crash log, etc.

If your application can manage this from a single global uncaught exception handler, then you probably don't need Uncatch.  But if you have a modular application where multiple separate modules all need to cooperate to run multiple shutdown operations, with a single exit at the very end, then Uncatch may be for you.

### Related Modules

What about the [uncaught](https://www.npmjs.com/package/uncaught) module?  This module came close to what I needed, but it doesn't emit the error and stack trace to STDERR, and it doesn't call `process.exit()` after all its listeners execute.

What about the [uncaught-exception](https://www.npmjs.com/package/uncaught-exception) module?  It has weird requirements, seems to be built around statsd, its usage is confusing, and the README says things like "v0.10 only".  It rubbed me the wrong way.

What about the [exception](https://www.npmjs.com/package/exception) module?  This module is rather nifty, but it doesn't solve the problem where multiple modules all need to run uncaught exception code.  Also, it has native module requirements (like [heapdump](https://www.npmjs.com/package/heapdump)).

## Usage

Download via [npm](https://www.npmjs.com/):

```
npm install uncatch --save
```

Use it in your modules like this:

```js
var Uncatch = require('uncatch');

Uncatch.on('uncaughtException', function(err) {
	// execute your own application shutdown routine here
	// do not call any async code, and do not call process.exit
});

//
// ...in some other module...
//

var Uncatch = require('uncatch');

Uncatch.on('uncaughtException', function(err) {
	// this code will ALSO run!
});
```

You do not have to call `process.exit()` as Uncatch will do it for you, once *all* the event listeners are executed.  If you need to log the crash, use synchronous filesystem operations like [fs.appendFileSync()](https://nodejs.org/api/fs.html#fs_fs_appendfilesync_file_data_options).  Nothing async will execute.  It's sync or die during a crash.

## Custom Exit Code

By default Uncatch calls `process.exit(1)` which signals an unclean exit to whatever calling process or shell spawned your Node.js app.  You can change this exit code by setting `Uncatch.exitCode`.  You can even do this from inside an uncaught exception listener.  Example:

```js
Uncatch.on('uncaughtException', function(err) {
	// change exit code
	Uncatch.exitCode = 65;
});
```

Please note that the latter prevails here.  If multiple modules all fight to customize the `exitCode` then whichever one did it last is the winner.

## Environment Variables

Uncatch recognizes the following environment variables if set to any true value:

| Variable | Description |
|----------|-------------|
| `NO_UNCATCH` | If set, do not register an uncaught exception handler. |
| `NO_UNERROR` | If set, do not emit the error and stack trace to STDERR. |
| `NO_UNEXIT` | If set, do not call `process.exit()`.  **WARNING:** Don't do this.  [Here's why](https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly). |

For example, to temporarily disable Uncatch, run your app thusly:

```
NO_UNCATCH=1 node your-app.js
```

## License

The MIT License (MIT)

Copyright (c) 2017 Joseph Huckaby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
