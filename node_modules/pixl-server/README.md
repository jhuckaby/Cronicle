# Overview

This module is a generic server daemon framework, which supports a component plug-in system.  It can be used as a basis to create custom daemons such as web app backends.  It provides basic services such as configuration file loading, command-line argument parsing, logging, and more.  Component plug-ins can be created by you, or you can use some pre-made ones.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-server
```

Then use `require()` to load it in your code:

```javascript
var PixlServer = require('pixl-server');
```

Then instantiate a server object and start it up:

```javascript
var server = new PixlServer({
	
	__name: 'MyServer',
	__version: "1.0",
	
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www"
	},
	
	components: []
	
});
server.startup( function() {
	// startup complete
} );
```

Of course, this example won't actually do anything useful, because the server has no components.  Let's add a web server component to our server, just to show how it works:

```javascript
var PixlServer = require('pixl-server');

var server = new PixlServer({
	
	__name: 'MyServer',
	__version: "1.0",
	
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www",
		
		"WebServer": {
			"http_port": 80,
			"http_htdocs_dir": "/var/www/html"
		}
	},
	
	components: [
		require('pixl-server-web')
	]
	
});
server.startup( function() {
	// startup complete
} );
```

This example uses the [pixl-server-web](https://www.npmjs.com/package/pixl-server-web) component to turn our server into a web (HTTP) server.  It will listen on port 80 and serve static files in the `/var/www/html` folder.

As you can see we're loading the `pixl-server-web` module by calling `require()` into the `components` array when creating our server object:

```javascript
components: [
	require('pixl-server-web')
]
```

To include additional components, simply add them to this array.  Please note that the order matters here.  Components that rely on WebServer, for example, should be listed after it.

Also, notice in the above example we added a new section to our existing `config` object, and named it `WebServer` (must match the component exactly).  In there we're setting a couple of new keys, which are specifically for that component:

```javascript
"WebServer": {
	"http_port": 80,
	"http_htdocs_dir": "/var/www/html"
}
```

Each component has its own section in the configuration file (or hash).  For more details on the WebServer configuration, see the [module documentation](https://www.npmjs.com/package/pixl-server-web).

# Components

Components make up the actual server functionality, and can be things like a web (HTTP) server, a SocketIO server, a back-end storage system, or a multi-server cluster manager.  A server may load multiple components (and some rely on each other).

A component typically starts some sort of listener (network socket listener, etc.) or simply exposes an API for other components or your code to use directly.

## Stock Components

As of this writing, the following stock server components are available via [npm](https://www.npmjs.com/):

### WebServer (pixl-server-web)

The WebServer ([pixl-server-web](https://www.npmjs.com/package/pixl-server-web)) component implements a full web (HTTP) server.  It supports HTTP and/or HTTPS, static file hosting, custom headers, as well as a hook system for routing specific URIs to your own handlers.

For more details, check it out on npm: [pixl-server-web](https://www.npmjs.com/package/pixl-server-web)

### PoolManager (pixl-server-pool)

The PoolManager ([pixl-server-pool](https://www.npmjs.com/package/pixl-server-pool)) component can delegate web requests to a pool of worker child processes.  This can be useful for CPU-hard operations such as image transformations, which would otherwise block the main thread.

For more details, check it out on npm: [pixl-server-pool](https://www.npmjs.com/package/pixl-server-pool)

### JSON API (pixl-server-api)

The API ([pixl-server-api](https://www.npmjs.com/package/pixl-server-api)) component provides a JSON REST API for your application.  It sits on top of (and relies on) the WebServer ([pixl-server-web](https://www.npmjs.com/package/pixl-server-web)) component.

For more details, check it out on npm: [pixl-server-api](https://www.npmjs.com/package/pixl-server-api)

### UserManager (pixl-server-user)

The UserManager ([pixl-server-user](https://www.npmjs.com/package/pixl-server-user)) component provides a full user login and user / session management system for your application.  Users can create accounts, login, update information, and logout.  It relies on the API ([pixl-server-api](https://www.npmjs.com/package/pixl-server-api)) component, as well as the Storage ([pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage)) component.

For more details, check it out on npm: [pixl-server-user](https://www.npmjs.com/package/pixl-server-user)

### Storage (pixl-server-storage)

The Storage ([pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage)) component provides an internal API for other components to store data on disk (or to the cloud).  It supports local disk storage, as well as Amazon S3.  One of its unique features is a high performance, double-ended linked list, built on top of a key/value store.  This is useful for web apps to store infinitely-sized lists of data.

For more details, check it out on npm: [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage)

### MultiServer (pixl-server-multi)

The MultiServer ([pixl-server-multi](https://www.npmjs.com/package/pixl-server-multi)) component automatically manages a cluster of servers on the same network.  They auto-detect each other using UDP broadcast packets.  One server is flagged as the "master" node at all times, while the rest are "slaves".  If the master server goes down, one of the slaves will automatically take over.  An API is provided to get the list of server hostnames in the cluster, and it also emits events so your code can react to becoming master, etc.

For more details, check it out on npm: [pixl-server-multi](https://www.npmjs.com/package/pixl-server-multi)

# Events

The following events are emitted by the server.

## prestart

The `prestart` event is fired during server initialization.  The server's configuration and logging systems are available, and components are initialized but not started.  Your callback is not passed any arguments.

## ready

The `ready` event is fired when the server and all components have completed startup.  Your callback is not passed any arguments.

## shutdown

The `shutdown` event is fired when the server and all components have shutdown, and Node is about to exit.  Your callback is not passed any arguments.

## Maintenance Events

These events are emitted periodically, and can be used to schedule time-based events such as hourly log rotation, daily storage cleanup, etc.  Unless otherwise noted, your callback will be passed an object representing the current local date and time, as returned from [getDateArgs()](https://www.npmjs.com/package/pixl-tools#getdateargs).

### tick

This event is fired approximately once every second, but is not guaranteed to be fired *on* the second.  It is more for things like general heartbeat tasks (check for status of running jobs, etc.).  Your callback is not passed any arguments.

### minute

This event is fired every minute, on the minute.  Example:

```javascript
server.on('minute', function(args) {
	// Do something every minute
});
```

#### :MM

Also fired every minute, this event name will contain the actual minute number (two-digit padded from `00` to `59`), so you can schedule hourly jobs that run at a particular minute.  Don't forget the colon (:) prefix.  Example:

```javascript
server.on(':15', function(args) {
	// This will run on the :15 of the hour, every hour
});
```

#### HH:MM

Also fired every minute, this event name will contain both the hour digits (from `00` to `23`) and the minute (from `00` to `59`), so you can schedule daily jobs that run at a particular time.  Example:

```javascript
server.on('04:30', function(args) {
	// This will run once at 4:30 AM, every day
});
```

### hour

This event is fired every hour, on the hour.  Example:

```javascript
server.on('hour', function(args) {
	// Do something every hour
});
```

### day

This event is fired every day at midnight.  Example:

```javascript
server.on('day', function(args) {
	// Do something every day at midnight
});
```

### month

This event is fired at midnight when the month changes.  Example:

```javascript
server.on('month', function(args) {
	// Do something every month
});
```

### year

This event is fired at midnight when the year changes.  Example:

```javascript
server.on('year', function(args) {
	// Do something every year
});
```

# Configuration

The server configuration consists of a set of global, top-level keys, and then each component has its own sub-section keyed by its name.  The configuration can be specified as an inline JSON object to the constructor in the `config` property like this:

```javascript
{
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www"
	}
}
```

Or it can be saved in JSON file, and specified using the `configFile` property like this:

```javascript
{
	configFile: "conf/config.json"
}
```

Here are the global configuration keys:

| Config Key | Default Value | Description |
|------------|---------------|-------------|
| `debug` | `false` | When set to `true`, will run directly on the console without forking a daemon process. |
| `echo` | `false` | When set to `true` and combined with `debug`, will echo all log output to the console. |
| `color` | `false` | When set to `true` and combined with `echo`, all log columns will be colored in the console. |
| `log_dir` | "." | Directory path where event log will be stored. |
| `log_filename` | "event.log" | Event log filename, joined with `log_dir`. |
| `log_columns` | [Array] | Custom event log columns, if desired (see [Logging](#logging) below). |
| `log_crashes` | `false` | When set to `true`, will log all uncaught exceptions to a `crash.log` file in the `log_dir` dir. |
| `uid` | `null` | If set and running as root, forked daemon process will attempt to switch to the specified user (numerical ID or a username string). |
| `debug_level` | `1` | Debug logging level, larger numbers are more verbose, 1 is quietest, 10 is loudest. |

Remember that each component should have its own configuration key.  Here is an example server configuration, including the `WebServer` component:

```javascript
{
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www",
		
		"WebServer": {
			"http_port": 80,
			"http_htdocs_dir": "/var/www/html"
		}
	}
}
```

Consult the documentation for each component you use to see which keys they require.

## Command-Line Arguments

You can specify command-line arguments when launching your server.  If these are in the form of `--key value` they will override any global configuration keys with matching names.  For example, you can launch your server in debug mode and enable log echo like this:

```
node my-script.js --debug 1 --echo 1
```

Actually, you can set a configuration key to boolean `true` simply by including it without a value, so this works too:

```
node my-script.js --debug --echo
```

# Logging

The server keeps an event log using the [pixl-logger](https://www.npmjs.com/package/pixl-logger) module.  This is a combination of a debug log, error log and transaction log, with a `category` column denoting the type of log entry.  By default, the log columns are defined as:

```javascript
['hires_epoch', 'date', 'hostname', 'component', 'category', 'code', 'msg', 'data']
```

However, you can override these and provide your own array of log columns by specifying a `log_columns` configuration key.

Here is an example debug log snippet:

```
[1432581882.204][2015-05-25 12:24:42][joeretina-2.local][][debug][1][MyServer v1.0 Starting Up][]
[1432581882.207][2015-05-25 12:24:42][joeretina-2.local][][debug][2][Configuration][{"log_dir":"/Users/jhuckaby/temp","debug_level":9,"WebServer":{"http_port":3012,"http_htdocs_dir":"/Users/jhuckaby/temp"},"debug":true,"echo":true}]
[1432581882.208][2015-05-25 12:24:42][joeretina-2.local][][debug][2][Server IP: 10.1.10.17, Daemon PID: 26801][]
[1432581882.208][2015-05-25 12:24:42][joeretina-2.local][][debug][3][Starting component: WebServer][]
[1432581882.209][2015-05-25 12:24:42][joeretina-2.local][WebServer][debug][2][Starting HTTP server on port: 3012][]
[1432581882.218][2015-05-25 12:24:42][joeretina-2.local][][debug][2][Startup complete, entering main loop][]
```

For debug log entries, the `category` column is set to `debug`, and the `code` columns is used as the debug level.  The server object (and your component object) has methods for logging debug messages, errors and transactions:

```javascript
server.logDebug( 9, "This would be logged at level 9 or higher." );
server.logError( 1005, "Error message for code 1005 here." );
server.logTransaction( 99.99, "Description of transaction here." );
```

These three methods all accept two required arguments, and an optional 3rd "data" object, which is serialized and logged into its own column if provided.  For the debug log, the first argument is the debug level.  Otherwise, it is considered a "code" (can be used however your app wants).

When you call `logDebug()`, `logError()` or `logTransaction()` on your component object, the `component` column will be set to the component name.  Otherwise, it will be blank (including when the server logs its own debug messages).

If you need low-level, direct access to the [pixl-logger](https://www.npmjs.com/package/pixl-logger) object, you can call it by accessing the `logger` property of the server object or your component class.  Example:

```javascript
server.logger.print({ 
	category: 'custom', 
	code: 'custom code', 
	msg: "Custom message here", 
	data: { text: "Will be serialized to JSON" } 
});
```

The server and component classes have a utility method named `debugLevel()`, which accepts a log level integer, and will return `true` if the current debug log level is high enough to emit something at the specified level, or `false` if it would be silenced.

# Component Development

To develop your own component, create a class that inherits from the `pixl-server/component` base class.  It is recommended you use the [pixl-class](https://www.npmjs.com/package/pixl-class) module for this.  Set your `__name` property to a unique, alphanumeric name, which will be your Component ID.  This is how other components can reference yours from the `server` object, and this is the key used for your component's configuration as well.

Here is a simple component example:

```javascript
var Class = require("pixl-class");
var Component = require("pixl-server/component");

