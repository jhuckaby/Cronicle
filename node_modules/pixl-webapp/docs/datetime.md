# Overview

This module contains a set of static functions for dealing with dates and times.  Note that some of the functions require [jQuery](http://jquery.com/) to work properly.

# Usage

The tools library is provided as a JavaScript file that you must include in your web page:

```html
	<script type="text/javascript" src="datetime.js"></script>
```

That's it!  The library is now available to your page.  Make sure you include the library near the top of your file, above all your other code.  Example usage:

```javascript
	var nice = get_nice_date_time( time_now() );
```

# Function List

Here are all the functions included in the tools library, with links to full descriptions and examples:

| Function Name | Description |
|---------------|-------------|
| [time_now()](#time_now) | Get integer Epoch timestamp of current date/time. |
| [hires_time_now()](#hires_time_now) | Get high-resolution Epoch timestamp of current date/time. |
| [get_date_args()](#get_date_args) | Parse date/time into individual components suitable for display. |
| [get_time_from_args()](#get_time_from_args) | Recalculate Epoch seconds given object from `get_date_args()`. |
| [yyyy()](#yyyy) | Return the year in `YYYY` format given Epoch (defaults to current). |
| [yyyy_mm_dd()](#yyyy_mm_dd) | Return date in `YYYY/MM/DD` format given Epoch (defaults to today). |
| [mm_dd_yyyy()](#mm_dd_yyyy) | Return date in `MM/DD/YYYY` format given Epoch (defaults to today). |
| [normalize_time()](#normalize_time) | Normalize (quantize) time by zeroing specified units. |
| [get_nice_date()](#get_nice_date) | Return formatted date suitable for display. |
| [get_nice_time()](#get_nice_time) | Return formatted time suitable for display. |
| [get_nice_date_time()](#get_nice_date_time) | Return formatted date/time suitable for display. |
| [get_short_date_time()](#get_short_date_time) | Return short (abbreviated) date/time suitable for display. |
| [parse_date()](#parse_date) | Parse any local date/time string into Epoch seconds. |
| [check_valid_date()](#check_valid_date) | Return `true` if date is a valid string, `false` otherwise. |

## time_now

```
	NUMBER time_now( VOID )
```

This function returns the current time expressed as [Epoch Seconds](http://en.wikipedia.org/wiki/Unix_time), floored to the nearest second.

```javascript
	var epoch = time_now();
	// --> 1443319066
```

## hires_time_now

```
	NUMBER hires_time_now( VOID )
```

This function returns the current high-resolution time expressed as [Epoch Seconds](http://en.wikipedia.org/wiki/Unix_time), with floating point decimal milliseconds.

```javascript
	var epoch = hires_time_now();
	// --> 1443319066.124
```

## get_date_args

```
	OBJECT get_date_args( MIXED )
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
	var args = get_date_args( new Date() );
	var date_str = args.yyyy + '/' + args.mm + '/' + args.dd;
```

## get_time_from_args

```
	INTEGER get_time_from_args( OBJECT )
```

This function will recalculate a date given an `args` object as returned from [get_date_args()](#get_date_args).  It allows you to manipulate the `year`, `mon`, `mday`, `hour`, `min` and/or `sec` properties, and will return the computed Epoch seconds from the new set of values.  Example:

```javascript
	var args = get_date_args( new Date() );
	args.mday = 15;
	
	var epoch = get_time_from_args(args);
```

This example would return the Epoch seconds from the 15th day of the current month, in the current year, and using the current time of day.

## normalize_time

```
	INTEGER normalize_time( INTEGER, OBJECT )
```

This function will "normalize" (i.e. quantize) an Epoch value to the nearest minute, hour, day, month, or year.  Meaning, you can pass in an Epoch time value, and have it return a value of the start of the current hour, midnight on the current day, the 1st of the month, etc.  To do this, pass in an object containing any keys you wish to change, e.g. `year`, `mon`, `mday`, `hour`, `min` and/or `sec`.  Example:

```javascript
	var midnight = normalize_time( time_now(), { hour: 0, min: 0, sec: 0 } );
```

You can actually set the values to non-zero.  For example, to return the Epoch time of exactly noon today:

```javascript
	var noon = normalize_time( time_now(), { hour: 12, min: 0, sec: 0 } );
```

## yyyy

```
	STRING yyyy( EPOCH )
```

Returns the date year in `YYYY` format, given any Epoch timestamp (defaults to current year).  Example:

```javascript
	var year = yyyy( time_now() );
	// --> "2015"
```

## yyyy_mm_dd

```
	STRING yyyy_mm_dd( EPOCH, SEPARATOR )
```

Returns the date in `YYYY/MM/DD` format, given any Epoch timestamp (defaults to current day).  You can customize the separator by passing it as the 2nd argument (defaults to slash).  Example:

```javascript
	var today = yyyy_mm_dd( time_now(), '-' );
	// --> "2015-09-26"
```

## mm_dd_yyyy

```
	STRING mm_dd_yyyy( EPOCH, SEPARATOR )
```

Returns the date in `MM/DD/YYYY` format, given any Epoch timestamp (defaults to current day).  You can customize the separator by passing it as the 2nd argument (defaults to slash).  Example:

```javascript
	var today = mm_dd_yyyy( time_now(), '/' );
	// --> "09/26/2015"
```

## get_nice_date

```
	STRING get_nice_date( EPOCH, ABBREVIATE )
```

This function returns a "nice" (human-friendly) date string in the format `MONTH DD, YYYY`, given an Epoch timestamp.  If you pass `true` for the second argument, the month name is abbreviated to the first 3 characters.  Example:

```javascript
	var today = get_nice_date( time_now() );
	// --> "September 26, 2015"
	
	var today = get_nice_date( time_now(), true );
	// --> "Sep 26, 2015"
```

## get_nice_time

```
	STRING get_nice_time( EPOCH, SECONDS )
```

This function returns a "nice" (human-friendly) time string in the format `HH:MM[:SS] AM/PM`, given an Epoch timestamp.  If you pass `true` for the second argument, seconds are included.  Example:

```javascript
	var nice_time = get_nice_time( time_now() );
	// --> "11:37 PM"
	
	var nice_time = get_nice_time( time_now(), true );
	// --> "11:37:08 PM"
```

## get_nice_date_time

```
	STRING get_nice_date_time( EPOCH, SECONDS, ABBREVIATE )
```

This function returns a "nice" (human-friendly) date/time string in the format `MONTH DD, YYYY HH:MM[:SS] AM/PM`, given an Epoch timestamp.  The 2rd argument is a Boolean indicating whether seconds should be included in the time, and the 3rd argument indicates whether the month name should be abbreviated or not.  Example:

```javascript
	var str = get_nice_date_time( time_now() );
	// --> "September 26, 2015 11:37 PM"
	
	var str = get_nice_date_time( time_now(), true );
	// --> "September 26, 2015 11:37:08 PM"
	
	var str = get_nice_date_time( time_now(), true, true );
	// --> "Sep 26, 2015 11:37:08 PM"
```

## get_short_date_time

```
	STRING get_short_date_time( EPOCH )
```

The function returns a short date/time stamp in the format `MMM DD, YYYY HH:MM AM/PM`, given an Epoch timestamp.  This is the same as calling [get_nice_date_time()](#get_nice_date_time) with `false` for seconds, and `true` for abbreviate.  Example:

``javascript
	var str = get_short_date_time( time_now() );
	// --> "Sep 26, 2015 11:37 PM"
```

## parse_date

```
	INTEGER parse_date( STRING )
```

This function parses a local date/time string and returns Epoch seconds.  Note that this may throw an error if the date/time format cannot be parsed (depending on the user's browser).  Example use:

``javascript
	var when = parse_date( "2015/09/26 23:48:00" );
	// --> 1443336480
```

## check_valid_date

```
	BOOLEAN check_valid_date( STRING )
```

This function returns `true` if a date/time string is well-formed (can be parsed), or `false` otherwise.  This will not throw an error on malformed date strings.  Example:

``javascript
	var valid = check_valid_date( "2015/09/26 23:48:00" );
	// --> true
	
	var valid = check_valid_date( "015/0926 2-3::" );
	// --> false
```

# License

The MIT License

Copyright (c) 2004 - 2015 Joseph Huckaby

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

