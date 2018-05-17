# Overview

This module provides a lightweight, fast, easy-to-use XML parser which generates a simplified object / array tree.  This can be very useful for parsing XML server API responses and the like.  It is 100% pure JavaScript and has no dependencies.

* Pure JavaScript, no dependencies
* Fully synchronous operation, no callbacks
* Can preserve or flatten attributes
* Can serialize objects back to pretty-printed XML

# Usage

The XML library is provided as a JavaScript file that you must include in your web page:

```html
	<script type="text/javascript" src="xml.js"></script>
```

That's it!  The library is now available to your page.  Make sure you include the library near the top of your file, above all your other code.

Usage is as follows:

```javascript
	var myxml = '<?xml version="1.0"?><Document>' + 
		'<Simple>Hello</Simple>' + 
		'<Node Key="Value">Content</Node>' + 
		'</Document>';
	
	var parser = new XML({ text: myxml, preserveAttributes: true });
	var tree = parser.getTree();
	console.log(tree);
```

You can also manipulate the XML tree in memory, then have the library output XML again:

```javascript
	tree.Simple = "Hello2";
	tree.Node._Attribs.Key = "Value2";
	tree.Node._Data = "Content2";
	tree.New = "I added this";
	console.log( parser.compose() );
```

## Options

The `XML` constructor accepts a plain XML string, or it can be an object containing any of the following properties:

### text

The XML text to be parsed (string).

### preserveAttributes

This optional property, when set to `true`, will cause all XML attributes to be kept separate in their own sub-object called `_Attribs` for each element.

### attribsKey

