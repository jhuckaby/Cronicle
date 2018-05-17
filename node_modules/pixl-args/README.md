# Overview

This module provides a simple interface to the command-line arguments used to instantiate Node.  It parses key/value arguments in the form `--key value --key value`.  Any number of dashes are acceptable.  The library then provides a `get()` method to get individual values, or everything as one hash table.  Multiple keys with the same name are pushed onto an array.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-args
```

Then use `require()` to load it in your code:

```javascript
var Args = require('pixl-args');
```

To use the module, instantiate an object:

```javascript
var args = new Args();
```

This will, by default, parse all the Node command-line args used to instantiate your script.  They are then accessible by calling `get()` on your `args` object, passing in the key you are interested in.  So, imagine if your script was invoked on the CLI thusly:

```
node your-script.js --verbose 1 --debug 0
```

You could then access the command-line arguments like this:

```javascript
var verbose = args.get('verbose');
var debug = args.get('debug');
```

If you just want a hash of all the arguments, call `get()` without passing a key:

```javascript
var opts = args.get();
if (opts.verbose) console.log("Verbose flag is set.");
if (opts.debug) console.log("Debug flag is set.");
```

## Default Args

You can pass in a hash of default arguments to the class constructor.  The command-line will override these, or add new ones.  Example:

```javascript
var args = new Args( {
	verbose: 0,
	debug: 0
} );
```

## Valueless Args

Arguments without an explicit value are set to Boolean `true`.  Example:

```
node your-script.js --verbose --debug
```

Then calling `get()`, this becomes:

```javascript
{
	"verbose": true,
	"debug": true
}
```

## String Handling

Strings are handled by the shell, so anything crazy like spaces and such should be wrapped in quotes and/or escaped properly.  The library doesn't do any special processing, and simply deals with what it gets.

```
node your-script.js --name "Joseph Huckaby" --city San\ Mateo
```

Then calling `get()`, this becomes:

```javascript
{
	"name": "Joseph Huckaby",
	"city": "San Mateo"
}
```

## Number Handling

Argument values which *appear to be numbers* are parsed as such.  This includes negative and positive base-10 integers and floats.  Everything else is considered to be a string.

```
node your-script.js --amount 50 --freq 0.5 --volume loud
```

Then calling `get()`, this becomes:

```javascript
{
	"amount": 50,
	"freq": 0.5,
	"volume": "loud"
}
```

## Duplicate Args

Duplicate arguments with the same name are converted into arrays, with the order preserved.  Example:

```
node your-script.js --action delete --key value1 --key value2
```

Then calling `get()`, this becomes:

```javascript
{
	"action": "delete",
	"key": [
		"value1",
		"value2"
	]
}
```

## Custom Input Args

The class constructor accepts an optional list of arguments to parse, which defaults to [process.argv](http://nodejs.org/docs/latest/api/process.html#process_process_argv), but can be any array you give it.  Example:

```javascript
var args = new Args( ["--verbose", "1", "--debug", "0"] );
```

To combine this with the default arguments feature, pass the list of arguments array first, and the default arguments hash second.

## Other Args

Any command-line arguments that don't follow the `--key value` pattern, meaning those located before your keyed arguments start, are appended to an `other` array.  Example:

```
node your-script.js file1.txt file2.txt --action delete --key value1 --key value2
```

Then calling `get()`, this becomes:

```javascript
{
	"action": "delete",
	"key": [
		"value1",
		"value2"
	],
	"other": [
		"file1.txt",
		"file2.txt"
	]
}
```

You can place your "other" args at the beginning or at the end of the keyed arguments.  However, for the latter just beware of using a [Valueless Arg](#valueless-args) as the final keyed argument.

# License

The MIT License

Copyright (c) 2015, 2016 Joseph Huckaby

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
