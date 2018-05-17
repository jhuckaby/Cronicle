# Overview

This module contains a set of miscellaneous utility functions that don't fit into any particular category.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-tools
```

Then use `require()` to load it in your code:

```javascript
var Tools = require('pixl-tools');
```

Then call the function of your choice:

```javascript
var id = Tools.generateUniqueID();
```

# Function List

Here are all the functions included in the tools library, with links to full descriptions and examples:

| Function Name | Description |
|---------------|-------------|
| [timeNow()](#timenow) | Return the current time as Epoch seconds. |
| [generateUniqueID()](#generateuniqueid) | Generate a unique hexadecimal ID. |
| [digestHex()](#digesthex) | Digest a string using SHA-256 or MD5, return hexadecimal hash. |
| [numKeys()](#numkeys) | Returns the number of keys in an object. |
| [firstKey()](#firstkey) | Returns the "first" key in an object (undefined order). |
| [hashKeysToArray()](#hashkeystoarray) | Creates an array out of all object keys (undefined order). |
| [hashValuesToArray()](#hashvaluestoarray) | Creates an array out of all object values (undefined order). |
| [isaHash()](#isahash) | Determines if a variable is a hash (object) or not. |
| [isaArray()](#isaarray) | Determines if a variable is an array (or array-like) or not. |
| [copyHash()](#copyhash) | Makes a shallow or deep copy of an object. |
| [copyHashRemoveKeys()](#copyhashremovekeys) | Shallow copy an object, but omit selected keys. |
| [mergeHashes()](#mergehashes) | Non-destructive shallow merge of two objects, return the combined one. |
| [mergeHashInto()](#mergehashinto) | Merge one hash into another (destructive). |
| [parseQueryString()](#parsequerystring) | Parse a URL query string into key/value pairs. |
| [composeQueryString()](#composequerystring) | Compose a URL query string given an object of key/value pairs. |
| [findObjectsIdx()](#findobjectsidx) | Locate object indexes in an array matching a set of criteria. |
| [findObjectIdx()](#findobjectidx) | Locate first object index in an array matching a set of criteria. |
| [findObject()](#findobject) | Locate and return first object in an array matching a set of criteria. |
| [findObjects()](#findobjects) | Locate and return all objects in an array matching a set of criteria. |
| [deleteObject()](#deleteobject) | Find and delete an object in an array matching a set of criteria. |
| [deleteObjects()](#deleteobjects) | Find and delete all objects in an array matching a set of criteria. |
| [alwaysArray()](#alwaysarray) | Wrap variable in array, unless it is already an array. |
| [lookupPath()](#lookuppath) | Perform a `/filesystem/path/style` lookup in an object tree. |
| [substitute()](#substitute) | Perform placeholder substitution in a string using square brackets. |
| [getDateArgs()](#getdateargs) | Parse a date into year, month, day, hour, min, sec, and more. |
| [getTimeFromArgs()](#gettimefromargs) | Recalculate Epoch seconds given object from [getDateArgs()](#getdateargs). |
| [normalizeTime()](#normalizetime) | Normalize (floor) Epoch seconds into nearest minute, hour, day, etc. |
| [getTextFromBytes()](#gettextfrombytes) | Convert a byte count into a human readable string, e.g. `5 MB`. |
| [getBytesFromText()](#getbytesfromtext) | Convert a human-readable size (e.g. `5 MB`) into a raw byte count. |
| [commify()](#commify) | Apply commas to a positive integer using US-style formatting, e.g. `1,000,000`. |
| [shortFloat()](#shortfloat) | Trim floating point decimal to 2-digit precision, unless digits are zeros. |
| [pct()](#pct) | Return percentage string given arbitrary value and a maximum limit, e.g. '55%'. |
| [zeroPad()](#zeropad) | Pad an integer with zeros on the left side, up to a specified max. |
| [getTextFromSeconds()](#gettextfromseconds) | Convert a number of seconds into a human-readable string, e.g. `3 hours`. |
| [getSecondsFromText()](#getsecondsfromtext) | Convert a human-readable time delta, e.g. `3 hours` into total seconds. |
| [getNiceRemainingTime()](#getniceremainingtime) | Calculate estimated remaining time, given progress and start time. |
| [randArray()](#randarray) | Return a random element from an array. |
| [pluralize()](#pluralize) | Apply English language pluralization to a word, based on a specified value. |
| [escapeRegExp()](#escaperegexp) | Escape a string for inclusion in a regular expression. |
| [ucfirst()](#ucfirst) | Upper-case the first character of a string, lower-case the rest. |
| [getErrorDescription()](#geterrordescription) | Get a better error description from a Node.js error code. |
| [bufferSplit()](#buffersplit) | Split a buffer into chunks given a separator. |
| [fileEachLine()](#fileeachline) | Iterate over a file line-by-line, async style. |
| [getpwnam()](#getpwnam) | Fetches user account info, similar to POSIX getpwnam. |

## timeNow

```
NUMBER timeNow( FLOOR )
```

This function returns the current time expressed as [Epoch Seconds](http://en.wikipedia.org/wiki/Unix_time).  Pass `true` if you want the value floored to the nearest integer.

```javascript
var epoch = Tools.timeNow();
var floored = Tools.timeNow(true);
```

## generateUniqueID

```
STRING generateUniqueID( LENGTH, SALT )
```

This function generates a pseudo-random alphanumeric (hexadecimal) ID by combining various bits of local entropy, and hashing it together with [SHA-256](http://en.wikipedia.org/wiki/SHA-2).  The default length is 64 characters, but you can pass in any lesser length to chop it.  If you want to add your own entropy, pass it as the 2nd argument.

```javascript
var id = Tools.generateUniqueID();
var id = Tools.generateUniqueID( 32 );
var id = Tools.generateUniqueID( 64, "my extra entropy!" );
```

Please note that this is *not* designed to be cryptographically secure.  It doesn't use Node's [crypto.randomBytes](http://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback), because generating true random bits takes time, and can block execution.

## digestHex

```
STRING digestHex( PLAINTEXT, [ALGO] )
```

This function is just a simple wrapper around Node's [SHA-256](http://en.wikipedia.org/wiki/SHA-2) or other hashing algorithms.  The default is SHA-256, in which case it returns a 64-character hexadecimal hash of the given string.

```javascript
var sig = Tools.digestHex( "my plaintext string" );
// --> "6b4fdfd705d05b11a56b8c3020058b666359d3939b6eda354f529ebad77695c2"
```

To specify the algorithm, include it as the second argument.  It should be a string set to `md5`, `sha256`, etc.  On recent releases of OpenSSL, typing `openssl list-message-digest-algorithms` will display the available digest algorithms.  Example (MD5):

```javascript
var sig = Tools.digestHex( "my plaintext string", "md5" );
// --> "659a30fb5d9958326b15c17e8444c123"
```

## numKeys

```
INTEGER numKeys( OBJECT )
```

This function returns the number of keys in the specified hash.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var num = Tools.numKeys( my_hash ); // 2
```

