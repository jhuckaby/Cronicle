# Overview

This module provides a simple interface to your application's JSON configuration file on disk.  It will load and parse the file, and can automatically reload it when it changes (and emit an event when this happens).  Command-line arguments are automatically merged in with your config (uses [pixl-args](https://www.npmjs.com/package/pixl-args)), and treated as overrides.  The library also provides an easy way to determine the server's hostname and local IP address.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-config
```

Then use `require()` to load it in your code:

```javascript
var Config = require('pixl-config');
```

To use the module, instantiate an object:

```javascript
var config = new Config('conf/config.json');
```

If there is an error loading or parsing the file, an exception will be thrown, so you might want to wrap it in a try/catch.

Upon success, you can access your configuration keys/values using the `get()` method:

```javascript
var verbose = config.get('verbose');
var debug = config.get('debug');
```

If you just want a hash of the entire config file, call `get()` without passing a key:

```javascript
var opts = config.get();
if (opts.verbose) console.log("Verbose option is set.");
if (opts.debug) console.log("Debug option is set.");
```

You can also set values by calling `set()` and passing both a key and a value.  Example:

```javascript
config.set('verbose', true);
```

Values you set manually are persisted as long as the Node process is alive, even if the configuration file is reloaded on disk.

## Command-line Arguments

Command-line arguments (from [process.argv](http://nodejs.org/docs/latest/api/process.html#process_process_argv)) are automatically parsed and merged in with your configuration, and treated as overrides.  Only `--key value --key value` style arguments are processed.

Please see the [pixl-args](https://www.npmjs.com/package/pixl-args) module for more details.

## Live File Reloading

If you want the library to monitor your configuration file for live changes and automatically reload it, pass `true` as a second argument to the constructor:

```javascript
var config = new Config('conf/config.json', true);
```

This uses polling, and by default it checks the file for changes every 10 seconds.  The library then reloads the configuration and fires off an event you can listen for:

```javascript
var config = new Config('conf/config.json', true);

config.on('reload', function() {
	console.log("My app's config was reloaded!");
	console.log("Verbose = " + config.get('verbose'));
} );
```

If there is an error reloading the configuration, an `error` event is emitted (no exception is thrown).

To set the polling frequency, pass in the desired number of milliseconds instead of `true` as the second argument.  For example, to check every five seconds pass in `5000`:

```js
var config = new Config('conf/config.json', 5000);
```

To stop monitoring (for example during your app's shutdown sequence) call the `stop()` method.

If you would prefer to control exactly when to check for changes, do not enable live monitoring, and instead simply call the `check()` method at any frequency you want.

## Server Environment

The library also provides a utility method for determining the server's hostname and IP address (IPv4).  These things may require asynchronous operations, so you must specify a callback function.  Upon completion, the hostname will be accessible via `config.hostname` and the IP address in `config.ip` (IPv4 dot-delimited string).  Example:

```javascript
config.getEnv( function() {
	console.log("The server hostname is: " + config.hostname);
	console.log("The server IP is: " + config.ip);
} );
```

# License

Copyright (c) 2015 - 2018 Joseph Huckaby

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
