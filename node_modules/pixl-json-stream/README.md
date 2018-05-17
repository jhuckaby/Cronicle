# Overview

This module provides a convenient way to send/receive complex data objects over streams (pipes and sockets).  It does this by transparently serializing the data to JSON, and parsing it on the other side, emitting a `json` event to your code whenever it has a complete JSON message.

The library handles all buffering for you, and so it will only emit one `json` event for each completed JSON document, pre-parsed into a data object for your callback.  And for sending data, you can pass it a complex object, which will be auto-serialized and streamed over the pipe or socket.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-json-stream
```

Then use `require()` to load it in your code:

```javascript
var JSONStream = require('pixl-json-stream');
```

To use the module, instantiate an object, and attach it to a stream:

```javascript
var stream = new JSONStream( read_stream, write_stream );
```

Things like network sockets are both read and write, so you only need to pass in one argument for those:

```javascript
var stream = new JSONStream( socket_handle );
```

You can then add a listener for the `json` event to receive a fully parsed JSON document, or call `write()` to send one.  Example:

```javascript
stream.on('json', function(data) {
	console.log("Got data: ", data);
} );
stream.write({ action: "something", code: 1234 });
```

You will always receive pre-parsed JSON as a data object, and `write()` handles all serialization for you as well.  So you never have to call `JSON.parse()` or `JSON.stringify()` directly.

## Use With Child Processes

Here is a more complete example, which attaches a read/write JSON stream to a child process, sets up a read listener, and writes to the child:

```javascript
var JSONStream = require('pixl-json-stream');

// spawn worker process
var child = require('child_process').spawn( 
	'node', ['my-worker.js'], 
	{ stdio: ['pipe', 'pipe', 'pipe'] }
);

// connect json stream to child's stdio
// (read from child.stdout, write to child.stdin)
var stream = new JSONStream( child.stdout, child.stdin );

stream.on('json', function(data) {
	// received data from child
	console.log("Got data from child: ", data);
} );

// write data to child
stream.write({
	action: 'update_user_record',
	username: 'jhuckaby',
	other: 12345
});

// close child's stdin so it can exit normally
child.stdin.end();
```

You can also use a JSON stream in the child process itself, to handle the other side of the pipe:

```javascript
var JSONStream = require('pixl-json-stream');

var stream = new JSONStream( process.stdin, process.stdout );
stream.on('json', function(data) {
	// got data from parent, send something back
	stream.write({ code: 0, description: "Success from child" });
} );
```

## Use With Network Sockets

You can also use JSON streams over network sockets, providing an easy way to send structured data to/from your clients and servers.  For example, on the server side you could have:

```javascript
var server = require('net').createServer(function(socket) {
	// new connection, attach JSON stream handler
	var stream = new JSONStream(socket);
	
	stream.on('json', function(data) {
		// got gata from client
		console.log("Received data from client: ", data);
		
		// send response
		stream.write({ code: 1234, description: "We hear you" });
	} );
});
server.listen( 3012 );
```

And on the client side...

```javascript
var client = require('net').connect( {port: 3012}, function() {
	// connected to server, now use JSON stream to communicate
	var stream = new JSONStream( client );
	
	stream.on('json', function(data) {
		// got response back from server
		console.log("Received response from server: ", data);
	} );
	
	// send greetings
	stream.write({ code: 2345, description: "Hello from client!" });
} );
```

## End of Lines

By default, the library assumes each JSON record will be delimited by the current operating system's end-of-line character sequence ([os.EOL](https://nodejs.org/api/os.html#os_os_eol)), which is `\n` on Unix/Linux/OSX.  However, you can change this by setting the `EOL` string property on your class instance:

```js
var stream = new JSONStream( socket_handle );
stream.EOL = "\r\n"; // DOS line endings
```

# License

The MIT License

Copyright (c) 2014 - 2016 Joseph Huckaby

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
