# Overview

This module provides an easy way to track high resolution performance metrics in your app.  Basically, you wrap your function calls or async operations you want to measure with `begin()` and `end()` calls, provide IDs for each metric, and the library provides a summary report whenever you want one.  You can also increment arbitrary counters, and include that data in the report as well.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install pixl-perf
```

Then use `require()` to load it in your code:

```javascript
var Perf = require('pixl-perf');
```

To use the module, instantiate an object, and start tracking.  The first thing you should do is call `begin()` without any arguments, which starts the overall tracking system.  Similar, the last thing you should do is call `end()` also with no arguments.  These allow the system to track a "total time elapsed".  Example:

```javascript
var perf = new Perf();
perf.begin(); // start overall tracking

// do stuff here

perf.end(); // end all tracking
```

To track individual metrics, simply pass an identifier key to `begin()` and `end()`.  Here is an example for tracking something synchronous:

```javascript
var perf = new Perf();
perf.begin(); // start overall tracking

perf.begin('json_parse');
var obj = JSON.parse("{ ...some long JSON document here... }");
perf.end('json_parse');

perf.end(); // end all tracking
```

You can overlap and nest multiple metrics inside each other.  For example, you could have an overall `db` metric for database operations, but also an inner `db_query` for the actual DB query time.

```javascript
var perf = new Perf();
perf.begin(); // start overall tracking

perf.begin('db');
// connect to db here

	perf.begin('db_query');
	// run db query here
	perf.end('db_query');

// disconnect from db here
perf.end('db');

perf.end(); // end all tracking
```

For tracking asynchronous operations, a little extra care is needed.  We can't simply call `end()` with a plain key, because multiple Node "threads" may be running the same operation at the same time.  So in this case, we can use the return value of `begin()` as a promise.  `begin()` always returns a special unique tracker object, which has its own `end()` method on it.

```javascript
var perf = new Perf();
perf.begin(); // start overall tracking

var tracker = perf.begin('something'); // begin measuring 'something'
setTimeout( function() {
	// one second later...
	tracker.end(); // done with something
	
	perf.end(); // end all tracking
	console.log("Perf Metrics: ", perf.metrics());
}, 1000 );
```

This way, if your app happens to call the same code multiple times simultaneously, each one will have its own unique tracker object, and not clobber each other.  When `end()` is called on the tracker object, it merges the results back into the main instance it was spawned from.

As you can see, the above example also introduces the `metrics()` method, for fetching a summary of all our measurements.  This would output something like the following:

```
Perf Metrics:  { scale: 1000,
  perf: { total: 1005.205, something: 1004.982 },
  counters: {} }
```

The `metrics()` method returns all the performance metrics recorded up to the current point.  It will *not* include metrics still in progress (i.e. those not ended).  It consists of the following components:

The `scale` is the current scale at which time is measured, compared to 1.0 seconds (see [Scale and Precision](#scale-and-precision) below).  In the above example and the default, time is measured in milliseconds.

The `perf` object contains keys for every measured metric (`something` for this example) with the values set to the total elapsed time.  The library will also add a `total` key, containing the total overall measured time.

The `counters` object is a special container for "counters", which can measure any arbitrary number instead of elapsed time.  They are explained below in [Counters](#counters).

Note that all measurements are cumulative, so you can call `begin()` and `end()` multiple times with the same keys, and it'll simply add to those metrics.  It is up to you how often you want to call `metrics()` or the related output methods, and possibly `reset()` to reset the tracker and start over.

See [Output Formats](#output-formats) for other available output formats, which may be more suitable for your application.

## Counters

In addition to tracking elapsed time, you can also have the library track any arbitrary number, called a "counter".  These are accessible by the `count()` method, and accept any number, integer or float, positive or negative.  This can do things such as increment line counters for processing a file, or count the number of DB queries or other actions that took place.  These counters are included in summary reports, and can be used to calculate averages, or just displayed as is.  Example:

```javascript
var perf = new Perf();
perf.begin(); // start overall tracking

// increment some counters
perf.count('lines');
perf.count('db_queries', 2);
perf.count('something', 0.0001);

perf.end(); // end all tracking
console.log("Perf Metrics: ", perf.metrics());
```

As you can see, you can call `count()` without a number argument (which defaults to `1`), or pass it any integer or float.  The above example would output:

```
Perf Metrics:  { scale: 1000,
  perf: { total: 0.297 },
  counters: { lines: 1, db_queries: 2, something: 0.0001 } }
```

## Scale and Precision

By default, the library tracks all metrics using milliseconds, and allows up to 3 digits after the decimal point.  You can customize both of these things, by calling `setScale()` which sets the time scale, and/or `setPrecision()` which controls the precision (the number of digits after the decimal).  Examples:

```javascript
var perf = new Perf();

perf.setScale( 1000000000 ); // nanoseconds
perf.setScale( 1000000 ); // microseconds
perf.setScale( 1000 ); // milliseconds
perf.setScale( 1 ); // seconds