module.exports = Class.create({
	
	__name: 'MyComponent',
	__parent: Component,
	
	startup: function(callback) {
		this.logDebug(1, "My component is starting up!");
		callback();
	},
	
	shutdown: function(callback) {
		this.logDebug(1, "My component is shutting down!");
		callback();
	}
	
});
```

Now, assuming you saved this class as `my_component.js`, you would load it in a server by adding it to the `components` array like this:

```javascript
components: [
	require('pixl-server-web'),
	require('./my_component.js')
]
```

This would load the [pixl-server-web](https://www.npmjs.com/package/pixl-server-web) component first, followed by your `my_component.js` component after it.  Remember that the load order is important, if you have a component that relies on another.

Your component's configuration would be keyed off the value in your `__name` property, like this:

```javascript
{
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		"uid": "www",
		
		"WebServer": {
			"http_port": 80,
			"http_htdocs_dir": "/var/www/html"
		},
		
		"MyComponent": {
			"key1": "Value 1",
			"key2": "Value 2"
		}
	}
}
```

If you want to specify default configuration keys (in case they are missing from the server configuration for your component), you can define a `defaultConfig` property in your class, like this:

```javascript
module.exports = Class.create({
	__name: 'MyComponent',
	__parent: Component,
	
	defaultConfig: {
		"key1": "Default Value 1",
		"key2": "Default Value 2"
	}
});
```

## Startup and Shutdown

Your component should at least provide `startup()` and `shutdown()` methods.  These are both async methods, which should invoke the provided callback function when they are complete.  Example:

```javascript
{
	startup: function(callback) {
		this.logDebug(1, "My component is starting up!");
		callback();
	},
	
	shutdown: function(callback) {
		this.logDebug(1, "My component is shutting down!");
		callback();
	}
}
```

As with all Node.js callbacks, if something goes wrong and you want to abort the startup or shutdown routines, pass an `Error` object to the callback method.

## Accessing Your Configuration

Your configuration object is always accessible via `this.config`.  Note that this is an instance of [pixl-config](https://www.npmjs.com/package/pixl-config), so you need to call `get()` on it to fetch individual configuration keys, or you can fetch the entire object by calling it without an argument:

```javascript
{
	startup: function(callback) {
		this.logDebug(1, "My component is starting up!");
		
		// access our component configuration
		var key1 = this.config.get('key1');
		var entire_config = this.config.get();
		
		callback();
	}
}
```

If the server configuration is live-reloaded due to a changed file, your component's `config` object will emit a `reload` event, which you can listen for.

## Accessing The Root Server

Your component can always access the root server object via `this.server`.  Example:

```javascript
{
	startup: function(callback) {
		this.logDebug(1, "My component is starting up!");
		
		// access the main server configuration
		var server_uid = this.server.config.get('uid');
		
		callback();
	}
}
```

## Accessing Other Components

Other components are accessible via `this.server.COMPONENT_NAME`.  Please be aware of the component load order, as components listed below yours in the server `components` array won't be fully loaded when your `startup()` method is called.  Example:

```javascript
{
	startup: function(callback) {
		this.logDebug(1, "My component is starting up!");
		
		// access the WebServer component
		this.server.WebServer.addURIHandler( '/my/custom/uri', 'Custom Name', function(args, callback) {
			// custom request handler for our URI
			callback( 
				"200 OK", 
				{ 'Content-Type': "text/html" }, 
				"Hello this is custom content!\n" 
			);
		} );
		
		callback();
	}
}
```

## Accessing The Server Log

Your component's base class has convenience methods for logging debug messages, errors and transactions via the `logDebug()`, `logError()` and `logTransaction()` methods, respectively.  These log messages will all be tagged with your component name, to differentiate them from other components and generic server messages.  Example:

```javascript
this.logDebug( 9, "This would be logged at level 9 or higher." );
this.logError( 1005, "Error message for code 1005 here." );
this.logTransaction( 99.99, "Description of transaction here." );
```

If you need low-level, direct access to the [pixl-logger](https://www.npmjs.com/package/pixl-logger) object, you can call it by accessing the `logger` property of your component class.  Example:

```javascript
this.logger.print({ 
	category: 'custom', 
	code: 'custom code', 
	msg: "Custom message here", 
	data: { text: "Will be serialized to JSON" } 
});
```

# Uncaught Exceptions

When the `log_crashes` feature is enabled, the [uncatch](https://www.npmjs.com/package/uncatch) module is used to manage uncaught exceptions.  The server registers a listener to log crashes, but you can also add your own listener to perform emergency shutdown procedures in the event of a crash (uncaught exception).

The idea with [uncatch](https://www.npmjs.com/package/uncatch) is that multiple modules can all register listeners, and that includes your application code.  Example:

```js
require('uncatch').on('uncaughtException', function(err) {
	// run your own sync shutdown code here
	// do not call process.exit
});
```

On an uncaught exception, this code would run *in addition to* the server logging the exception to the crash log.  Uncatch then emits the error and stack trace to STDERR and calls `process.exit(1)` after all listeners have executed.

# License

The MIT License (MIT)

Copyright (c) 2015 - 2018 Joseph Huckaby.

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
