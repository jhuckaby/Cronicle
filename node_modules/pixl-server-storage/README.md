# Overview

This module is a component for use in [pixl-server](https://www.npmjs.com/package/pixl-server).  It implements a simple key/value storage system that can use multiple back-ends, such as [Amazon S3](https://aws.amazon.com/s3/), [Couchbase](http://www.couchbase.com/nosql-databases/couchbase-server), or a local filesystem.  On top of that, it also introduces the concept of a "chunked linked list", which supports extremely fast push, pop, shift, unshift, and random reads/writes.

## Features at a Glance

* Store JSON or binary (raw) data.
* Supports multiple back-ends including Amazon S3, Couchbase and local filesystem.
* Linked lists with very fast push, pop, shift, unshift, and random reads/writes.
* Advisory locking system for records and lists.
* Variable expiration dates per key and automatic deletion.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-server pixl-server-storage
```

Here is a simple usage example.  Note that the component's official name is `Storage`, so that is what you should use for the configuration key, and for gaining access to the component via your server object.

```javascript
var PixlServer = require('pixl-server');
var server = new PixlServer({
	
	__name: 'MyServer',
	__version: "1.0",
	
	config: {
		"log_dir": "/var/log",
		"debug_level": 9,
		
		"Storage": {
			"engine": "Filesystem",
			"Filesystem": {
				"base_dir": "/var/data/myserver",
			}
		}
	},
	
	components: [
		require('pixl-server-storage')
	]
	
});

server.startup( function() {
	// server startup complete
	var storage = server.Storage;
	
	// store key
	storage.put( 'test-key', { foo:"hello", bar:42 }, function(err) {
		if (err) throw err;
		
		// fetch key
		storage.get( 'test-key', function(err, data) {
			if (err) throw err;
			console.log(data);
		} );
	} );
} );
```

Notice how we are loading the [pixl-server](https://www.npmjs.com/package/pixl-server) parent module, and then specifying [pixl-server-storage](https://www.npmjs.com/package/pixl-server-storage) as a component:

```javascript
components: [
	require('pixl-server-storage')
]
```

This example is a very simple server configuration, which will start a local filesystem storage instance pointed at `/var/data/myserver` as a base directory.  It then simply stores a test key, then fetches it back.

## Standalone Mode

If you want to access the storage component as a standalone class (i.e. not part of a [pixl-server](https://www.npmjs.com/package/pixl-server) server daemon), you can require the `pixl-server-storage/standalone` path and invoke it directly.  This can be useful for things like CLI scripts.  Example usage:

```javascript
var StandaloneStorage = require('pixl-server-storage/standalone');

var config = {
	"engine": "Filesystem",
	"Filesystem": {
		"base_dir": "/var/data/myserver"
	}
};

var storage = new StandaloneStorage(config, function(err) {
	if (err) throw err;
	// storage system has started up and is ready to go
	
	storage.put( 'test-key', { foo:"hello", bar:42 }, function(err) {
		if (err) throw err;
		
		// fetch key
		storage.get( 'test-key', function(err, data) {
			if (err) throw err;
			console.log(data);
		} );
	} );
});
```

# Configuration

The configuration for this component is set by passing in a `Storage` key in the `config` element when constructing the `PixlServer` object, or, if a JSON configuration file is used, a `Storage` object at the outermost level of the file structure.  It can contain the following keys:

## engine

The `engine` property is used to declare the name of the back-end storage engine to use.  Specifically, this is for using one of the built-in engine modules located in the `pixl-server-storage/engines/` directory.  See [Engines](#engines) below for details.  Example:

```javascript
{
	"engine": "Filesystem",
	"Filesystem": {
		"base_dir": "/var/data/myserver"
	}
}
```

Note that the engine's own configuration should always go into a property named the same as the engine itself, in this case `Filesystem`.

## engine_path

The `engine_path` property can be used to load your own custom engine in any location.  The path should be either absolute, or relative to the location of the `pixl-server-storage/` directory.  Example:

```javascript
{
	"engine": "MyCustomEngine",
	"engine_path": "../../my_custom_storage_engine.js",
	"MyCustomEngine": {
		"something": "foo"
	}
}
```

All engines must have a name, so you always need to declare a `engine` property with a string, and that should always match a property containing engine-specific configuration directives.  See [Plugin Development](#plugin-development) for more details.

## list_page_size

The `list_page_size` property specifies the default page size (number of items per page) for new lists.  However, you can override this per each list when creating them.  See [Lists](#lists) below for details.

## concurrency

The `concurrency` property allows some operations to be parallelized in the storage engine.  This is mainly used for list and maintenance operations, which may involve loading and saving multiple records.  The default value is `1`.  Increase this number for potentially faster operations in some cases.

## maintenance

The `maintenance` property allows the storage system to run routine maintenance, and is highly recommended for daemons that run 24x7.  This is typically enabled to run nightly, and performs tasks such as deleting expired records.  To enable it, set this to any `HH:MM` string where `HH` is the hour in 24-hour time and `MM` is the minute.  Pad with a zero if either value is under 10.  Example:

```javascript
{
	"maintenance": "04:30" // run daily at 4:30 AM
}
```

Make sure your server's clock and timezone are correct.  The values are always assumed to be in the current timezone.

## debug (standalone)

The `debug` property is only used when using [Standalone Mode](#standalone-mode).  Setting this to `true` will cause the engine to emit debugging messages to the console.

# Engines

The storage system can be backed by a number of different "engines", which actually perform the reads and writes.  A simple local filesystem implementation is included, as well as modules for Amazon S3 and Couchbase.  Each one requires a bit of extra configuration.

## Local Filesystem

The local filesystem engine is called `Filesystem`, and reads/writes files to local disk.  It distributes files by hashing their keys using MD5, and splitting up the path into several subdirectories.  So even with tens of millions of records, no one single directory will ever have more than 255 files.  For example:

```
Plain Key:
test1

MD5 Hash:
5a105e8b9d40e1329780d62ea2265d8a

Partial Filesystem Path:
/5a/10/5e/5a105e8b9d40e1329780d62ea2265d8a.json
```

The partial path is then combined with a base directory, which is configurable.  Here is an example configuration:

```javascript
{
	"engine": "Filesystem",
	"Filesystem": {
		"base_dir": "/var/data/myserver"
	}
}
```

So, putting all this together, the `test1` key would be stored on disk at this location:

```
/var/data/myserver/5a/10/5e/5a105e8b9d40e1329780d62ea2265d8a.json
```

For binary records, the file extension will match whatever was in the key.

### Key Namespaces

To help segment your application data into categories on the filesystem, an optional `key_namespaces` configuration parameter can be specified, and set to a true value.  This will modify the key hashing algorithm to include a "prefix" directory, extracted from the plain key itself.  Example:

```
Plain Key:
users/jhuckaby

MD5 Hash:
019aaa6887e5ce3533dcc691b05e69e4

Partial Filesystem Path:
/users/01/9a/aa/019aaa6887e5ce3533dcc691b05e69e4.json
```

So in this case the `users` prefix is extracted from the plain key, and then inserted at the beginning of the hash directories.  Here is the full filesystem path, assuming a base directory of `/var/data/myserver`:

```
/var/data/myserver/users/01/9a/aa/019aaa6887e5ce3533dcc691b05e69e4.json
```

In order to use key namespaces effectively, you need to make sure that *all* your plain keys contain some kind of namespace prefix, followed by a slash.  The idea is, you can then store your app's data in different physical locations using symlinks.  You can also determine how much disk space is taken up by each of your app's data categories, without having to walk all the hash directories.

## Amazon S3

If you want to use [Amazon S3](http://aws.amazon.com/s3/) as a backing store, here is how to do so.  First, you need to manually install the [aws-sdk](https://www.npmjs.com/package/aws-sdk) module into your app:

```
npm install aws-sdk
```

Then configure your storage thusly:

```javascript
{
	"engine": "S3",
	"AWS": {
		"accessKeyId": "YOUR_AMAZON_ACCESS_KEY", 
		"secretAccessKey": "YOUR_AMAZON_SECRET_KEY", 
		"region": "us-west-1" 
	},
	"S3": {
		"keyPrefix": "",
		"params": {
			"Bucket": "MY_S3_BUCKET_ID"
		}
	}
}
```

Replace `YOUR_AMAZON_ACCESS_KEY` and `YOUR_AMAZON_SECRET_KEY` with your Amazon Access Key and Secret Key, respectively.  These can be generated on the Security Credentials page.  Replace `MY_S3_BUCKET_ID` with the ID if your own S3 bucket.  Make sure you match up the region too.

The `AWS` object is passed directly to the `config.update()` function from the [aws-sdk](https://www.npmjs.com/package/aws-sdk) module, so you can also include any properties supported there.  See the [docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html) for more details.

The `S3` object is passed directly to the S3 class constructor, so check the [docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property) to see what other properties are supported.  The one exception is `keyPrefix` which is a custom property used by pixl-server-storage (see [S3 Key Prefix](#s3-key-prefix) below).

If you plan on using Amazon AWS in other parts of you application, you can actually move the `AWS` config object into your outer server configuration.  The storage module will look for it there.

### S3 Key Prefix

The S3 engine supports an optional key prefix, in case you are sharing a bucket with other applications, and want to keep all your app related records separate.  To specify this, include a `keyPrefix` property in your `S3` object (this goes alongside the `params`, but not inside of it).  Example:

```js
{
	"S3": {
		"keyPrefix": "myapp",
		"params": {
			"Bucket": "MY_S3_BUCKET_ID"
		}
	}
}
```

This would prefix the string `myapp` before all your application keys (a trailing slash will be added after the prefix if needed).  For example, if your app tried to write a record with key `users/jhuckaby`, the actual S3 key would end up as `myapp/users/jhuckaby`.

## Couchbase

If you want to use [Couchbase](http://www.couchbase.com/nosql-databases/couchbase-server) as a backing store, here is how to do so.  First, you need to manually install the [couchbase](https://www.npmjs.com/package/couchbase) module into your app:

```
npm install couchbase
```

Then configure your storage thusly:

```javascript
{
	"engine": "Couchbase",
	"Couchbase": {
		"connectString": "couchbase://127.0.0.1",
		"bucket": "default",
		"password": "",
		"serialize": false,
		"keyPrefix": ""
	}
}
```

Set the `connectString` for your own Couchbase server setup.  You can embed a username and password into the string if they are required to connect (this is different from the bucket password), and use `couchbases://` for SSL, if desired.

The `bucket` property should be set to the bucket name.  If you don't know this then `default` is probably correct.  The `password` property is the bucket password, and may or may not be required, depending on your Couchbase server setup.

The `serialize` property, when set to `true`, will cause all object values to be serialized to JSON before storing, and they will also be parsed from JSON when fetching.  When set to `false` (the default), this is left up to Couchbase to handle.

The optional `keyPrefix` works similarly to the [S3 Key Prefix](#s3-key-prefix) feature.  It allows you to prefix all the Couchbase keys with a common string, to separate your application's data in a shared bucket situation.

# Key Normalization

In order to maintain compatibility with all the various engines, keys are "normalized" on all entry points.  Specifically, they undergo the following transformations before being passed along to the engine:

* They are converted to lower-case.
* Only the following characters are allowed (everything else is stripped):
	* Alphanumerics
	* Dashes (hyphens)
	* Dots (periods)
	* Forward-slashes
* Duplicate adjacent slashes (i.e. "//") are converted to a single slash.
* Leading and trailing slashes are stripped.

So for example, this key:

```
" / / / // HELLO-KEY @*#&^$*@/#&^$(*@#&^$   test   / "
```

...is normalized to this:

```
"hello-key/test"
```

The same key normalization filter is applied when both storing and fetching records.

# Basic Functions

The storage module supports the following basic methods for typical operations.  Upon error, all callback methods are passed an `Error` object as the first argument.  If not, the first argument will be falsey (i.e. `false`, `0`, `null` or `undefined`), and the second argument will contain any requested data, if applicable.

The code examples all assume you have your preloaded `Storage` component instance in a local variable named `storage`.  The component instance can be retrieved from a running server like this:

```javascript
var storage = server.Storage;
```

## Storing Records

To store a record, call the [put()](#put) method.  Pass in a key, a value, and a callback.  The value may be an Object (which is automatically serialized to JSON), or a `Buffer` for a binary blob (see [Storing Binary Blobs](#storing-binary-blobs) below).  If the record doesn't exist, it is created, otherwise it is replaced.

```javascript
storage.put( 'test1', { foo: 'bar1' }, function(err) {
	if (err) throw err;
} );
```

## Fetching Records

To fetch a record, call the [get()](#get) method.  Pass in a key, and a callback.  The data returned will be parsed back into an Object if JSON, or a raw `Buffer` object will be returned for binary records.

```javascript
storage.get( 'test1', function(err, data) {
	if (err) throw err;
} );
```

Some engines also allow you to "head" (i.e. ping) an object to retrieve some metadata about it, without fetching the value.  To do this, call the [head()](#head) method, and pass in the key.  The metadata usually consists of the size (`len`) and last modification date (`mod`).  Example:

```javascript
storage.head( 'test1', function(err, data) {
	if (err) throw err;
	// data.mod
	// data.len
} );
```

Note that the [Couchbase](#couchbase) engine does not support `head`, but the [Amazon S3](#amazon-s3) and [Local Filesystem](#local-filesystem) engines both do.

You can fetch multiple records at once by calling `getMulti()` and passing in array of keys.  Example:

```javascript
storage.getMulti( ['test1', 'test2', 'test3'], function(err, values) {
	if (err) throw err;
	// values[0] will be the test1 record.
	// values[1] will be the test2 record.
	// values[2] will be the test3 record.
} );
```

## Copying Records

To make a copy of a record and store it under a new key, call the [copy()](#copy) method.  Pass in the old key, new key, and a callback.

```javascript
storage.copy( 'test1', 'test2', function(err) {
	if (err) throw err;
} );
```

**Note:** This is a compound function containing multiple sequential engine operations.  You may require locking depending on your application.  See [Advisory Locking](#advisory-locking) below.

## Renaming Records

To rename a record, call the [rename()](#rename) method.  Pass in the old key, new key, and a callback.

```javascript
storage.rename( 'test1', 'test2', function(err) {
	if (err) throw err;
} );
```

**Note:** This is a compound function containing multiple sequential engine operations.  You may require locking depending on your application.  See [Advisory Locking](#advisory-locking) below.

## Deleting Records

To delete a record, call the [delete()](#delete) method.  This is immediate and permanent.  Pass in the key, and a callback.

```javascript
storage.delete( 'test1', function(err) {
	if (err) throw err;
} );
```

# Storing Binary Blobs

To store a binary value, pass a filled `Buffer` object as the value, and specify a key ending in a "file extension", e.g. `.gif`.  The latter requirement is so the engine can detect which records are binary and which are JSON, just by looking at the key.  Example:

```javascript
var fs = require('fs');
var buffer = fs.readFileSync('picture.gif');
storage.put( 'test1.gif', buffer, function(err) {
	if (err) throw err;
} );
```

When fetching a binary record, a `Buffer` object will be passed to your callback:

```javascript
var fs = require('fs');
storage.get( 'test1.gif', function(err, buffer) {
	if (err) throw err;
	fs.writeFileSync('picture.gif', buffer);
} );
```

# Using Streams

You can store and fetch records using [streams](https://nodejs.org/api/stream.html), so as to not load content into memory.  This can be used to manage extremely large files in a memory-limited environment.  Note that the record content is treated as binary, so the keys *must* contain file extensions.  To store an object using a readable stream, call the [putStream()](#putstream) method.  Similarly, to fetch a readable stream to a record, call the [getStream()](#getstream) method.

Example of storing a record by spooling the data from a file:

```js
var fs = require('fs');
var stream = fs.createReadStream('picture.gif');

storage.putStream( 'test1.gif', stream, function(err) {
	if (err) throw err;
} );
```

Example of fetching a read stream and spooling it to a file:

```js
var fs = require('fs');
var writeStream = fs.createWriteStream('/var/tmp/downloaded.gif');

storage.getStream( 'test1.gif', function(err, readStream) {
	if (err) throw err;
	writeStream.on('finish', function() {
		// data is completely written
	} );
	readStream.pipe( writeStream );
} );
```

Please note that not all the storage engines support streams natively, so the content may actually be loaded into RAM in the background.  Namely, as of this writing, the Couchbase API does not support streams, so they are currently simulated for that engine.  Streams *are* supported natively for both the Filesystem and Amazon S3 engines.

# Expiring Data

By default all records live indefinitely, and have no predetermined lifespan.  However, you can set an expiration date on any record, and it will be deleted on that day by the daily maintenance job (see [Daily Maintenance](#daily-maintenance) below).  Note that there is no support for an expiration *time*, but rather only a date.

To set the expiration date for a record, call the [expire()](#expire) method, passing in the key and the desired expiration date.  This function completes instantly and requires no callback.  The date argument can be a JavaScript `Date` object, any supported date string (e.g. `YYYY-MM-DD`), or Epoch seconds.  Example:

```javascript
storage.expire( 'test1', '2015-05-12' );
```

It is wasteful to call this multiple times for the same record and the same date.  It adds extra work for the maintenance job, as each call adds an event in a list that must be iterated over.  It should only be called once per record, *or when extending the expiration date to a future day*.

When extending the expiration on a record that has already had [expire()](#expire) called on it, you need to do two things.  First, call [expire()](#expire) again with the new expiration date.  Then, add an `expires` key to your record, set to the same new expiration date, and save it using [put()](#put).  This is a hint to the maintenance job to ignore the first expiration date, and use the second one instead.  Example:

```javascript
var new_exp_date = '2015-05-12';
storage.expire( 'test1', new_exp_date );

storage.get( 'test1', function(err, data) {
	if (err) throw err;
	data.expires = new_exp_date;
	storage.put( 'test1', data, function(err) {
		if (err) throw err;
	} );
} );
```

You can skip the call to [get()](#get) if your record is already loaded in memory.  Just add the `expires` key/value and save it out.  The format can be any supported date string, or Epoch seconds.

Expiration dates may be set on binary records, *but they cannot be updated*.  This is because there is no way to add an `expires` key when the record is not in JSON format.

The reason for this extra hoop you have to jump through is that, by design, the storage system doesn't keep any metadata on your records (it doesn't store the expiration date for you).  The call to [expire()](#expire) simply adds the key to a list of records for deletion on the selected day.  So when *updating* the expiration date, there is no easy / quick way to remove the key from the "to be deleted" list on the old day.  So instead, the maintenance job tries to load the JSON of every record it is about to delete, and looks for the `expires` property, to determine if it can indeed delete, or if it should skip the record.  This will likely be completely redesigned in v2.0.

# Advisory Locking

The storage system provides a simple, in-memory advisory locking mechanism.  All locks are based on a specified key and exclusive.  You can choose to wait for a lock to be released, or fail immediately if the resource is already locked.  To lock a key, call [lock()](#lock), and to unlock it call [unlock()](#unlock).

Here is a simple use case:

```javascript
storage.lock( 'test1', true, function() {
	// key is locked, now we can fetch
	storage.get( key, function(err, data) {
		if (err) {
			storage.unlock('test1');
			throw err;
		}
		
		// increment counter
		data.counter++;
		
		// save back to storage
		storage.put( 'test1', data, function(err) {
			if (err) {
				storage.unlock('test1');
				throw err;
			}
			
			// and finally unlock
			storage.unlock('test1');
		} ); // put
	} ); // get
} ); // lock
```

The above example is a typical counter increment pattern using advisory locks.  The `test1` record is locked, fetched, its counter incremented, written back to disk, then finally unlocked.  The idea is, even though all the storage operations are async, all other requests for this record will block until the lock is released.  Remember that you always need to call `unlock()`, even if throwing an error.

Please note that these locks are implemented in RAM, so they only exist in the current Node.js process.  This is really only designed for single-process daemons, and clusters with one master server doing writes.

# Lists

A list is a collection of JSON records which can grow or shrink at either end, and supports fast random access.  It's basically a double-ended linked list, but implemented internally using "pages" of N records per page, and each page can be randomly accessed.  This allows for great speed with pushing, popping, shifting, unshifting, and random access, with a list of virtually any size.  Methods are also provided for iterating, searching and splicing, but those often involve reading / writing many pages, so use with caution.

All list operations that write data will automatically lock the list using [Advisory Locking](#advisory-locking), and unlock it when complete.

## List Page Size

List items are stored in groups called "pages", and each page can hold up to N items (the default is 50).  The idea is, when you want to store or fetch multiple items at once, the storage engine only has to read / write a small amount of records.  The downside is, fetching or storing a single item requires the whole page to be loaded and saved, so it is definitely optimized for batch operations.

You can configure how many items are allowed in each page, by changing the default [page size](#list_page_size) in your storage configuration, or setting it per list by passing an option to [listCreate()](#listcreate).

Care should be taken when calculating your list page sizes.  It all depends on how large your items will be, and how many you will be storing / fetching at once.  Note that you cannot easily change the list page size on a populated list (this may be added as a future feature).

## Creating Lists

To create a list, call [listCreate()](#listcreate).  Specify the desired key, options, and a callback function.  You can optionally pass in a custom page size via the second argument (otherwise it'll use the default size):

```javascript
storage.listCreate( 'list1', { page_size: 100 }, function(err) {
	if (err) throw err;
} );
```

You can also store your own key/value pairs in the options object, which are retrievable via the [listGetInfo()](#listgetinfo) method.  However, beware of name collision -- better to prefix your own option keys with something unique.

## Pushing, Popping, Shifting, Unshifting List Items

Lists can be treated as arrays to a certain extent.  Methods are provided to [push](#listpush), [pop](#listpop), [shift](#listshift) and [unshift](#listunshift) items, similar to standard array methods.  These are all extremely fast operations, even with huge lists, as they only read/write the pages that are necessary.  Note that all list items must be objects (they cannot be other JavaScript primitives).

Examples:

```javascript
// push onto the end
storage.listPush( 'list1', { username: 'tsmith', age: 25 }, function(err) {
	if (err) throw err;
} );

// pop off the end
storage.listPop( 'list1', function(err, item) {
	if (err) throw err;
} );

// shift off the beginning
storage.listShift( 'list1', function(err, item) {
	if (err) throw err;
} );

// unshift onto the beginning
storage.listUnshift( 'list1', { username: 'fwilson', age: 40 }, function(err) {
	if (err) throw err;
} );
```

Furthermore, the [listPush()](#listpush) and [listUnshift()](#listunshift) methods also accept multiple items by passing an array of objects, so you can add in bulk.

## Fetching List Items

Items can be fetched from lists by calling [listGet()](#listget), and specifying an index offset starting from zero.  You can fetch any number of items at a time, and the storage engine will figure out which pages need to be loaded.  To fetch items from the end of a list, use a negative index.  Example use:

```javascript
storage.listGet( 'list1', 40, 5, function(err, items) {
	if (err) throw err;
} );
```

This would fetch 5 items starting at item index 40 (zero-based).  To fetch the entire list, set the index and length to zero:

```javascript
storage.listGet( 'list1', 0, 0, function(err, items) {
	if (err) throw err;
} );
```

## Splicing Lists

You can "splice" a list just like you would an array.  That is, cut a chunk out of a list at any location, and optionally replace it with a new chunk, similar to the built-in JavaScript [Array.splice()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice) function.  [listSplice()](#listsplice) is a highly optimized method which only reads/writes the pages it needs, but note that if the list length changes as a result of your splice (i.e. you insert more or less than you remove) it does have to rewrite multiple pages up to the last page, to take up the slack or add new pages.  So please use with caution on large lists.

Here is an example which removes 2 items at index 40, and replaces with 2 new items:

```javascript
var new_items = [
	{ username: 'jhuckaby', age: 38, gender: 'male' },
	{ username: 'sfields', age: 34, gender: 'female' }
];
storage.listSplice( 'list1', 40, 2, new_items, function(err, items) {
	if (err) throw err;
	// 'items' will contain the 5 removed items
} );
```

You don't have to insert the same number of items that you remove.  You can actually remove zero items, and only insert new ones at the specified location.

As with [listGet()](#listget) you can specify a negative index number to target items from the end of the list, as opposed to the beginning.

## Sorted Lists

While it is possible to manually sort your list by fetching all the items as an array, sorting it in memory, then rewriting the entire list, this can be quite time consuming.  Instead, you can perform a [listInsertSorted()](#listinsertsorted) when adding items to a list.  This will find the correct location for a single item based on sorting criteria, and then splice it into place, keeping the list sorted as you go.  Example:

```javascript
var new_user = {
	username: 'jhuckaby', 
	age: 38, 
	gender: 'male' 
};

storage.listInsertSorted( 'users', new_user, ['username', 1], function(err) {
	if (err) throw err;
	// item inserted successfully
} );
```

That third argument is an array of sort criteria, consisting of the property name to sort by (e.g. `username`) and a sort direction (`1` for ascending, `-1` for descending).  You can alternately specify a comparator function here, which is called with the item you are inserting, and the item to compare it to.  This is similar to the built-in [Array.sort()](), which should return `1` or `-1` depending on if your item should come after, or before, the second item.  Example:

```javascript
var new_user = {
	username: 'jhuckaby', 
	age: 38, 
	gender: 'male' 
};

var comparator = function(a, b) {
	return( (a.username < b.username) ? -1 : 1 );
};

storage.listInsertSorted( 'users', new_user, comparator, function(err) {
	if (err) throw err;
	// item inserted successfully
} );
```

For large lists, this can still take considerable time, as it is iterating over the list to locate the correct location, and then performing a splice which grows the list, requiring all the remaining pages to be rewritten.  So please use with caution.

## Iterating Over List Items

Need to iterate over the items in your list, but don't want to load the entire thing into memory?  Use the [listEach()](#listeach) method.  Example:

```javascript
storage.listEach( 'list1', function(item, idx, callback) {
	// do something with item, then fire callback
	callback();
}, 
function(err) {
	if (err) throw err;
	// all items iterated over
} );
```

Your iterator function is passed the item and a special callback function, which must be called when you are done with the current item.  Pass it an error if you want to prematurely abort the loop, and jump to the final callback (the error will be passed through to it).  Otherwise, pass nothing to the iterator callback, to notify all is well and you want the next item in the list.

## Searching Lists

Several methods are provided for searching through lists for items matching a set of criteria.  Use [listFind()](#listfind) to find and retrieve a single item, [listFindCut()](#listfindcut) to find and delete, [listFindReplace()](#listfindreplace) to find and replace, [listFindUpdate()](#listfindupdate) to find and apply updates, or [listFindEach()](#listfindeach) to find multiple items and iterate over them.

All of these methods accept a "criteria" object, which may have one or more key/value pairs.  These must *all* match a list item for it to be selected.  For example, if you have a list of users, and you want to find a male with blue eyes, you would pass a criteria object similar to this:

```javascript
{
	gender: "male",
	eyes: "blue"
}
```

Alternatively, you can use regular expression objects for the criteria values, for more complex matching.  Example:

```javascript
{
	gender: /^MALE$/i,
	eyes: /blu/
}
```

Example of finding a single object with [listFind()](#listfind):

```javascript
storage.listFind( 'list1', { username: 'jhuckaby' }, function(err, item, idx) {
	if (err) throw err;
} );
```

Example of finding and deleting a single object with [listFindCut()](#listfindcut):

```javascript
storage.listFindCut( 'list1', { username: 'jhuckaby' }, function(err, item) {
	if (err) throw err;
} );
```

Example of finding and replacing a single object with [listFindReplace()](#listfindreplace):

```javascript
var criteria = { username: 'jhuckaby' };
var new_item = { username: 'huckabyj', foo: 'bar' };

storage.listFindReplace( 'list1', criteria, new_item, function(err) {
	if (err) throw err;
} );
```

Example of finding and updating a single object with [listFindUpdate()](#listfindupdate):

```javascript
var criteria = { username: 'jhuckaby' };
var updates = { gender: 'male', age: 38 };

storage.listFindUpdate( 'list1', criteria, updates, function(err, item) {
	if (err) throw err;
} );
```

You can also increment or decrement numerical properties with [listFindUpdate()](#listfindupdate).  If an item key exists and is a number, you can set any update key to a string prefixed with `+` (increment) or `-` (decrement), followed by the delta number (int or float), e.g. `+1`.  So for example, imagine a list of users, and an item property such as `number_of_logins`.  When a user logs in again, you could increment this counter like this:

```javascript
var criteria = { username: 'jhuckaby' };
var updates = { number_of_logins: "+1" };

storage.listFindUpdate( 'list1', criteria, updates, function(err, item) {
	if (err) throw err;
} );
```

And finally, here is an example of finding *all* items that match our criteria using [listFindEach()](#listfindeach), and iterating over them:

```javascript
storage.listFindEach( 'list1', { gender: 'male' }, function(item, idx, callback) {
	// do something with item, then fire callback
	callback();
}, 
function(err) {
	if (err) throw err;
	// all matched items iterated over
} );
```

## Copying, Renaming Lists

To duplicate a list and all of its items, call [listCopy()](#listcopy), specifying the old and new key.  Example:

```javascript
storage.listCopy( 'list1', 'list2', function(err) {
	if (err) throw err;
} );
```

To rename a list, call [listRename()](#listrename).  This is basically just a [listCopy()](#listcopy) followed by a [listDelete()](#listdelete).  Example:

```javascript
storage.listRename( 'list1', 'list2', function(err) {
	if (err) throw err;
} );
```

With both of these functions, it is highly recommended you make sure the destination (target) key is empty before copying or renaming onto it.  If a list already exists at the destination key, it will be overwritten, but if the new list has differently numbered pages, some of the old list pages may still exist and occupy space, detached from their old parent list.  So it is always safest to delete first.

## Deleting Lists

To delete a list and all of its items, call [listDelete()](#listdelete).  The second argument should be a boolean set to `true` if you want the list *entirely* deleted including the header (options, page size, etc.), or `false` if you only want the list *cleared* (delete the items only, leaving an empty list behind).  Example:

```javascript
storage.listDelete( 'list1', true, function(err) {
	if (err) throw err;
	// list is entirely deleted
} );
```

## List Internals

Lists consist of a header record, and then records for each page.  The header is literally just a simple JSON record, stored at the exact key specified for the list.  So if you created an empty list with key `mylist`, and then you fetched the `mylist` record using a simple [get()](#get), you'd see this:

```javascript
{
	type: 'list',
	length: 0,
	page_size: 50,
	first_page: 0,
	last_page: 0
}
```

This is the list header record, which defines the list and its pages.  Here are descriptions of the header properties:

| Property | Description |
|----------|-------------|
| `type` | A static identifier, which will always be set to `list`. |
| `length` | How many items are currently in the list. |
| `page_size` | How many items are stored per page. |
| `first_page` | The page number of the beginning of the list. |
| `last_page` | The page number of the end of the list. |

The list pages are stored as records "under" the main key, by adding a slash, followed by the page number.  So if you pushed one item onto the list, the updated header record would look like this:

```javascript
{
	type: 'list',
	length: 1,
	page_size: 50,
	first_page: 0,
	last_page: 0
}
```

Notice that the `first_page` and `last_page` are both still set to `0`, even though we added an item to the list.  That's because pages are zero-based, and the algorithm will fill up page `0` (`50` items in this case) before adding a new page.

So then if you then fetched the key `mylist/0` you'd actually get the raw page data, which is a JSON record with an `items` array:

```javascript
{
	items: [
		{ username: "jhuckaby", gender: "male" }
	]
}
```

This array will keep growing as you add more items.  Once it reaches 50, however, the next item pushed will go into a new page, with key `mylist/1`.  That's basically how the paging system works.

Remember that lists can grow from either end, so if the first page is filled and you *unshift* another item, it actually adds page `mylist/-1`.

The two "end pages" can have a variable amount of items, up to the `page_size` limit.  The algorithm then creates new pages as needed.  But the *inner* pages that exist between the first and last pages will *always* have the full amount (i.e. `page_size`) of items.  Never more, never less.  So as future list operations are executed, the system will always maintain this rule.

# Daily Maintenance

If you plan on expiring records for future deletion (see [Expiring Data](#expiring-data) above), you should enable the nightly maintenance job.  This will iterate over all the records that expired on the current day, and actually delete them.  To do this, set the [maintenance](#maintenance) key in your storage configuration, and set it to a `HH::MM` string:

```javascript
{
	"maintenance": "04:30" // run daily at 4:30 AM
}
```

This is mainly for daemons that run 24x7.  Also, there is no automated recovery if the server was down when the maintenance job was supposed to run.  So you may need to call `storage.runMaintenance()` manually for those rare cases, and pass in today's date (or the date when it should have ran), and a callback.

# Plugin Development

New engine plugins can easily be added.  All you need to do is create a class that implements a few standard API methods, and then load your custom engine using the [engine_path](#engine_path) configuration parameter.

Here are the API methods your class should define:

| API Method | Arguments | Description |
|--------|-----------|-------------|
| `startup()` | CALLBACK | Optional, called as the server starts up. Fire the callback when your engine is ready. |
| `put()` | KEY, VALUE, CALLBACK | Store the key/value pair, and then fire the callback. |
| `head()` | KEY, CALLBACK | Optional, fetch any metadata you may have about the record, and fire the callback. |
| `get()` | KEY, CALLBACK | Fetch the key, and pass the value to the callback. |
| `delete()` | KEY, CALLBACK | Delete the specified key, then fire the callback. |
| `shutdown()` | CALLBACK | Optional, called as the server shuts down. Fire the callback when your engine has stopped. |

It is recommended you use the [pixl-class](https://www.npmjs.com/package/pixl-class) class framework, and inherit from the `pixl-server/component` base class.  This implements some useful methods such as `logDebug()`.

Here is an example skeleton class you can start from:

```javascript
var Class = require("pixl-class");
var Component = require("pixl-server/component");

module.exports = Class.create({
	
	__name: 'MyEngine',
	__parent: Component,
	
	startup: function(callback) {
		// setup initial connection
		var self = this;
		this.logDebug(2, "Setting up MyEngine");
		callback();
	},
	
	put: function(key, value, callback) {
		// store record given key and value
		callback();
	},
	
	head: function(key, callback) {
		// retrieve metadata on record (mod, len)
		callback();
	},
	
	get: function(key, callback) {
		// fetch record value given key
		callback();
	},
	
	delete: function(key, callback) {
		// delete record
		callback();
	},
	
	shutdown: function(callback) {
		// shutdown storage
		this.logDebug(2, "Shutting down MyEngine");
		callback();
	}
	
});
```

# API Reference

Here are all the public methods you can call in the storage class.  These examples all assume you have your preloaded `Storage` component instance in a local variable named `storage`.  The component instance can be retrieved from a running server like this:

```javascript
var storage = server.Storage;
```

## put

```javascript
storage.put( KEY, VALUE, CALLBACK );
```

The `put()` method stores a key/value pair.  It will create the record if it doesn't exist, or replace it if it does.  All keys should be strings.  The value may be an object or a `Buffer` (for binary blobs).  Objects are auto-serialized to JSON.  Your callback function is passed an error if one occurred.  Example:

```javascript
storage.put( 'test1', { foo: 'bar1' }, function(err) {
	if (err) throw err;
} );
```

For binary values, the key *must* contain a file extension, e.g. `test1.gif`.  Example:

```javascript
var fs = require('fs');
var buffer = fs.readFileSync('picture.gif');
storage.put( 'test1.gif', buffer, function(err) {
	if (err) throw err;
} );
```

## putMulti

```javascript
storage.putMulti( RECORDS, CALLBACK );
```

The `putMulti()` method stores multiple keys/values at once, from a specified object containing both.  Depending on your storage [concurrency](#concurrency) configuration, this may be significantly faster than storing the records in sequence.  Example:

```javascript
var records = {
	multi1: { fruit: 'apple' },
	multi2: { fruit: 'orange' },
	multi3: { fruit: 'banana' }
};
storage.putMulti( records, function(err) {
	if (err) throw err;
} );
```

## putStream

```javascript
storage.putStream( KEY, STREAM, CALLBACK );
```

The `putStream()` method stores a record using a [readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable), so it doesn't have to be read into memory.  This can be used to spool very large files to storage without using any RAM.  Note that this is treated as a binary record, so the key *must* contain a file extension, e.g. `test1.gif`.  Example:

```javascript
var fs = require('fs');
var stream = fs.createReadStream('picture.gif');
storage.putStream( 'test1.gif', stream, function(err) {
	if (err) throw err;
} );
```

## get

```javascript
storage.get( KEY, CALLBACK );
```

The `get()` method fetches a value given a key.  If the record is an object, it will be returned as such.  Or, if the record is a binary blob, a `Buffer` object will be returned.  Your callback function is passed an error if one occurred, and the data value for the given record.  Example:

```javascript
storage.get( 'test1', function(err, data) {
	if (err) throw err;
} );
```

## getMulti

```javascript
storage.getMulti( KEYS, CALLBACK );
```

The `getMulti()` method fetches multiple values at once, from a specified array of keys.  Depending on your storage [concurrency](#concurrency) configuration, this may be significantly faster than fetching the records in sequence.  Your callback function is passed an array of values which correspond to the specified keys.  Example:

```javascript
storage.getMulti( ['test1', 'test2', 'test3'], function(err, values) {
	if (err) throw err;
	// values[0] will be the test1 record.
	// values[1] will be the test2 record.
	// values[2] will be the test3 record.
} );
```

## getStream

```javascript
storage.getStream( KEY, CALLBACK );
```

The `getStream()` method retrieves a [readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) to a given record's data, so it can be read or piped to a writable stream.  This is for very large records, so nothing is loaded into memory.  Example of spooling to a local file:

```javascript
var fs = require('fs');
var writeStream = fs.createWriteStream('/var/tmp/downloaded.gif');

storage.getStream( 'test1.gif', function(err, readStream) {
	if (err) throw err;
	writeStream.on('finish', function() {
		// data is completely written
	} );
	readStream.pipe( writeStream );
} );
```

## head

```javascript
storage.head( KEY, CALLBACK );
```

The `head()` method fetches metadata about an object given a key, without fetching the object itself.  This generally means that the object size, and last modification date are retrieved, however this is engine specific.  Your callback function will be passed an error if one occurred, and an object containing at least two keys:

| Key | Description |
| --- | ----------- |
| `mod` | The last modification date of the object, in Epoch seconds. |
| `len` | The size of the object value in bytes. |

Example:

```javascript
storage.head( 'test1', function(err, data) {
	if (err) throw err;
	// data.mod
	// data.len
} );
```

Please note that as of this writing, the `Couchbase` engine has no native API, so the `head()` method has to load the entire record.  It does return the record size in to the `len` property, but there is no way to retrieve the last modified date.

## headMulti

```javascript
storage.headMulti( KEYS, CALLBACK );
```

The `headMulti()` method pings multiple records at once, from a specified array of keys.  Depending on your storage [concurrency](#concurrency) configuration, this may be significantly faster than pinging the records in sequence.  Your callback function is passed an array of values which correspond to the specified keys.  Example:

```javascript
storage.headMulti( ['test1', 'test2', 'test3'], function(err, values) {
	if (err) throw err;
	// values[0] will be the test1 head info.
	// values[1] will be the test2 head info.
	// values[2] will be the test3 head info.
} );
```

## delete

```javascript
storage.delete( KEY, CALLBACK );
```

The `delete()` method deletes an object given a key.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.delete( 'test1', function(err) {
	if (err) throw err;
} );
```

## deleteMulti

```javascript
storage.deleteMulti( KEYS, CALLBACK );
```

The `deleteMulti()` method deletes multiple records at once, from a specified array of keys.  Depending on your storage [concurrency](#concurrency) configuration, this may be significantly faster than pinging the records in sequence.  Example:

```javascript
storage.deleteMulti( ['test1', 'test2', 'test3'], function(err) {
	if (err) throw err;
} );
```

## copy

```javascript
storage.copy( OLD_KEY, NEW_KEY, CALLBACK );
```

The `copy()` method copies a value from one key and stores it at another.  If the destination record doesn't exist it is created, otherwise it is replaced.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.copy( 'test1', 'test2', function(err) {
	if (err) throw err;
} );
```

**Note:** This is a compound function containing multiple sequential engine operations (in this case a `get` and a `put`).  You may require locking depending on your application.  See [lock()](#lock) and [unlock()](#unlock) below.

## rename

```javascript
storage.rename( OLD_KEY, NEW_KEY, CALLBACK );
```

The `rename()` method copies a value from one key, stores it at another, and deletes the original key.  If the destination record doesn't exist it is created, otherwise it is replaced.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.rename( 'test1', 'test2', function(err) {
	if (err) throw err;
} );
```

**Note:** This is a compound function containing multiple sequential engine operations (in this case a `get`, `put` and `delete`).  You may require locking depending on your application.  See [lock()](#lock) and [unlock()](#unlock) below.

## lock

```javascript
storage.lock( KEY, WAIT, CALLBACK );
```

The `lock()` method implements an in-memory advisory locking system, where you can request an exclusive lock on a particular key, and optionally wait for it to be unlocked.  It is up to you to call [unlock()](#unlock) for every record that you lock, even in the case of an error.

If you pass `true` for the wait argument and the specified record is already locked, your request is added to a queue and invoked in a FIFO manner.  If you pass `false` and the resource is locked, an error is passed to your callback immediately.

## unlock

```javascript
storage.unlock( KEY );
```

The `unlock()` method releases an advisory lock on a particular record, specified by its key.  This is a synchronous function with no callback.  For a usage example, see [Advisory Locking](#advisory-locking) above.

## expire

```javascript
storage.expire( KEY, DATE );
```

The `expire()` method sets an expiration date on a record given its key.  The date can be any string, Epoch seconds or `Date` object.  The daily maintenance system will automatically deleted all expired records when it runs (assuming it is enabled -- see [Daily Maintenance](#daily-maintenance)).  Example:

```javascript
var exp_date = ((new Date()).getTime() / 1000) + 86400; // tomorrow
storage.expire( 'test1', exp_date );
```

The earliest you can set a record to expire is the next day, as the maintenance script only runs once per day, typically in the early morning, and it only processes records expiring on the current day.

## listCreate

```javascript
storage.listCreate( KEY, OPTIONS, CALLBACK );
```

The `listCreate()` method creates a new, empty list.  Specify the desired key, options (see below) and a callback function.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.listCreate( 'list1', {}, function(err) {
	if (err) throw err;
} );
```

Unless otherwise specified, the list will be created with the default [page size](#list_page_size) (number of items per page).  However, you can override this in the options object by passing a `page_size` property:

```javascript
storage.listCreate( 'list1', { page_size: 100 }, function(err) {
	if (err) throw err;
} );
```

## listPush

```javascript
storage.listPush( KEY, ITEMS, CALLBACK );
```

Similar to the standard [Array.push()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push), the `listPush()` method pushes one or more items onto the end of a list.  The list will be created if it doesn't exist, using the default [page size](#list_page_size).  `ITEMS` can be a single object, or an array of objects.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.listPush( 'list1', { username: 'jhuckaby', age: 38 }, function(err) {
	if (err) throw err;
} );
```

## listUnshift

```javascript
storage.listUnshift( KEY, ITEMS, CALLBACK );
```

Similar to the standard [Array.unshift()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift), the `listUnshift()` method unshifts one or more items onto the beginning of a list.  The list will be created if it doesn't exist, using the default [page size](#list_page_size).  `ITEMS` can be a single object, or an array of objects.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.listUnshift( 'list1', { username: 'jhuckaby', age: 38 }, function(err) {
	if (err) throw err;
} );
```

## listPop

```javascript
storage.listPop( KEY, CALLBACK );
```

Similar to the standard [Array.pop()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop), the `listPop()` method pops one single item off the end of a list, and returns it.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  The second argument will be the popped item, if successful.  Example:

```javascript
storage.listPop( 'list1', function(err, item) {
	if (err) throw err;
} );
```

If the list is empty, an error is not generated, but the item will be `null`.

## listShift

```javascript
storage.listShift( KEY, CALLBACK );
```

Similar to the standard [Array.shift()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift), the `listShift()` method shifts one single item off the beginning of a list, and returns it.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  The second argument will be the shifted item, if successful.  Example:

```javascript
storage.listShift( 'list1', function(err, item) {
	if (err) throw err;
} );
```

If the list is empty, an error is not generated, but the item will be `null`.

## listGet

```javascript
storage.listGet( KEY, INDEX, LENGTH, CALLBACK );
```

The `listGet()` method fetches one or more items from a list, given the key, the starting index number (zero-based), the number of items to fetch (defaults to the entire list), and a callback.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  The second argument will be an array of the fetched items, if successful.  Example:

```javascript
storage.listGet( 'list1', 40, 5, function(err, items) {
	if (err) throw err;
} );
```

This would fetch 5 items starting at item index 40 (zero-based).

You can specify a negative index number to fetch items from the end of the list.  For example, to fetch the last 3 items in the list, use `-3` as the index, and `3` as the length.

Your callback function is also passed the list info object as a 3rd argument, in case you need to know the list length, page size, or first/last page positions.

## listSplice

```javascript
storage.listSplice( KEY, INDEX, LENGTH, NEW_ITEMS, CALLBACK );
```

Similar to the standard [Array.splice()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice), the `listSplice()` method removes a chunk of items from a list, optionally replacing it with a new chunk of items.  You must specify the list key, the index number of the first item to remove (zero-based), the number of items to remove (can be zero), an array of replacement items (can be empty or null), and finally a callback.

Your callback function is passed an error if one occurred, otherwise it'll be falsey.  The second argument will be an array of the removed items, if successful.  Example:

```javascript
storage.listSplice( 'list1', 40, 5, [], function(err, items) {
	if (err) throw err;
} );
```

This example would remove 5 items starting at item index 40, and replace with nothing (no items inserted).  The list size would shrink by 5, and the spliced items would be passed to your callback in an array.

## listFind

```javascript
storage.listFind( KEY, CRITERIA, CALLBACK );
```

The `listFind()` method will search a list for a particular item, based on a criteria object, and return the first item found to your callback.  The criteria object may have one or more key/value pairs, which must *all* match a list item for it to be selected.  Criteria values may be any JavaScript primitive (string, number, etc.), or a regular expression object for more complex matching.

Your callback function is passed an error if one occurred, otherwise it'll be falsey.  If an item was found matching your criteria, the second argument will be the item itself, and the 3rd argument will be the item's index number (zero-based).  Example:

```javascript
storage.listFind( 'list1', { username: 'jhuckaby' }, function(err, item, idx) {
	if (err) throw err;
} );
```

If an item is not found, an error is not generated.  However, the `item` will be null, and the `idx` will be `-1`.

## listFindCut

```javascript
storage.listFindCut( KEY, CRITERIA, CALLBACK );
```

The `listFindCut()` method will search a list for a particular item based on a criteria object, and if found, it'll delete it (remove it from the list using [listSplice()](#listsplice)).  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  If an item was found matching your criteria, the second argument will be the item itself.  Example:

```javascript
storage.listFindCut( 'list1', { username: 'jhuckaby' }, function(err, item) {
	if (err) throw err;
} );
```

## listFindReplace

```javascript
storage.listFindReplace( KEY, CRITERIA, NEW_ITEM, CALLBACK );
```

The `listFindReplace()` method will search a list for a particular item based on a criteria object, and if found, it'll replace it with the specified item.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
var criteria = { username: 'jhuckaby' };
var new_item = { username: 'huckabyj', foo: 'bar' };

storage.listFindReplace( 'list1', criteria, new_item, function(err) {
	if (err) throw err;
} );
```

## listFindUpdate

```javascript
storage.listFindUpdate( KEY, CRITERIA, UPDATES, CALLBACK );
```

The `listFindUpdate()` method will search a list for a particular item based on a criteria object, and if found, it'll "update" it with the keys/values specified.  Meaning, they are merged in with the existing item, adding new keys or replacing existing ones.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  If an item was found matching your criteria, the second argument will be the item itself, with all the updates applied.  Example:

```javascript
var criteria = { username: 'jhuckaby' };
var updates = { gender: 'male', age: 38 };

storage.listFindUpdate( 'list1', criteria, updates, function(err, item) {
	if (err) throw err;
} );
```

You can also increment or decrement numerical properties with this function.  If an item key exists and is a number, you can set any update key to a string prefixed with `+` (increment) or `-` (decrement), followed by the delta number (int or float), e.g. `+1`.  So for example, imagine a list of users, and an item property such as `number_of_logins`.  When a user logs in again, you could increment this counter like this:

```javascript
var criteria = { username: 'jhuckaby' };
var updates = { number_of_logins: "+1" };

storage.listFindUpdate( 'list1', criteria, updates, function(err, item) {
	if (err) throw err;
} );
```

## listFindEach

```javascript
storage.listFindEach( KEY, CRITERIA, ITERATOR, CALLBACK );
```

The `listFindEach()` method will search a list for a *all* items that match a criteria object, and fire an iterator function for each one.  The criteria object may have one or more key/value pairs, which must all match a list item for it to be selected.  Criteria values may be any JavaScript primitive (string, number, etc.), or a regular expression object for more complex matching. 

Your `ITERATOR` function is passed the item, the item index number, and a special callback function which must be called when you are done with the current item.  Pass it an error if you want to prematurely abort the loop, and jump to the final callback (the error will be passed through to it).  Otherwise, pass nothing to the iterator callback, to notify all is well and you want the next matched item.

Your `CALLBACK` function is called when the loop is complete and all items were iterated over, or an error occurred somewhere in the middle.  It is passed an error object, or something falsey for success.  Example:

```javascript
storage.listFindEach( 'list1', { username: 'jhuckaby' }, function(item, idx, callback) {
	// do something with item, then fire callback
	callback();
}, 
function(err) {
	if (err) throw err;
	// all matched items iterated over
} );
```

## listInsertSorted

```javascript
storage.listInsertSorted( KEY, ITEM, COMPARATOR, CALLBACK );
```

The `listInsertSorted()` method inserts an item into a list, while keeping it sorted.  It doesn't resort the entire list every time, but rather it locates the correct position to insert the one item, based on sorting criteria, then performs a splice to insert it into place.  Example:

```javascript
var new_user = {
	username: 'jhuckaby', 
	age: 38, 
	gender: 'male' 
};

var comparator = function(a, b) {
	return( (a.username < b.username) ? -1 : 1 );
};

storage.listInsertSorted( 'users', new_user, comparator, function(err) {
	if (err) throw err;
	// item inserted successfully
} );
```

If your sorting criteria is simple, i.e. a single top level property sorted ascending or descending, you can specify an array containing the key to sort by, and a direction (`1` for ascending, `-1` for descending), instead of a comparator function.  Example:

```javascript
storage.listInsertSorted( 'users', new_user, ['username', 1], function(err) {
	if (err) throw err;
} );
```

## listCopy

```javascript
storage.listCopy( OLD_KEY, NEW_KEY, CALLBACK );
```

The `listCopy()` method copies a list and all its items to a new key.  Specify the existing list key, a new key, and a callback.  If anything exists at the destination key, it is clobbered.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.listCopy( 'list1', 'list2', function(err) {
	if (err) throw err;
} );
```

If a list already exists at the destination key, you should delete it first.  It will be overwritten, but if the new list has differently numbered pages, some of the old list pages may still exist and occupy space, detached from their old parent list.  So it is always safest to delete first.

## listRename

```javascript
storage.listRename( OLD_KEY, NEW_KEY, CALLBACK );
```

The `listRename()` method renames (moves) a list and all its items to a new key.  Specify the existing list key, a new key, and a callback.  If anything exists at the destination key, it is clobbered.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.listRename( 'list1', 'list2', function(err) {
	if (err) throw err;
} );
```

If a list already exists at the destination key, you should delete it first.  It will be overwritten, but if the new list has differently numbered pages, some of the old list pages may still exist and occupy space, detached from their old parent list.  So it is always safest to delete first.

## listEach

```javascript
storage.listEach( KEY, ITERATOR, CALLBACK );
```

The `listEach()` method iterates over a list one item at a time, invoking your `ITERATOR` function for each item.  This is similar to how the [async eachSeries()](https://www.npmjs.com/package/async#eachSeries) method works (in fact, it is used internally for each list page).  The list pages are loaded one at a time, as to not fill up memory with huge lists.

Your iterator function is passed the item, the item index number, and a special callback function which must be called when you are done with the current item.  Pass it an error if you want to prematurely abort the loop, and jump to the final callback (the error will be passed through to it).  Otherwise, pass nothing to the iterator callback, to notify all is well and you want the next item in the list.

Your `CALLBACK` function is finally called when the loop is complete and all items were iterated over, or an error occurred somewhere in the middle.  It is passed an error object, or something falsey for success.  Example:

```javascript
storage.listEach( 'list1', function(item, idx, callback) {
	// do something with item, then fire callback
	callback();
}, 
function(err) {
	if (err) throw err;
	// all items iterated over
} );
```

## listGetInfo

```javascript
storage.listGetInfo( KEY, CALLBACK );
```

The `listGetInfo()` method retrieves information about the list, without loading any items.  Specifically, it fetches the list length, first and last page numbers, page size, and any custom keys you passed to the `OPTIONS` object when first creating the list.  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  The second argument will be the list info object, if successful.  Example:

```javascript
storage.listGetInfo( 'list1', function(err, list) {
	if (err) throw err;
} );
```

Here are the keys you can expect to see in the info object:

| Key | Description |
|-----|-------------|
| `length` | Total number of items in the list. |
| `first_page` | Number of the first page in the list. |
| `last_page` | Number of the last page in the list. |
| `page_size` | Number of items per page. |

## listDelete

```javascript
storage.listDelete( KEY, ENTIRE, CALLBACK );
```

The `listDelete()` method deletes a list.  If you pass `true` for the second argument, the *entire* list will be deleted, including the header (options, page size, etc.).  Otherwise the list will simply be "cleared" (all items deleted).  Your callback function is passed an error if one occurred, otherwise it'll be falsey.  Example:

```javascript
storage.listDelete( 'list1', true, function(err) {
	if (err) throw err;
} );
```

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
