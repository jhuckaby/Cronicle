# Overview

This module is a component for use in [pixl-server](https://www.npmjs.com/package/pixl-server).  It implements a simple JSON REST API framework, and is built atop the [pixl-server-web](https://www.npmjs.com/package/pixl-server-web) component.  You can use this to define your own API methods or API classes, which are invoked based on a URL pattern such as `/api/NAME` or `/api/CLASS/NAME`.  The base URI is configurable.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
	npm install pixl-server pixl-server-web pixl-server-api
```

Here is a simple usage example.  Note that the component's official name is `API`, so that is what you should use for the configuration key, and for gaining access to the component via your server object.

```javascript
	var PixlServer = require('pixl-server');
	var server = new PixlServer({
		
		__name: 'MyServer',
		__version: "1.0",
		
		config: {
			"log_dir": "/var/log",
			"debug_level": 9,
			
			"WebServer": {
				"http_port": 80,
				"http_htdocs_dir": "/var/www/html"
			},
			
			"API": {
				"base_uri": "/api"
			}
		},
		
		components: [
			require('pixl-server-web'),
			require('pixl-server-api')
		]
		
	});
	
	server.startup( function() {
		// server startup complete
		
		server.API.addHandler( 'add_user', function(args, callback) {
			// custom request handler for our API
			callback({
				code: 0,
				description: "Success!"
			});
		} );
	} );
```

Notice how we are loading the [pixl-server](https://www.npmjs.com/package/pixl-server) parent module, and then specifying [pixl-server-web](https://www.npmjs.com/package/pixl-server-web) and [pixl-server-api](https://www.npmjs.com/package/pixl-server-api) as components:

```javascript
	components: [
		require('pixl-server-web'),
		require('pixl-server-api')
	]
```

This example demonstrates a very simple API service, which will answer to `/api/add_user` URIs, and sends back a serialized JSON response.

# Configuration

The configuration for this component is set by passing in a `API` key in the `config` element when constructing the `PixlServer` object, or, if a JSON configuration file is used, a `API` object at the outermost level of the file structure.  It can contain the following keys:

## base_uri

The `base_uri` property specifies the URL prefix that will activate the API service.  Basically, this means the API service will "listen" for incoming web server requests that begin with this URL.  The default value is `/api`, so API handlers are activated by `/api/HANDLER_NAME`.

# Adding API Handlers

To add an API handler, call the `addHandler()` method on the API component.  You can access the API component by the `API` property in the main server object.  Example:

```javascript
	server.API.addHandler( 'add_user', function(args, callback) {
		// custom request handler for our API
		callback({
			code: 0,
			description: "Success!"
		});
	} );
```

Your handler method is passed an `args` object containing information about the request.  See the [pixl-server-web's args](https://www.npmjs.com/package/pixl-server-web#args) documentation for details.  The second argument to your handler function is a callback.

After your API method is complete, invoke the `callback` function.  Pass it an object, which will be serialized to JSON and sent back to the client.  It is up to you how to handle errors, but the standard way is to include a `code` property, set to `0` for success, and any other value for error.  Pass the error message in a `description` property, which can be omitted on success.

The data passed to the callback function is sent directly to the web server, which actually accepts several formats.  See [Sending Responses](https://www.npmjs.com/package/pixl-server-web#sending-responses) for details on how to send custom HTTP responses.

# Adding API Namespaces

You can actually add an entire class as an API "namespace".  This means, incoming URLs will be matched against the namespace, and then a method name in the provided class.  To do this, call the `addNamespace()` method on the API component, and pass in a namespace string, a function name prefix, and an object on which to invoke methods.  Example:

```javascript
	server.API.addNamespace( "user", "api_", obj );
```

This declares a namespace for `user`. So then, a URL such as `/api/user/add` would call the `api_add()` method on the provided `obj`.

Another way to use this is to develop your own server component, and pass the component itself as the namespace object.  For example, this implements an API into the [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) component for putting and getting keys:

```javascript
	var Class = require("pixl-class");
	var Component = require("pixl-server/component");
	
	module.exports = Class.create({
		__name: 'MyStorageAPI',
		__parent: Component,
		
		startup: function(callback) {
			this.storage = this.server.Storage;
			this.server.API.addNamespace( "storage", "api_", this );
			callback();
		},
		
		api_set: function(args, callback) {
			// set key in storage
			this.storage.put( args.query.key, args.query, function(err) {
				if (err) callback({ code: 1, description: err.message });
				else callback({ code: 0 });
			} );
		},
		
		api_get: function(args, callback) {
			// get key from storage
			this.storage.get( args.query.key, function(err, data) {
				if (err) callback({ code: 1, description: err.message });
				else callback({ code: 0, data: data });
			} );
		}
	});
```

See the [Component Development](https://www.npmjs.com/package/pixl-server#component-development) section in the [pixl-server](https://www.npmjs.com/package/pixl-server) docs for more details on developing server components.

# License

The MIT License (MIT)

Copyright (c) 2015 - 2016 Joseph Huckaby.

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