perf.setPrecision( 1 ); // integers only
perf.setPrecision( 10 ); // 1 digit after the decimal
perf.setPrecision( 100 ); // 2 digits after the decimal
perf.setPrecision( 1000 ); // 3 digits after the decimal
```

So for example, if you wanted to track time in nanoseconds, but only use integers, set the two accordingly:

```javascript
perf.setScale( 1000000000 ); // nanoseconds
perf.setPrecision( 1 ); // integers only
```

Or, if you wanted to track time in seconds, but have floating point precision up to 6 digits after the decimal, call:

```javascript
perf.setScale( 1 ); // seconds
perf.setPrecision( 1000000 ); // 6 digits after the decimal
```

Another way to think about time scale is that you're basically telling the library how to represent "one second".  So, with a value of '1' passed to `setScale()`, one second will appear as `1.0` (or thereabouts, give or take some decimal points), whereas a value of `1000` will be reported as `1000.0` or the like.

The current time scale is always returned in the response from `metrics()` and related output methods (useful for analysis and reporting tools).

## Output Formats

Previously you've seen the output of the `metrics()` method, which returns an object containing your performance metrics.  The library also provides two other output formats, `json()` and `summarize()`.

Calling `json()` will simply return a JSON serialized string of the metrics object.  This is merely a convenience, as you could just as easily call `JSON.stringify()` yourself, but whatever, it's there if you want it.  Example:

```js
{"scale":1,"perf":{"total":1.006985,"something":1.006581},"counters":{"lines":1,"db_queries":2,"something":0.0001}}
```

Calling `summarize()` will return a flattened summarization of the metrics in psuedo-query-string format.  This is useful for some logs or analysis / reporting systems which don't support native JSON.  Example:

```
scale=1&total=1.00728&something=1.006581&c_lines=1&c_db_queries=2&c_something=0.0001
```

As you can see, all the information is in the summary, but it is represented with ampersand-delimited key/value pairs similar to a URL query string.  Counters are always at the end, and prefixed with `c_` to avoid key collisions.

## Resetting

You can call `reset()` to reset the performance tracker to start a new session.  Don't forget to call `begin()` again, without a key, to start tracking the total time.  It will preserve your scale and precision settings.

## Importing

You can import performance metrics from another `pixl-perf` object by calling the `import()` method.  This will merge in all the metrics and counters from the specified object, adding new keys or appending elapsed time to existing keys.  If the two classes have different scale settings, the values are converted as they are imported.  Example:

```js
perf.import( other_perf );
```

Note that this only imports individual named metrics, and not the total time.

You can optionally prefix all the keys of the imported metrics, so they don't collide with your own keys.  Example:

```js
perf.import( other_perf, 'other_' );
```

This would prefix all of the `other_perf` keys with the string `other_`.

Importing works with both `pixl-perf` class instances, as well as generic objects returned from `metrics()`.

## Advanced

If you need low-level access to the performance tracking internals, here are a few ways to do that:

First, if you need access to the internal object used to track all the time based metrics (both in progress and completed), call `get()`.  This will return an object with keys for each metric, with the value being a sub-object containing `start` and possibly `end` timestamps (these are from `process.hrtime()`), and also an `elapsed` key if the metric has been "ended".  The `elapsed` stores the cumulative elapsed time in the selected time scale, but note that the precision has not yet been applied (so it may have more decimals than you want).

Second, if you need access to the raw counters object, call `getCounters()`.  This will return an object with keys for each counter, and the values will simply be the current amount on the counter.

Finally, if you need to simply fetch the current elapsed time for one single metric, call `elapsed()` and pass in the key of the metric you wish to retrieve.  Pass `true` as the second argument to massage the value into the current precision setting (i.e. trim excess decimals if required).  Note that the metric must be "ended" for this to work.

### Total Key

To change the name of the total key, set the `totalKey` property to whatever string you want.  It defaults to `total`.  Example:

```js
var perf = new Perf();
perf.totalKey = 't';
```

### Special MinMax Mode

This optional mode allows you to accumulate data about multiple performance measurements over time, and then fetch a summary.  Basically, when enabled, it tracks the minimum, average, maximum, total and counts for each named metric.  All this accumulated data is then made available via a summary API.

This mode is useful when your application measures the same metric multiple times.  Then, instead of logging performance for each measurement, you can log a summary of all the min/avg/max metrics over a larger time period (last second, last minute, etc.).

To enable the feature, set the `minMax` property to true, then begin taking multiple measurements.  Example use:

```js
var perf = new Perf();
perf.minMax = true;

for (var idx = 0; idx < 100; idx++) {
	perf.begin('load_data');
		// do something loady
	perf.end('load_data');

	perf.begin('save_data');
		// do something savey
	perf.end('save_data');
}
```

When you are done collecting measurements, call the `getMinMaxMetrics()` method to fetch a summary of all the minimums, averages, maximums, totals and counts for all your named metrics.  Example:

```js
var metrics = perf.getMinMaxMetrics();
```

This returns an object which contains a property for each of your metrics, and the values are sub-objects containing `min`, `max`, `total`, `count` and `avg` properties.  Example:

```js
{
	"load_data": {
		"min": 0.132,
		"max": 8.828,
		"total": 319.99,
		"count": 100,
		"avg": 1.285
	},
	"save_data": {
		"min": 0.784,
		"max": 7.367,
		"total": 198.952,
		"count": 100,
		"avg": 1.591
	}
}
```

The values are all converted to the correct scale and precision for your `pixl-perf` object.

Note that the `total` metric is ignored in this mode.  This is as designed, because total is only ever measured once, and this mode is more for collecting multiple measurements and fetching metrics for them over time.

However, what you can do is use *two* types of `pixl-perf` objects, one to collect basic metrics (including a total) and another to accumulate them with `minMax`.  You can import metrics from one into the other using the `import()` method.  Example:

```js
var a = new Perf();
a.begin();
	// do something
a.end();

var b = new Perf();
b.begin();
	// do something
b.end();

var perf = new Perf();
perf.minMax = true;
perf.totalKey = 'unused';

// import from a and b
perf.import( a );
perf.import( b );

var metrics = perf.getMinMaxMetrics();
```

This would accumulate the metrics from `a` and `b` into the `perf` object and include their totals.  The trick here is setting the `totalKey` to `"unused"` (really any string other than the default `total`).  This allows `import()` to import the totals from `a` and `b`, which it normally wouldn't do.

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