## firstKey

```
STRING firstKey( OBJECT )
```

This function returns the first key of the hash when iterating over it.  Note that hash keys are stored in an undefined order.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var key = Tools.firstKey( my_hash ); // foo or baz
```

## hashKeysToArray

```
ARRAY hashKeysToArray( OBJECT )
```

This function returns all the hash keys as an array.  The values are discarded.  Useful for sorting and then iterating over the sorted list.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var keys = Tools.hashKeysToArray( my_hash ).sort();

for (var idx = 0, len = keys.length; idx < len; idx++) {
	var key = keys[idx];
	// do something with key and my_hash[key]
}
```

## hashValuesToArray

```
ARRAY hashValuesToArray( OBJECT )
```

This function returns all the hash values as an array.  The keys are discarded.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var values = Tools.hashValuesToArray( my_hash );

for (var idx = 0, len = values.length; idx < len; idx++) {
	var value = values[idx];
	// do something with value
}
```

## isaHash

```
BOOLEAN isaHash( MIXED )
```

This function returns `true` if the provided argument is a hash (object), `false` otherwise.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var is_hash = Tools.isaHash( my_hash );
```

## isaArray

```
BOOLEAN isaArray( MIXED )
```

This function returns `true` if the provided argument is an array (or is array-like), `false` otherwise.

```javascript
var my_arr = [ "foo", "bar", 12345 ];
var is_arr = Tools.isaArray( my_arr );
```

## copyHash

```
OBJECT copyHash( OBJECT, DEEP )
```