This is the key used to identify XML attributes, when [preserveAttributes](#preserveattributes) is set to `true`.  It defaults to `_Attribs`.

### dataKey

This is the key used to identify string values of complex XML elements that contain both attributes and text.  It defaults to `_Data`.

## Composing XML

To compose XML back to a string, call the `compose()` method on your XML object.  It helps to parse using the [preserveAttributes](#preserveattributes) option for this, as it will honor the `_Attribs` sub-objects and convert them back into real XML attributes.

```javascript
	var parser = new XML({ text: myxml, preserveAttributes: true });
	var tree = parser.getTree();
	var output = parser.compose();
	console.log(output);
```

Note that elements and attributes may lose their original ordering, as hashes have an undefined key order.  However, to keep things consistent, they are both alphabetically sorted when serialized.

## Utility Functions

There are also a number of static utility functions provided in the `xml.js` file:

| Function Name | Description |
|---------------|-------------|
| [trim()](#trim) | Strip whitespace from beginning and end of string. |
| [encode_entities()](#encode_entities) | Encode basic HTML entities `<`, `>` and `&`. |
| [encode_attrib_entities()](#encode_attrib_entities) | Encode basic entities, plus quotes. |
| [decode_entities()](#decode_entities) | Decode basic HTML entities, and quotes. |
| [find_object()](#find_object) | Walk array looking for nested object matching criteria object. |
| [find_objects()](#find_objects) | Walk array gathering all nested objects that match criteria object. |
| [find_object_idx()](#find_object_idx) | Walk array looking for nested object matching criteria object, return index in outer array, not object itself. |
| [delete_object()](#delete_object) | Walk array looking for nested object matching criteria object, delete first object found. |
| [delete_objects()](#delete_objects) | Delete all objects in obj array matching criteria. |
| [always_array()](#always_array) | Wrap variable in array, unless it is already an array. |
| [hash_keys_to_array()](#hash_keys_to_array) | Creates an array out of all object keys (undefined order). |
| [hash_values_to_array()](#hash_values_to_array) | Creates an array out of all object values (undefined order). |
| [sort_array()](#sort_array) | Performs a custom sort on an array, using a specified nested key and direction. |
| [merge_objects()](#merge_objects) | Non-destructive shallow merge of two objects, return the combined one. |
| [copy_object()](#copy_object) | Makes a shallow copy of an object. |
| [deep_copy_object()](#deep_copy_object) | Makes a deep copy of an object. |
| [copy_into_object()](#copy_into_object) | Merge one hash into another (destructive). |
| [lookup_path()](#lookup_path) | Perform a `/filesystem/path/style` lookup in an object tree. |
| [isa_hash()](#isa_hash) | Determines if a variable is a hash (object) or not. |
| [isa_array()](#isa_array) | Determines if a variable is an array (or array-like) or not. |
| [first_key()](#first_key) | Returns the "first" key in an object (undefined order). |
| [num_keys()](#num_keys) | Returns the number of keys in an object. |
| [reverse_hash()](#reverse_hash) | Reverse the keys and values of a hash. |
| [rand_array()](#rand_array) | Return random element from array. |
| [find_in_array()](#find_in_array) | Return `true` if element is found in array, `false` otherwise. |

### trim

```
	STRING trim( STRING )
```

This function trims whitespace from the left and right sides of a string, returning the new string.  Example:

```javascript
	var text = "  Hello\n\t  ";
	console.log( trim(text) );
	// Would output: "Hello"
```

### encode_entities

```
	STRING encode_entities( STRING )
```

This function will take a string, and encode the three standard XML entities, ampersand (`&`), left-angle-bracket (`<`) and right-angle-bracket (`>`), into their XML-safe counterparts.  It returns the result.  Example:

```javascript
	var text = '<Hello>&<There>';
	console.log( encode_entities(text) );
	// Would output: &lt;Hello&gt;&amp;&lt;There&gt;
```

### encode_attrib_entities

```
	STRING encode_attrib_entities( STRING )
```

This function does basically the same thing as [encode_entities](#encode_entities), but it also includes encoding for single-quotes (`'`) and double-quotes (`"`).  It is used for encoding an XML string for composing into an attribute value.  It returns the result.  Example:

```javascript
	var text = '<Hello>"&"<There>';
	console.log( encode_attrib_entities(text) );
	// Would output: &lt;Hello&gt;&quot;&amp;&quot;&lt;There&gt;
```

### decode_entities

```
	STRING decode_entities( STRING )
```

This function decodes all the standard XML entities back into their original characters.  This includes ampersand (`&`), left-angle-bracket (`<`), right-angle-bracket (`>`), single-quote (`'`) and double-quote (`"`).  It is used when parsing XML element and attribute values.  Example:

```javascript
	var text = '&lt;Hello&gt;&quot;&amp;&quot;&lt;There&gt;';
	console.log( decode_entities(text) );
	// Would output: <Hello>"&"<There>
```

### find_object

```
	OBJECT find_object( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and returns the first item whose object has keys which match a given criteria hash.  If no objects match, `null` is returned.

```javascript
	var list = [
		{ id: 12345, name: "Joe", eyes: "blue" },
		{ id: 12346, name: "Frank", eyes: "brown" },
		{ id: 12347, name: "Cynthia", eyes: "blue" }
	];
	var criteria = { eyes: "blue" };
	
	var obj = find_object( list, criteria );
	// --> { id: 12345, name: "Joe", eyes: "blue" }
```

### find_objects

```
	ARRAY find_objects( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and returns all the items whose objects have keys which match a given criteria hash.

```javascript
	var list = [
		{ id: 12345, name: "Joe", eyes: "blue" },
		{ id: 12346, name: "Frank", eyes: "brown" },
		{ id: 12347, name: "Cynthia", eyes: "blue" }
	];
	var criteria = { eyes: "blue" };
	
	var objs = find_objects( list, criteria );
	// --> [{ id: 12345, name: "Joe", eyes: "blue" }, { id: 12347, name: "Cynthia", eyes: "blue" }]
```

### find_object_idx

```
	INTEGER find_object_idx( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and returns the first array index whose object has keys which match a given criteria hash.  If no objects match, `-1` is returned.

```javascript
	var list = [
		{ id: 12345, name: "Joe", eyes: "blue" },
		{ id: 12346, name: "Frank", eyes: "brown" },
		{ id: 12347, name: "Cynthia", eyes: "blue" }
	];
	var criteria = { eyes: "blue" };
	
	var idx = find_object_idx( list, criteria );
	// --> 0
```

### delete_object

```
	BOOLEAN delete_object( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and deletes the first item whose object has keys which match a given criteria hash.  It returns `true` for success or `false` if no matching object could be found.

```javascript
	var list = [
		{ id: 12345, name: "Joe", eyes: "blue" },
		{ id: 12346, name: "Frank", eyes: "brown" },
		{ id: 12347, name: "Cynthia", eyes: "blue" }
	];
	var criteria = { eyes: "blue" };
	
	delete_object( list, criteria );
	// list will now contain only Frank and Cynthia
```

### delete_objects

```
	INTEGER delete_objects( ARRAY, CRITERIA )
```

This function iterates over an array of hashes, and deletes all items whose objects have keys which match a given criteria hash.  It returns the number of objects deleted.

```javascript
	var list = [
		{ id: 12345, name: "Joe", eyes: "blue" },
		{ id: 12346, name: "Frank", eyes: "brown" },
		{ id: 12347, name: "Cynthia", eyes: "blue" }
	];
	var criteria = { eyes: "blue" };
	
	var count = delete_objects( list, criteria );
	// list will now contain only Frank
```

### always_array

```
	ARRAY always_array( MIXED )
```

This function will wrap anything passed to it into an array and return the array, unless the item passed is already an array, in which case it is simply returned verbatim.

```javascript
	var arr = always_array( maybe_array );
```

### hash_keys_to_array

```
	ARRAY hash_keys_to_array( OBJECT )
```

This function returns all the hash keys as an array.  Useful for sorting and then iterating over the sorted list.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var keys = hash_keys_to_array( my_hash ).sort();
	
	for (var idx = 0, len = keys.length; idx < len; idx++) {
		var key = keys[idx];
		// do something with key and my_hash[key]
	}
```

### hash_values_to_array

```
	ARRAY hash_values_to_array( OBJECT )
```

This function returns all the hash values as an array.  The keys are discarded.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var values = hash_values_to_array( my_hash );
	
	for (var idx = 0, len = values.length; idx < len; idx++) {
		var value = values[idx];
		// do something with value
	}
```

### merge_objects

```
	OBJECT merge_objects( OBJECT_A, OBJECT_B )
```

This function merges two objects together, and returns a new object which contains the combination of the two keys and values (shallow copy).  The 2nd object takes precedence over the first, in the event of duplicate keys.

```javascript
	var hash1 = { foo: "bar" };
	var hash2 = { baz: 12345 };
	var combo = merge_objects( hash1, hash2 );
```

### copy_object

```
	OBJECT copy_object( OBJECT )
```

This function performs a shallow copy of the specified hash, and returns the copy.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var my_copy = copy_object( my_hash );
```

### deep_copy_object

```
	OBJECT deep_copy_object( OBJECT )
```

This function performs a deep copy of the specified hash (uses `JSON.stringify()` and `JSON.parse()`), and returns the copy.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var my_copy = deep_copy_object( my_hash );
```

### copy_into_object

```
	VOID copy_into_object( OBJECT_A, OBJECT_B )
```

This function shallow-merges {OBJECT_B} into {OBJECT_A}.  There is no return value.  Existing keys are replaced in {OBJECT_A}.

```javascript
	var hash1 = { foo: "bar" };
	var hash2 = { baz: 12345 };
	copy_into_object( hash1, hash2 );
```

### lookup_path

```
	MIXED lookup_path( PATH, ARGS )
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
	
	var file = lookup_path( "/folder1/folder2/file2", tree );
	// --> "bar"
```

For walking into arrays, simply provide the index number of the element you want.

### isa_hash

```
	BOOLEAN isa_hash( MIXED )
```

This function returns `true` if the provided argument is a hash (object), `false` otherwise.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var is_hash = isa_hash( my_hash );
```

### isa_array

```
	BOOLEAN isa_array( MIXED )
```

This function returns `true` if the provided argument is an array (or is array-like), `false` otherwise.

```javascript
	var my_arr = [ "foo", "bar", 12345 ];
	var is_arr = isa_array( my_arr );
```

### num_keys

```
	INTEGER num_keys( OBJECT )
```

This function returns the number of keys in the specified hash.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var num = num_keys( my_hash ); // 2
```

### first_key

```
	STRING first_key( OBJECT )
```

This function returns the first key of the hash when iterating over it.  Note that hash keys are stored in an undefined order.

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var key = first_key( my_hash ); // foo or baz
```

### reverse_hash

```
	OBJECT reverse_hash( OBJECT )
```

This function shallow-copies an object, but swaps the keys and values.  It returns the new object.  Example:

```javascript
	var my_hash = { foo: "bar", baz: 12345 };
	var rev = reverse_hash( my_hash );
	// --> { "bar": "foo", "12345": "baz" };
```

### rand_array

```
	MIXED rand_array( ARRAY )
```

This function picks a random element from the given array, and returns it.

```javascript
	var fruits = ['apple', 'orange', 'banana'];
	var rand = rand_array( fruits );
```

### find_in_array

```
	BOOLEAN find_in_array( ARRAY, MIXED )
```

This functions returns `true` if the specified element exists in the array, `false` otherwise.  Unlike [find_object()](#find_object) and the related hash-in-array functions above, this is a much simpler, direct compare by value.  Example:

```javascript
	var fruits = ['apple', 'orange', 'banana'];
	console.log( find_in_array( fruits, 'orange' ) );
	// --> true
```

# Known Issues

* Serialized XML doesn't exactly match parsed XML.
* Unicode XML entities are not decoded when parsed.

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

