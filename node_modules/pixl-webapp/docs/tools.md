# Overview

This module contains a set of miscellaneous utility functions that don't fit into any particular category.

# Usage

The tools library is provided as a JavaScript file that you must include in your web page:

```html
	<script type="text/javascript" src="tools.js"></script>
```

That's it!  The library is now available to your page.  Make sure you include the library near the top of your file, above all your other code.  Example usage:

```javascript
	var id = generate_unique_id();
```

# Function List

Here are all the functions included in the tools library, with links to full descriptions and examples:

| Function Name | Description |
|---------------|-------------|
| [parse_query_string()](#parse_query_string) | Parses a URL query string into key/value pairs. |
| [compose_query_string()](#compose_query_string) | Takes an object and serializes it into a URL query string. |
| [get_text_from_bytes()](#get_text_from_bytes) | Get a human-readable string from a number of bytes (e.g. `150 MB`). |
| [get_bytes_from_text()](#get_bytes_from_text) | Parse a human-readable size string into raw bytes. |
| [ucfirst()](#ucfirst) | Upper-case the first character of a string, lower-case the rest. |
| [commify()](#commify) | Add commas to a positive integer in U.S. style, e.g. `1,000,000`. |
| [short_float()](#short_float) | Shorten floating-point decimal to 2 places, unless they are zeros. |
| [pct()](#pct) | Return percentage given a number along a sliding scale from 0 to 'max' |
| [get_text_from_seconds()](#get_text_from_seconds) | Convert raw seconds to human-readable relative time, e.g. `4 hours`. |
| [get_text_from_seconds_round()](#get_text_from_seconds_round) | Convert raw seconds to human-readable relative time, but round instead of floor. |
| [get_seconds_from_text()](#get_seconds_from_text) | Parse a human-readable time string into raw seconds. |
| [get_inner_window_size()](#get_inner_window_size) | Get width and height of inner browser window, in pixels. |
| [get_scroll_xy()](#get_scroll_xy) | Get page scroll offset (X and Y) in pixels. |
| [get_scroll_max()](#get_scroll_max) | Get maximum page scroll width/height in pixels. |
| [hires_time_now()](#hires_time_now) | Get high-resolution Epoch timestamp of current date/time. |
| [str_value()](#str_value) | Get friendly string value for display purposes. |
| [pluralize()](#pluralize) | Pluralize a word using English language rules. |
| [render_menu_options()](#render_menu_options) | Return HTML for a set of menu options. |
| [dirname()](#dirname) | Return path excluding file at end (same as POSIX function of same name). |
| [basename()](#basename) | Return filename, strip path (same as POSIX function of same name). |
| [strip_ext()](#strip_ext) | Strip extension from filename or URL. |
| [load_script()](#load_script) | Dynamically load script into DOM. |
| [compose_attribs()](#compose_attribs) | Convert object into `Key="Value"` formatted attributes for HTML elements. |
| [compose_style()](#compose_style) | Convert object into `key:value;` formatted pairs for style (inline CSS) attribute. |
| [truncate_ellipsis()](#truncate_ellipsis) | Simple truncate string with ellipsis if beyond specified max length. |
| [escape_text_field_value()](#escape_text_field_value) | Escape text field string value, with stupid IE support. |
| [expando_text()](#expando_text) | If text is longer than max chars, chop with ellipsis and include link to show all. |
| [get_int_version()](#get_int_version) | Convert 3-part version string into integer for comparison with another. |
| [get_unique_id()](#get_unique_id) | Get unique ID using MD5, hires time, pseudo-random number and static counter. |
| [escape_regexp()](#escape_regexp) | Escape text for use in a regular expression. |

## parse_query_string

```
	OBJECT parse_query_string( URL )
```

This function parses a standard URL query string, and returns a hash with key/value pairs for every query parameter.  Duplicate params are clobbered, the latter prevails.  Values are URL-unescaped, and all of them are strings.  The function accepts a full URL, or just the query string portion.

```javascript
	var url = 'http://something.com/hello.html?foo=bar&baz=12345';
	var query = parse_query_string( url );
	var foo = query.foo; // "bar"
	var baz = query.baz; // "12345"
```

## compose_query_string

```
	STRING compose_query_string( OBJECT )
```

This function takes a hash of key/value pairs, and constructs a URL query string out of it.  Values are URL-escaped.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var qs = compose_query_string( my_hash );
	// --> "?foo=bar&baz=12345"
```

## get_text_from_bytes

```
	STRING get_text_from_bytes( BYTES, PRECISION )
```

This function generates a human-friendly text string given a number of bytes.  It reduces the units to K, MB, GB or TB as needed, and allows a configurable amount of precision after the decimal point.  The default is one decimal of precision (specify as `1`, `10`, `100`, etc.).

```javascript
	var str = get_text_from_bytes( 0 );    // "0 bytes"
	var str = get_text_from_bytes( 1023 ); // "1023 bytes"
	var str = get_text_from_bytes( 1024 ); // "1 K"
	var str = get_text_from_bytes( 1126 ); // "1.1 K"
	
	var str = get_text_from_bytes( 1599078, 1 ); // "1 MB"
	var str = get_text_from_bytes( 1599078, 10 ); // "1.5 MB"
	var str = get_text_from_bytes( 1599078, 100 ); // "1.52 MB"
	var str = get_text_from_bytes( 1599078, 1000 ); // "1.525 MB"
```

## get_bytes_from_text

```
	INTEGER get_bytes_from_text( STRING )
```

This function parses a string containing a human-friendly size count (e.g. `45 bytes` or `1.5 MB`) and converts it to raw bytes.

```javascript
	var bytes = get_bytes_from_text( "0 bytes" ); // 0
	var bytes = get_bytes_from_text( "1023 bytes" ); // 1023
	var bytes = get_bytes_from_text( "1 K" ); // 1024
	var bytes = get_bytes_from_text( "1.1k" ); // 1126
	var bytes = get_bytes_from_text( "1.525 MB" ); // 1599078	
```

## ucfirst

```
	STRING ucfirst( STRING )
```

The function upper-cases the first character of a string, and lower-cases the rest.  This is very similar to the Perl core function of the same name.  Example:

```javascript
	var first_name = ucfirst( 'george' );
	// --> "George"
```

## commify

```
	STRING commify( INTEGER )
```

This function adds commas to long numbers following US-style formatting rules (add comma every 3 digits counting from right side).  Only positive integers are supported.

```javascript
	var c = commify( 123 ); // "123"
	var c = commify( 1234 ); // "1,234"
	var c = commify( 1234567890 ); // "1,234,567,890"
```

## short_float

```
	NUMBER short_float( NUMBER )
```

This function "shortens" a floating point number by only allowing two digits after the decimal point, *unless they are zeros*.

```javascript
	var short = short_float( 0.12345 ); // 0.12
	var short = short_float( 0.00001 ); // 0.00001
	var short = short_float( 0.00123 ); // 0.0012
```

## pct

```
	STRING pct( AMOUNT, MAX, FLOOR )
```

This function calculates a percentage given an arbitrary numerical amount and a maximum value, and returns a formatted string with a '%' symbol.  Pass `true` as the 3rd argument to floor the percentage to the nearest integer.  Otherwise the value is shortened with `shortFloat()`.

```javascript
	var p = pct( 5, 10 ); // "50%"
	var p = pct( 0, 1 );  // "0%"
	var p = pct( 751, 1000 ); // "75.1%"
	var p = pct( 751, 1000, true ); // "75%"
```

## get_text_from_seconds

```
	STRING get_text_from_seconds( NUMBER, ABBREVIATE, SHORTEN )
```

This function generates a human-friendly time string given a number of seconds.  It reduces the units to minutes, hours or days as needed.  You can also abbreviate the output, and shorten the extra precision.

```javascript
	var str = get_text_from_seconds( 0 ); // "0 seconds"
	var str = get_text_from_seconds( 86400 ); // "1 day"
	var str = get_text_from_seconds( 90 ); // "1 minute, 30 seconds"
	var str = get_text_from_seconds( 90, true ); // "1 min, 30 sec"
	var str = get_text_from_seconds( 90, false, true ); // "1 minute"
	var str = get_text_from_seconds( 90, true, true ); // "1 min"
```

## get_text_from_seconds_round

```
	STRING get_text_from_seconds_round( NUMBER, ABBREVIATE )
```

This function generates a human-friendly time string given a number of seconds.  It reduces the units to minutes, hours or days as needed, but rounds to the nearest whole unit.  You can also abbreviate the output if desired.

```javascript
	var str = get_text_from_seconds_round( 0 ); // "0 seconds"
	var str = get_text_from_seconds_round( 85000 ); // "1 day"
	var str = get_text_from_seconds_round( 89 ); // "1 minute"
	var str = get_text_from_seconds_round( 90 ); // "2 minutes"
	var str = get_text_from_seconds_round( 90, true ); // "2 min"
```

## get_seconds_from_text

```
	INTEGER get_seconds_from_text( STRING )
```

This function parses a string containing a human-friendly time (e.g. `45 minutes` or `7 days`) and converts it to raw seconds.  It accepts seconds, minutes, hours, days and/or weeks.  It does not interpret "months" or "years" because those are non-exact measurements.

```javascript
	var sec = get_seconds_from_text( "1 second" ); // 1
	var sec = get_seconds_from_text( "2min" ); // 120
	var sec = get_seconds_from_text( "30m" ); // 1800
	var sec = get_seconds_from_text( "12 HOURS" ); // 43200
	var sec = get_seconds_from_text( "1day" ); // 86400
```

## get_inner_window_size

```
	OBJECT get_inner_window_size( VOID )
```

This function measures the browser's inner window size (the total amount of pixel space available), and returns an object with `width` and `height` properties.  Guaranteed to work in all modern browsers, including IE6 and up.  Example:

```javascript
	var size = get_inner_window_size();
	// --> { width: 1120, height: 950 }
```

## get_scroll_xy

```
	OBJECT get_scroll_xy( VOID )
```

This function returns the current window scroll offset, and returns an object with `x` and `y` properties.  Guaranteed to work in all modern browsers, including IE6 and up.  Example:

```javascript
	var offset = get_scroll_xy();
	// --> { x: 0, y: 175 }
```

## get_scroll_max

```
	OBJECT get_scroll_max( VOID )
```

This function measures the total window scroll area.  That is, if the page HTML content stretches beyond the window bounds and scrollbars are present, this returns an object representing the maximum scroll width and height.  Guaranteed to work in all modern browsers, including IE6 and up.  Example:

```javascript
	var size = get_scroll_max();
	// --> { width: 1120, height: 3784 }
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

## str_value

```
	STRING str_value( MIXED )
```

This function provides a nice way to coerce a value into a string.  For example, if the value passed in is `undefined` or `null`, an empty string is returned.  If a number or other non-string is passed in, it is converted to a string, and returned.  Example:

```javascript
	var str = str_value( undefined ); // ""
	var str = str_value( null ); // ""
	var str = str_value( 123 ); // "123"
	var str = str_value( "Z" ); // "Z"
```

## pluralize

```
	STRING pluralize( STRING, NUMBER )
```

This function pluralizes a string using US-English rules, given an arbitrary number.  This is useful when constructing human-friendly sentences containing a quantity of things, and you wish to say either "thing" or "things" depending on the number.

```javascript
	var list = ['apple', 'orange', 'banana'];
	var text = "You have " + list.length + pluralize(" item", list.length) + " in your list.";
	// --> "You have 3 items in your list.";
```

## render_menu_options

```
	HTML render_menu_options( ITEMS, SELECTED, AUTO_ADD )
```

This functions composes HTML for a set of menu options, i.e. `<option>` elements, with provided values and text, and returns a string.  It can auto-select a specific value if desired, and automatically add it to the list if missing.  Example:

```javascript
	var list = ['Apple', 'Orange', 'Banana'];
	var html = render_menu_options( list, 'Orange' );
``

This would produce the following HTML (compacted together on one line):

```html
	<option value="Apple">Apple</option>
	<option value="Orange" selected="selected">Orange</option>
	<option value="Banana">Banana</option>
```

If you need to vary the option values and display text, you can use one of three different formats.  A nested array with the first sub-element set to the value, and the 2nd the display label, an array of hashes with `data` and `label` properties, or an array of hashes with `id` and `title` properties.  Examples:

```javascript
	var list = [
		['AAPL','Apple'], 
		['ORNG','Orange'], 
		['BANA','Banana']
	];
	var list = [
		{ data: 'AAPL', label: 'Apple' },
		{ data: 'ORNG', label: 'Orange' },
		{ data: 'BANA', label: 'Banana' }
	];
	var list = [
		{ id: 'AAPL', title: 'Apple' },
		{ id: 'ORNG', title: 'Orange' },
		{ id: 'BANA', title: 'Banana' }
	];
```

In each of the three cases, the HTML output would be the same:

```html
	<option value="AAPL">Apple</option>
	<option value="ORNG" selected="selected">Orange</option>
	<option value="BANA">Banana</option>
```

## dirname

```
	STRING dirname( STRING )
```

This function returns the directory path portion of a string, sans the final slash and filename.  It tries to emulate the POSIX function of the same name.  It should also work on URLs.  Example:

```javascript
	var path = '/var/www/html/index.html';
	var dir = dirname( path );
	// --> "/var/www/html"
```

## basename

```
	STRING basename( STRING )
```

This function returns the filename portion of a string, sans the parent directory path and slash.  It tries to emulate the POSIX function of the same name.  It should also work on URLs.  Example:

```javascript
	var path = '/var/www/html/index.html';
	var filename = basename( path );
	// --> "index.html"
```

## strip_ext

```
	STRING strip_ext( STRING )
```

This function strips the extension from the end of a filename, file path or URL.  Example:

```javascript
	var path = '/var/www/html/index.html';
	var filename = strip_ext( basename( path ) );
	// --> "index"
```

## load_script

```
	VOID load_script( URL )
```

This function dynamically loads a JavaScript file given a URL (can be partial, relative to the page).  The script is loaded by appending a `SCRIPT` element to the document `HEAD`.  Example:

```javascript
	load_script( 'js/myscript/js' );
```

## compose_attribs

```
	STRING compose_attribs( OBJECT )
```

This function takes an object containing key/value pairs, and serializes them into HTML/XML attributes, returning the resulting string.  Example:

```javascript
	var attribs = { type: 'text', name: 'username', size: 20, value: 'frank' };
	var html = "<input " + compose_attribs(attribs) + ">";
	// --> '<input type="text" name="username" size="20" value="frank">'
```

## compose_style

```
	STRING compose_style( OBJECT )
```

This function takes an object containing key/value pairs, and serializes them into CSS style rules, returning the resulting string.  Example:

```javascript
	var style = { margin:0, padding:0, 'font-size':'12px', color:'red' };
	var html = '<div style="' + compose_style(style) + '"></div>';
	// --> '<div style="margin:0; padding:0; font-size:12px; color:red;"></div>'
```

## escape_text_field_value

```
	STRING escape_text_field_value( STRING )
```

This function escapes a string for insertion into raw HTML markup, specifically into the `value` attribute of a form element.  For example, if a string contains special characters such as angle brackets or quotes, these will be converted into HTML entities.  Also, undefined / null values will become empty strings.  Example:

```javascript
	var tricky_username = "frank<joe>";
	var html = '<input type="text" id="username" value="'+escape_text_field_value(tricky_username)+'">';
	// --> '<input type="text" id="username" value="frank&lt;joe&gt;">'
```

## truncate_ellipsis

```
	STRING truncate_ellipsis( STRING, LENGTH )
```

This function will truncate (chop) a string at a specified length, and append an ellipsis (...) to indicate the string was chopped.  Note that the string is chopped 3 characters shy of the specified amount, to make room for the ellipsis.  Example:

```javascript
	var text = "The quick brown fox jumped over the lazy, sleeping dog.";
	var short_text = truncate_ellipsis( text, 20 );
	// --> "The quick brown f..."
```

## expando_text

```
	STRING expando_text( STRING, LENGTH, LINK )
```

This function will truncate (chop) a string at a specified length, and append an ellipsis (...) to indicate the string was chopped.  It will also add an HTML link (customizable text) that when clicked, will fully expand the text and show the original full string, removing the ellipsis and link.  Example:

```javascript
	var text = "The quick brown fox jumped over the lazy, sleeping dog.";
	var html = expando_text( text, 20, "More" );
```

The HTML link will contain an `onMouseUp` event and use [jQuery](http://jquery.com/) to expand the text.

## get_int_version

```
	INTEGER get_int_version( STRING, PADDING )
```

This function takes a 3-part version string (e.g. `1.25.3`), and converts it to an integer for comparison with other versions.  Basically, it pads each number with zeroes, and combines them into one single integer.  Example:

```javascript
	var version = '2.5.1';
	var int_ver = get_int_version(version);
	// --> 2005001
```

## get_unique_id

```
	STRING get_unique_id( LENGTH, SALT )
```

This function generates a pseudo-random alphanumeric (hexadecimal) ID by combining various bits of local entropy, and hashing it together with [MD5](http://en.wikipedia.org/wiki/MD5).  The default length is 32 characters, but you can pass in any lesser length to chop it.  If you want to add your own entropy (salt string), pass it as the 2nd argument.

```javascript
	var id = get_unique_id();
	var id = get_unique_id( 16 );
	var id = get_unique_id( 32, "my extra entropy!" );
```

## escape_regexp

```
	STRING escape_regexp( STRING )
```

This function escapes a string so that it can be used inside a regular expression.  Meaning, any regular expression metacharacters are prefixed with a backslash, so they are interpreted literally.  It was taken from the [MDN Regular Expression Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).

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