This function performs a shallow copy of the specified hash, and returns the copy.  Pass `true` as the 2nd argument to perform a *deep copy*, which uses JSON parse/stringify.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var my_copy = Tools.copyHash( my_hash );
```

## copyHashRemoveKeys

```
OBJECT copyHashRemoveKeys( OBJECT, REMOVE )
```

This function performs a shallow copy of the specified hash, and returns the copy, but *omits* any keys you specify in a separate hash.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var omit_these = { baz: true };
var my_copy = Tools.copyHashRemoveKeys( my_hash, omit_these );
```

## mergeHashes

```
OBJECT mergeHashes( OBJECT_A, OBJECT_B )
```

This function merges two hashes (objects) together, and returns a new hash which contains the combination of the two keys (shallow copy).  The 2nd hash takes precedence over the first, in the event of duplicate keys.

```javascript
var hash1 = { foo: "bar" };
var hash2 = { baz: 12345 };
var combo = Tools.mergeHashes( hash1, hash2 );
```

## mergeHashInto

```
VOID mergeHashInto( OBJECT_A, OBJECT_B )
```

This function shallow-merges {OBJECT_B} into {OBJECT_A}.  There is no return value.  Existing keys are replaced in {OBJECT_A}.

```javascript
var hash1 = { foo: "bar" };
var hash2 = { baz: 12345 };
Tools.mergeHashInto( hash1, hash2 );
```

## parseQueryString

```
OBJECT parseQueryString( URL )
```

This function parses a standard URL query string, and returns a hash with key/value pairs for every query parameter.  Duplicate params are clobbered, the latter prevails.  Values are URL-unescaped, and all of them are strings.  The function accepts a full URL, or just the query string portion.

```javascript
var url = 'http://something.com/hello.html?foo=bar&baz=12345';
var query = Tools.parseQueryString( url );
var foo = query.foo; // "bar"
var baz = query.baz; // "12345"
```

Please note that this is a very simple function, and you should probably use the built-in Node.js [querystring](http://nodejs.org/api/querystring.html) module instead.

## composeQueryString

```
STRING composeQueryString( OBJECT )
```

This function takes a hash of key/value pairs, and constructs a URL query string out of it.  Values are URL-escaped.

```javascript
var my_hash = { foo: "bar", baz: 12345 };
var qs = Tools.composeQueryString( my_hash );
// --> "?foo=bar&baz=12345"
```

Please note that this is a very simple function, and you should probably use the built-in Node.js [querystring](http://nodejs.org/api/querystring.html) module instead.

## findObjectsIdx

```
ARRAY findObjectsIdx( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and returns all the array indexes whose objects have keys which match a given criteria hash.

```javascript
var list = [
	{ id: 12345, name: "Joe", eyes: "blue" },
	{ id: 12346, name: "Frank", eyes: "brown" },
	{ id: 12347, name: "Cynthia", eyes: "blue" }
];
var criteria = { eyes: "blue" };

var idxs = Tools.findObjectsIdx( list, criteria );
// --> [0, 2]
```

## findObjectIdx

```
INTEGER findObjectIdx( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and returns the first array index whose object has keys which match a given criteria hash.  If no objects match, `-1` is returned.

```javascript
var list = [
	{ id: 12345, name: "Joe", eyes: "blue" },
	{ id: 12346, name: "Frank", eyes: "brown" },
	{ id: 12347, name: "Cynthia", eyes: "blue" }
];
var criteria = { eyes: "blue" };

var idx = Tools.findObjectIdx( list, criteria );
// --> 0
```

## findObject

```
OBJECT findObject( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and returns the first item whose object has keys which match a given criteria hash.  If no objects match, `null` is returned.

```javascript
var list = [
	{ id: 12345, name: "Joe", eyes: "blue" },
	{ id: 12346, name: "Frank", eyes: "brown" },
	{ id: 12347, name: "Cynthia", eyes: "blue" }
];
var criteria = { eyes: "blue" };

var obj = Tools.findObject( list, criteria );
// --> { id: 12345, name: "Joe", eyes: "blue" }
```

## findObjects

```
ARRAY findObjects( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and returns all the items whose objects have keys which match a given criteria hash.

```javascript
var list = [
	{ id: 12345, name: "Joe", eyes: "blue" },
	{ id: 12346, name: "Frank", eyes: "brown" },
	{ id: 12347, name: "Cynthia", eyes: "blue" }
];
var criteria = { eyes: "blue" };

var objs = Tools.findObjects( list, criteria );
// --> [{ id: 12345, name: "Joe", eyes: "blue" }, { id: 12347, name: "Cynthia", eyes: "blue" }]
```

## deleteObject

```
BOOLEAN deleteObject( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and deletes the first item whose object has keys which match a given criteria hash.  It returns `true` for success or `false` if no matching object could be found.

```javascript
var list = [
	{ id: 12345, name: "Joe", eyes: "blue" },
	{ id: 12346, name: "Frank", eyes: "brown" },
	{ id: 12347, name: "Cynthia", eyes: "blue" }
];
var criteria = { eyes: "blue" };

Tools.deleteObject( list, criteria );
// list will now contain only Frank and Cynthia
```

## deleteObjects

```
INTEGER deleteObjects( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and deletes all items whose objects have keys which match a given criteria hash.  It returns the number of objects deleted.

```javascript
var list = [
	{ id: 12345, name: "Joe", eyes: "blue" },
	{ id: 12346, name: "Frank", eyes: "brown" },
	{ id: 12347, name: "Cynthia", eyes: "blue" }
];
var criteria = { eyes: "blue" };

Tools.deleteObjects( list, criteria );
// list will now contain only Frank
```

## alwaysArray

```
ARRAY alwaysArray( MIXED )
```

This function will wrap anything passed to it into an array and return the array, unless the item passed is already an array, in which case it is simply returned verbatim.

```javascript
var arr = Tools.alwaysArray( maybe_array );
```

## lookupPath

```
MIXED lookupPath( PATH, ARGS )
```

This function will perform a directory-style path lookup on a hash/array tree, returning whatever object or value is pointed to, or `null` if not found.

```javascript
var tree = {
	folder1: {
		file1: "foo",
		folder2: {
			file2: "bar"
		}
	}
};

var file = Tools.lookupPath( "/folder1/folder2/file2", tree );
// --> "bar"
```

For walking into arrays, simply provide the index number of the element you want.

## substitute

```
STRING substitute( TEMPLATE, ARGS, FATAL )
```

This function performs placeholder substitution on a string, using square bracket delimited placeholders which may contain simple keys or even paths.

```javascript
var tree = {
	folder1: {
		file1: "foo",
		folder2: {
			file2: "bar"
		}
	}
};
var template = "Hello, I would like [/folder1/folder2/file2] and also [/folder/file1] please!";

var str = Tools.substitute( template, tree );
// --> "Hello, I would like bar and also foo please!"
```

You can omit the leading slashes if you are doing single-level hash lookups.

If you pass true for the `FATAL` argument, the function will return `null` if any variable lookups fail.  The default behavior is to preserve the original formatting (with placeholders and all) if the lookup fails.

## getDateArgs

```
OBJECT getDateArgs( MIXED )
```

This function parses any date string, Epoch timestamp or Date object, and produces a hash with the following keys (all localized to the current timezone):

| Key | Sample Value | Description |
| --- | ------------ | ----------- |
| `year` | 2015 | Full year as integer. | 
| `mon` | 3 | Month of year as integer (1 - 12). | 
| `mday` | 6 | Day of month as integer (1 - 31). | 
| `wday` | 4 | Day of week as integer (0 - 6). | 
| `hour` | 9 | Hour of day as integer (0 - 23). | 
| `min` | 2 | Minute of hour as integer (0 - 59). | 
| `sec` | 10 | Second of minute as integer (0 - 59). | 
| `msec` | 999 | Millisecond of second as integer (0 - 999). | 
| `yyyy` | "2015" | 4-digit year as string. | 
| `mm` | "03" | 2-digit month as string with padded zeros if needed. | 
| `dd` | "06" | 2-digit day as string with padded zeros if needed. | 
| `hh` | "09" | 2-digit hour as string with padded zeros if needed. | 
| `mi` | "02" | 2-digit minute as string with padded zeros if needed. | 
| `ss` | "10" | 2-digit second as string with padded zeros if needed. | 
| `hour12` | 9 | Hour expressed in 12-hour time (i.e. 1 PM = 1.) | 
| `ampm` | "am" | String representing ante meridiem (`am`) or post meridiem (`pm`). | 
| `yyyy_mm_dd` | "2015/03/06" | Formatted string representing date in `YYYY/MM/DD` format. |
| `hh_mi_ss` | "09:02:10" | Formatted string representing local time in `HH:MI:SS` format. |
| `epoch` | 1425661330 | Epoch seconds used to generate all the date args. |
| `offset` | -28800 | Local offset from GMT/UTC in seconds. |
| `tz` | "GMT-8" | Formatted GMT hour offset string. |

Example usage:

```javascript
var args = Tools.getDateArgs( new Date() );
var date_str = args.yyyy + '/' + args.mm + '/' + args.dd;
```

## getTimeFromArgs

```
INTEGER getTimeFromArgs( OBJECT )
```

This function will recalculate a date given an `args` object as returned from [getDateArgs()](#getdateargs).  It allows you to manipulate the `year`, `mon`, `mday`, `hour`, `min` and/or `sec` properties, and will return the computed Epoch seconds from the new set of values.  Example:

```javascript
var args = Tools.getDateArgs( new Date() );
args.mday = 15;

var epoch = Tools.getTimeFromArgs(args);
```

This example would return the Epoch seconds from the 15th day of the current month, in the current year, and using the current time of day.

## normalizeTime

```
INTEGER normalizeTime( INTEGER, OBJECT )
```

This function will "normalize" (i.e. quantize) an Epoch value to the nearest minute, hour, day, month, or year.  Meaning, you can pass in an Epoch time value, and have it return a value of the start of the current hour, midnight on the current day, the 1st of the month, etc.  To do this, pass in an object containing any keys you wish to change, e.g. `year`, `mon`, `mday`, `hour`, `min` and/or `sec`.  Example:

```javascript
var midnight = Tools.normalizeTime( Tools.timeNow(), { hour: 0, min: 0, sec: 0 } );
```

You can actually set the values to non-zero.  For example, to return the Epoch time of exactly noon today:

```javascript
var noon = Tools.normalizeTime( Tools.timeNow(), { hour: 12, min: 0, sec: 0 } );
```

## getTextFromBytes

```
STRING getTextFromBytes( BYTES, PRECISION )
```

This function generates a human-friendly text string given a number of bytes.  It reduces the units to K, MB, GB or TB as needed, and allows a configurable amount of precision after the decimal point.  The default is one decimal of precision (specify as `1`, `10`, `100`, etc.).

```javascript
var str = Tools.getTextFromBytes( 0 );    // "0 bytes"
var str = Tools.getTextFromBytes( 1023 ); // "1023 bytes"
var str = Tools.getTextFromBytes( 1024 ); // "1 K"
var str = Tools.getTextFromBytes( 1126 ); // "1.1 K"

var str = Tools.getTextFromBytes( 1599078, 1 ); // "1 MB"
var str = Tools.getTextFromBytes( 1599078, 10 ); // "1.5 MB"
var str = Tools.getTextFromBytes( 1599078, 100 ); // "1.52 MB"
var str = Tools.getTextFromBytes( 1599078, 1000 ); // "1.525 MB"
```

## getBytesFromText

```
INTEGER getBytesFromText( STRING )
```

This function parses a string containing a human-friendly size count (e.g. `45 bytes` or `1.5 MB`) and converts it to raw bytes.

```javascript
var bytes = Tools.getBytesFromText( "0 bytes" ); // 0
var bytes = Tools.getBytesFromText( "1023 bytes" ); // 1023
var bytes = Tools.getBytesFromText( "1 K" ); // 1024
var bytes = Tools.getBytesFromText( "1.1k" ); // 1126
var bytes = Tools.getBytesFromText( "1.525 MB" ); // 1599078	
```

## commify

```
STRING commify( INTEGER )
```

This function adds commas to long numbers following US-style formatting rules (add comma every 3 digits counting from right side).  Only positive integers are supported.

```javascript
var c = Tools.commify( 123 ); // "123"
var c = Tools.commify( 1234 ); // "1,234"
var c = Tools.commify( 1234567890 ); // "1,234,567,890"
```

## shortFloat

```
NUMBER shortFloat( NUMBER )
```

This function "shortens" a floating point number by only allowing two digits after the decimal point, *unless they are zeros*.

```javascript
var short = Tools.shortFloat( 0.12345 ); // 0.12
var short = Tools.shortFloat( 0.00001 ); // 0.00001
var short = Tools.shortFloat( 0.00123 ); // 0.0012
```

## pct

```
STRING pct( AMOUNT, MAX, FLOOR )
```

This function calculates a percentage given an arbitrary numerical amount and a maximum value, and returns a formatted string with a '%' symbol.  Pass `true` as the 3rd argument to floor the percentage to the nearest integer.  Otherwise the value is shortened with `shortFloat()`.

```javascript
var p = Tools.pct( 5, 10 ); // "50%"
var p = Tools.pct( 0, 1 );  // "0%"
var p = Tools.pct( 751, 1000 ); // "75.1%"
var p = Tools.pct( 751, 1000, true ); // "75%"
```

## zeroPad

```
STRING zeroPad( NUMBER, MAX )
```

This function adds zeros to the left side of a number, until the total string length meets a specified maximum (up to 10 characters).  The return value is a string, not a number.

```javascript
var padded = Tools.zeroPad( 5, 1 ); // "5"
var padded = Tools.zeroPad( 5, 2 ); // "05"
var padded = Tools.zeroPad( 5, 3 ); // "005"
var padded = Tools.zeroPad( 100, 3 ); // "100"
var padded = Tools.zeroPad( 100, 4 ); // "0100"
var padded = Tools.zeroPad( 100, 5 ); // "00100"
```

## getTextFromSeconds

```
STRING getTextFromSeconds( NUMBER, ABBREVIATE, SHORTEN )
```

This function generates a human-friendly time string given a number of seconds.  It reduces the units to minutes, hours or days as needed.  You can also abbreviate the output, and shorten the extra precision.

```javascript
var str = Tools.getTextFromSeconds( 0 ); // "0 seconds"
var str = Tools.getTextFromSeconds( 86400 ); // "1 day"
var str = Tools.getTextFromSeconds( 90 ); // "1 minute, 30 seconds"
var str = Tools.getTextFromSeconds( 90, true ); // "1 min, 30 sec"
var str = Tools.getTextFromSeconds( 90, false, true ); // "1 minute"
var str = Tools.getTextFromSeconds( 90, true, true ); // "1 min"
```

## getSecondsFromText

```
INTEGER getSecondsFromText( STRING )
```

This function parses a string containing a human-friendly time (e.g. `45 minutes` or `7 days`) and converts it to raw seconds.  It accepts seconds, minutes, hours, days and/or weeks.  It does not interpret "months" or "years" because those are non-exact measurements.

```javascript
var sec = Tools.getSecondsFromText( "1 second" ); // 1
var sec = Tools.getSecondsFromText( "2min" ); // 120
var sec = Tools.getSecondsFromText( "30m" ); // 1800
var sec = Tools.getSecondsFromText( "12 HOURS" ); // 43200
var sec = Tools.getSecondsFromText( "1day" ); // 86400
```

## getNiceRemainingTime

```
STRING getNiceRemainingTime( ELAPSED, COUNTER, MAX, ABBREV, SHORTEN )
```

This function calculates the estimated remaining time on a job in progress, given the elapsed time in seconds, an arbitrary counter representing the job's progress, and a maximum value for the counter.

```javascript
var remain = Tools.getNiceRemainingTime( 45, 0.75, 1.0 );
// --> "15 seconds"

var remain = Tools.getNiceRemainingTime( 3640, 0.75, 1.0 );
// --> "20 minutes, 13 seconds"

var remain = Tools.getNiceRemainingTime( 3640, 0.75, 1.0, true );
// --> "20 min, 13 sec"

var remain = Tools.getNiceRemainingTime( 3640, 0.75, 1.0, false, true );
// --> "20 minutes"

var remain = Tools.getNiceRemainingTime( 3640, 0.75, 1.0, true, true );
// --> "20 min"
```

Note that this works best when the job's progress is somewhat constant.  If it proceeds at a varying pace, the remaining time may appear to go too fast or too slow at times.  It always computes the average speed over the course of the time elapsed, versus the current progress.

## randArray

```
MIXED randArray( ARRAY )
```

This function picks a random element from the given array, and returns it.

```javascript
var fruit = ['apple', 'orange', 'banana'];
var rand = Tools.randArray( fruit );
```

## pluralize

```
STRING pluralize( STRING, NUMBER )
```

This function pluralizes a string using US-English rules, given an arbitrary number.  This is useful when constructing human-friendly sentences containing a quantity of things, and you wish to say either "thing" or "things" depending on the number.

```javascript
var list = ['apple', 'orange', 'banana'];
var text = "You have " + list.length + Tools.pluralize(" item", list.length) + " in your list.";
// --> "You have 3 items in your list.";
```

## escapeRegExp

```
STRING escapeRegExp( STRING )
```

This function escapes a string so that it can be used inside a regular expression.  Meaning, any regular expression metacharacters are prefixed with a backslash, so they are interpreted literally.  It was taken from the [MDN Regular Expression Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).

## ucfirst

```
STRING ucfirst( STRING )
```

The function upper-cases the first character of a string, and lower-cases the rest.  This is very similar to the Perl core function of the same name.  Example:

```javascript
var first_name = Tools.ucfirst( 'george' );
// --> "George"
```

## getErrorDescription

```
STRING getErrorDescription( ERROR )
```

This function takes a standard Node.js [System Error](https://nodejs.org/api/errors.html#errors_class_system_error) object, such as one emitted when a filesystem or network error occurs, and produces a prettier and more verbose string description.  It uses the 3rd party [errno](https://www.npmjs.com/package/errno) package, and adds its own decorations as well.  Example:

```javascript
require('fs').readFile( '/bad/file.txt', function(err, data) {
	if (err) {
		console.log( "Native Error: " + err.message );
		console.log( "Better Error: " + Tools.getErrorDescription(err) );
	}
} );

// Outputs:
// Native Error: ENOENT, open '/bad/file.txt'
// Better Error: No such file or directory (ENOENT, open '/bad/file.txt')
```

Basically it resolves the Node.js error codes such as `ENOENT` to a human-readable string (i.e. `No such file or directory`), but also appends the raw native error message in parenthesis as well.

## bufferSplit

```
ARRAY bufferSplit( BUFFER, SEPARATOR )
```

This function splits a buffer into an array of chunks, given a separator (string or buffer).  It works similarly to the [String.split](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split) core function, with two main differences.  First, the separator cannot be a regular expression (it must be a string or another buffer), and second, the returned split buffer chunks will occupy the same memory space as the original buffer.  Example:

```js
var EOL = require('os').EOL;
var data = require('fs').readFileSync( 'some_file.csv' );
var lines = Tools.bufferSplit( data, EOL );
```

## fileEachLine

```
VOID fileEachLine( FILE, OPTS, ITERATOR, CALLBACK )
```

This function iterates over a file line by line, firing `ITERATOR` for each.  This is done in asynchronous fashion, akin to the [async](http://caolan.github.io/async/) module.  Your `ITERATOR` function is passed the line (encoded string or buffer) and a callback to fire.  When all the lines are completed, the main `CALLBACK` is fired once, including an error or not.  This is designed to handle huge files without using much memory at all.

The `OPTS` object may include:

| Property Name | Default Value | Description |
|---------------|---------------|-------------|
| `buffer_size` | `1024` | How many bytes to read from the file at a time. |
| `eol` | os.EOL | The end-of-line separator, defaults to the current system EOL. |
| `encoding` | `utf8` | The encoding to use for each line, set to `null` if you want buffers. |

Example:

```js
Tools.fileEachLine( "my_large_spreadsheet.csv",
	function(line, callback) {
		// this is fired for each line
		var columns = line.split(/\,\s*/);
		// do something with the data here, possibly async
		// fire callback for next line, pass error to abort
		callback();
	},
	function(err) {
		// all lines are complete
		if (err) throw err;
	}
);
```

## getpwnam

```
OBJECT getpwnam( USERNAME, [USE_CACHE] )
```

This function fetches local user account information, give a username or numerical UID.  This is similar to the POSIX [getpwnam](http://man7.org/linux/man-pages/man3/getpwnam.3.html) function, which is missing from Node core.  This function works on Linux and OS X only.  It runs in synchronous mode, and returns an object with the following properties, or `null` on error:

| Property Name | Sample Value | Description |
|---------------|---------------|-------------|
| `username` | `jhuckaby` | The username of the account. |
| `password` | `****` | The hashed password of the account (often masked). |
| `uid` | `501` | The numerical UID (User ID) of the account. |
| `gid` | `501` | The numeric GID (Group ID) of the account. |
| `name` | `Joseph Huckaby` | The full name of the user. |
| `dir` | `/home/jhuckaby` | The home directory path of the user. |
| `shell` | `/bin/bash` | The login shell used by the user. |

If you pass `true` as the 2nd argument, the user information will be cached in RAM for future queries on the same username or UID.  Example use:

```js
var info = Tools.getpwnam( "jhuckaby", true );
if (info) {
	process.chdir( info.dir );
}
```

# License

The MIT License

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
