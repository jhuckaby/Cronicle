/*
	JavaScript XML Library
	Plus a bunch of object utility functions
	
	Usage:
		var myxml = '<?xml version="1.0"?><Document>' + 
			'<Simple>Hello</Simple>' + 
			'<Node Key="Value">Content</Node>' + 
			'</Document>';
		var parser = new XML({ text: myxml, preserveAttributes: true });
		var tree = parser.getTree();
		tree.Simple = "Hello2";
		tree.Node._Attribs.Key = "Value2";
		tree.Node._Data = "Content2";
		tree.New = "I added this";
		alert( parser.compose() );
	
	Copyright (c) 2004 - 2007 Joseph Huckaby
*/

var indent_string = "\t";
var xml_header = '<?xml version="1.0"?>';
var sort_args = null;
var re_valid_tag_name  = /^\w[\w\-\:]*$/;

function XML(args) {
	// class constructor for XML parser class
	// pass in args hash or text to parse
	if (!args) args = '';
	if (isa_hash(args)) {
		for (var key in args) this[key] = args[key];
	}
	else this.text = args || '';
	
	this.tree = {};
	this.errors = [];
	this.piNodeList = [];
	this.dtdNodeList = [];
	this.documentNodeName = '';
	
	this.patTag.lastIndex = 0;
	if (this.text) this.parse();
}

XML.prototype.preserveAttributes = false;

XML.prototype.patTag = /([^<]*?)<([^>]+)>/g;
XML.prototype.patSpecialTag = /^\s*([\!\?])/;
XML.prototype.patPITag = /^\s*\?/;
XML.prototype.patCommentTag = /^\s*\!--/;
XML.prototype.patDTDTag = /^\s*\!DOCTYPE/;
XML.prototype.patCDATATag = /^\s*\!\s*\[\s*CDATA/;
XML.prototype.patStandardTag = /^\s*(\/?)([\w\-\:\.]+)\s*(.*)$/;
XML.prototype.patSelfClosing = /\/\s*$/;
XML.prototype.patAttrib = new RegExp("([\\w\\-\\:\\.]+)\\s*=\\s*([\\\"\\'])([^\\2]*?)\\2", "g");
XML.prototype.patPINode = /^\s*\?\s*([\w\-\:]+)\s*(.*)$/;
XML.prototype.patEndComment = /--$/;
XML.prototype.patNextClose = /([^>]*?)>/g;
XML.prototype.patExternalDTDNode = new RegExp("^\\s*\\!DOCTYPE\\s+([\\w\\-\\:]+)\\s+(SYSTEM|PUBLIC)\\s+\\\"([^\\\"]+)\\\"");
XML.prototype.patInlineDTDNode = /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[/;
XML.prototype.patEndDTD = /\]$/;
XML.prototype.patDTDNode = /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[(.*)\]/;
XML.prototype.patEndCDATA = /\]\]$/;
XML.prototype.patCDATANode = /^\s*\!\s*\[\s*CDATA\s*\[(.*)\]\]/;

XML.prototype.attribsKey = '_Attribs';
XML.prototype.dataKey = '_Data';

XML.prototype.parse = function(branch, name) {
	// parse text into XML tree, recurse for nested nodes
	if (!branch) branch = this.tree;
	if (!name) name = null;
	var foundClosing = false;
	var matches = null;
	
	// match each tag, plus preceding text
	while ( matches = this.patTag.exec(this.text) ) {
		var before = matches[1];
		var tag = matches[2];
		
		// text leading up to tag = content of parent node
		if (before.match(/\S/)) {
			if (typeof(branch[this.dataKey]) != 'undefined') branch[this.dataKey] += ' '; else branch[this.dataKey] = '';
			branch[this.dataKey] += trim(decode_entities(before));
		}
		
		// parse based on tag type
		if (tag.match(this.patSpecialTag)) {
			// special tag
			if (tag.match(this.patPITag)) tag = this.parsePINode(tag);
			else if (tag.match(this.patCommentTag)) tag = this.parseCommentNode(tag);
			else if (tag.match(this.patDTDTag)) tag = this.parseDTDNode(tag);
			else if (tag.match(this.patCDATATag)) {
				tag = this.parseCDATANode(tag);
				if (typeof(branch[this.dataKey]) != 'undefined') branch[this.dataKey] += ' '; else branch[this.dataKey] = '';
				branch[this.dataKey] += trim(decode_entities(tag));
			} // cdata
			else {
				this.throwParseError( "Malformed special tag", tag );
				break;
			} // error
			
			if (tag == null) break;
			continue;
		} // special tag
		else {
			// Tag is standard, so parse name and attributes (if any)
			var matches = tag.match(this.patStandardTag);
			if (!matches) {
				this.throwParseError( "Malformed tag", tag );
				break;
			}
			
			var closing = matches[1];
			var nodeName = matches[2];
			var attribsRaw = matches[3];
			
			// If this is a closing tag, make sure it matches its opening tag
			if (closing) {
				if (nodeName == (name || '')) {
					foundClosing = 1;
					break;
				}
				else {
					this.throwParseError( "Mismatched closing tag (expected </" + name + ">)", tag );
					break;
				}
			} // closing tag
			else {
				// Not a closing tag, so parse attributes into hash.  If tag
				// is self-closing, no recursive parsing is needed.
				var selfClosing = !!attribsRaw.match(this.patSelfClosing);
				var leaf = {};
				var attribs = leaf;
				
				// preserve attributes means they go into a sub-hash named "_Attribs"
				// the XML composer honors this for restoring the tree back into XML
				if (this.preserveAttributes) {
					leaf[this.attribsKey] = {};
					attribs = leaf[this.attribsKey];
				}
				
				// parse attributes
				this.patAttrib.lastIndex = 0;
				while ( matches = this.patAttrib.exec(attribsRaw) ) {
					attribs[ matches[1] ] = decode_entities( matches[3] );
				} // foreach attrib
				
				// if no attribs found, but we created the _Attribs subhash, clean it up now
				if (this.preserveAttributes && !num_keys(attribs)) {
					delete leaf[this.attribsKey];
				}
				
				// Recurse for nested nodes
				if (!selfClosing) {
					this.parse( leaf, nodeName );
					if (this.error()) break;
				}
				
				// Compress into simple node if text only
				var num_leaf_keys = num_keys(leaf);
				if ((typeof(leaf[this.dataKey]) != 'undefined') && (num_leaf_keys == 1)) {
					leaf = leaf[this.dataKey];
				}
				else if (!num_leaf_keys) {
					leaf = '';
				}
				
				// Add leaf to parent branch
				if (typeof(branch[nodeName]) != 'undefined') {
					if (isa_array(branch[nodeName])) {
						array_push( branch[nodeName], leaf );
					}
					else {
						var temp = branch[nodeName];
						branch[nodeName] = [ temp, leaf ];
					}
				}
				else {
					branch[nodeName] = leaf;
				}
				
				if (this.error() || (branch == this.tree)) break;
			} // not closing
		} // standard tag
	} // main reg exp
	
	// Make sure we found the closing tag
	if (name && !foundClosing) {
		this.throwParseError( "Missing closing tag (expected </" + name + ">)", name );
	}
	
	// If we are the master node, finish parsing and setup our doc node
	if (branch == this.tree) {
		if (typeof(this.tree[this.dataKey]) != 'undefined') delete this.tree[this.dataKey];
		
		if (num_keys(this.tree) > 1) {
			this.throwParseError( 'Only one top-level node is allowed in document', first_key(this.tree) );
			return;
		}

		this.documentNodeName = first_key(this.tree);
		if (this.documentNodeName) {
			this.tree = this.tree[this.documentNodeName];
		}
	}
};

XML.prototype.throwParseError = function(key, tag) {
	// log error and locate current line number in source XML document
	var parsedSource = this.text.substring(0, this.patTag.lastIndex);
	var eolMatch = parsedSource.match(/\n/g);
	var lineNum = (eolMatch ? eolMatch.length : 0) + 1;
	lineNum -= tag.match(/\n/) ? tag.match(/\n/g).length : 0;
	
	array_push(this.errors, {
		type: 'Parse',
		key: key,
		text: '<' + tag + '>',
		line: lineNum
	});
};

XML.prototype.error = function() {
	// return number of errors
	return this.errors.length;
};

XML.prototype.getError = function(error) {
	// get formatted error
	var text = '';
	if (!error) return '';

	text = (error.type || 'General') + ' Error';
	if (error.code) text += ' ' + error.code;
	text += ': ' + error.key;
	
	if (error.line) text += ' on line ' + error.line;
	if (error.text) text += ': ' + error.text;

	return text;
};

XML.prototype.getLastError = function() {
	// Get most recently thrown error in plain text format
	if (!this.error()) return '';
	return this.getError( this.errors[this.errors.length - 1] );
};

XML.prototype.parsePINode = function(tag) {
	// Parse Processor Instruction Node, e.g. <?xml version="1.0"?>
	if (!tag.match(this.patPINode)) {
		this.throwParseError( "Malformed processor instruction", tag );
		return null;
	}
	
	array_push( this.piNodeList, tag );
	return tag;
};

XML.prototype.parseCommentNode = function(tag) {
	// Parse Comment Node, e.g. <!-- hello -->
	var matches = null;
	this.patNextClose.lastIndex = this.patTag.lastIndex;
	
	while (!tag.match(this.patEndComment)) {
		if (matches = this.patNextClose.exec(this.text)) {
			tag += '>' + matches[1];
		}
		else {
			this.throwParseError( "Unclosed comment tag", tag );
			return null;
		}
	}
	
	this.patTag.lastIndex = this.patNextClose.lastIndex;
	return tag;
};

XML.prototype.parseDTDNode = function(tag) {
	// Parse Document Type Descriptor Node, e.g. <!DOCTYPE ... >
	var matches = null;
	
	if (tag.match(this.patExternalDTDNode)) {
		// tag is external, and thus self-closing
		array_push( this.dtdNodeList, tag );
	}
	else if (tag.match(this.patInlineDTDNode)) {
		// Tag is inline, so check for nested nodes.
		this.patNextClose.lastIndex = this.patTag.lastIndex;
		
		while (!tag.match(this.patEndDTD)) {
			if (matches = this.patNextClose.exec(this.text)) {
				tag += '>' + matches[1];
			}
			else {
				this.throwParseError( "Unclosed DTD tag", tag );
				return null;
			}
		}
		
		this.patTag.lastIndex = this.patNextClose.lastIndex;
		
		// Make sure complete tag is well-formed, and push onto DTD stack.
		if (tag.match(this.patDTDNode)) {
			array_push( this.dtdNodeList, tag );
		}
		else {
			this.throwParseError( "Malformed DTD tag", tag );
			return null;
		}
	}
	else {
		this.throwParseError( "Malformed DTD tag", tag );
		return null;
	}
	
	return tag;
};

XML.prototype.parseCDATANode = function(tag) {
	// Parse CDATA Node, e.g. <![CDATA[Brooks & Shields]]>
	var matches = null;
	this.patNextClose.lastIndex = this.patTag.lastIndex;
	
	while (!tag.match(this.patEndCDATA)) {
		if (matches = this.patNextClose.exec(this.text)) {
			tag += '>' + matches[1];
		}
		else {
			this.throwParseError( "Unclosed CDATA tag", tag );
			return null;
		}
	}
	
	this.patTag.lastIndex = this.patNextClose.lastIndex;
	
	if (matches = tag.match(this.patCDATANode)) {
		return matches[1];
	}
	else {
		this.throwParseError( "Malformed CDATA tag", tag );
		return null;
	}
};

XML.prototype.getTree = function() {
	// get reference to parsed XML tree
	return this.tree;
};

XML.prototype.compose = function() {
	// compose tree back into XML
	var raw = compose_xml( this.documentNodeName, this.tree );
	var body = raw.substring( raw.indexOf("\n") + 1, raw.length );
	var xml = '';
	
	if (this.piNodeList.length) {
		for (var idx = 0, len = this.piNodeList.length; idx < len; idx++) {
			xml += '<' + this.piNodeList[idx] + '>' + "\n";
		}
	}
	else {
		xml += xml_header + "\n";
	}
	
	if (this.dtdNodeList.length) {
		for (var idx = 0, len = this.dtdNodeList.length; idx < len; idx++) {
			xml += '<' + this.dtdNodeList[idx] + '>' + "\n";
		}
	}
	
	xml += body;
	return xml;
};

//
// Static Utility Functions:
//

function parse_xml(text) {
	// turn text into XML tree quickly
	var parser = new XML(text);
	return parser.error() ? parser.getLastError() : parser.getTree();
}

function trim(text) {
	// strip whitespace from beginning and end of string
	if (text == null) return '';
	
	if (text && text.replace) {
		text = text.replace(/^\s+/, "");
		text = text.replace(/\s+$/, "");
	}
	
	return text;
}

function encode_entities(text) {
	// Simple entitize function for composing XML
	if (text == null) return '';

	if (text && text.replace) {
		text = text.replace(/\&/g, "&amp;"); // MUST BE FIRST
		text = text.replace(/</g, "&lt;");
		text = text.replace(/>/g, "&gt;");
	}

	return text;
}

function encode_attrib_entities(text) {
	// Simple entitize function for composing XML attributes
	if (text == null) return '';

	if (text && text.replace) {
		text = text.replace(/\&/g, "&amp;"); // MUST BE FIRST
		text = text.replace(/</g, "&lt;");
		text = text.replace(/>/g, "&gt;");
		text = text.replace(/\"/g, "&quot;");
		text = text.replace(/\'/g, "&apos;");
	}

	return text;
}

function decode_entities(text) {
	// Decode XML entities into raw ASCII
	if (text == null) return '';

	if (text && text.replace) {
		text = text.replace(/\&lt\;/g, "<");
		text = text.replace(/\&gt\;/g, ">");
		text = text.replace(/\&quot\;/g, '"');
		text = text.replace(/\&apos\;/g, "'");
		text = text.replace(/\&amp\;/g, "&"); // MUST BE LAST
	}

	return text;
}

function compose_xml(name, node, indent) {
	// Compose node into XML including attributes
	// Recurse for child nodes
	var xml = "";
	
	// If this is the root node, set the indent to 0
	// and setup the XML header (PI node)
	if (!indent) {
		indent = 0;
		xml = xml_header + "\n";
	}
	
	// Setup the indent text
	var indent_text = "";
	for (var k = 0; k < indent; k++) indent_text += indent_string;

	if ((typeof(node) == 'object') && (node != null)) {
		// node is object -- now see if it is an array or hash
		if (!node.length) { // what about zero-length array?
			// node is hash
			xml += indent_text + "<" + name;

			var num_keys = 0;
			var has_attribs = 0;
			for (var key in node) num_keys++; // there must be a better way...

			if (node["_Attribs"]) {
				has_attribs = 1;
				var sorted_keys = hash_keys_to_array(node["_Attribs"]).sort();
				for (var idx = 0, len = sorted_keys.length; idx < len; idx++) {
					var key = sorted_keys[idx];
					xml += " " + key + "=\"" + encode_attrib_entities(node["_Attribs"][key]) + "\"";
				}
			} // has attribs

			if (num_keys > has_attribs) {
				// has child elements
				xml += ">";

				if (node["_Data"]) {
					// simple text child node
					xml += encode_entities(node["_Data"]) + "</" + name + ">\n";
				} // just text
				else {
					xml += "\n";
					
					var sorted_keys = hash_keys_to_array(node).sort();
					for (var idx = 0, len = sorted_keys.length; idx < len; idx++) {
						var key = sorted_keys[idx];					
						if ((key != "_Attribs") && key.match(re_valid_tag_name)) {
							// recurse for node, with incremented indent value
							xml += compose_xml( key, node[key], indent + 1 );
						} // not _Attribs key
					} // foreach key

					xml += indent_text + "</" + name + ">\n";
				} // real children
			}
			else {
				// no child elements, so self-close
				xml += "/>\n";
			}
		} // standard node
		else {
			// node is array
			for (var idx = 0; idx < node.length; idx++) {
				// recurse for node in array with same indent
				xml += compose_xml( name, node[idx], indent );
			}
		} // array of nodes
	} // complex node
	else {
		// node is simple string
		xml += indent_text + "<" + name + ">" + encode_entities(node) + "</" + name + ">\n";
	} // simple text node

	return xml;
}

function find_object(obj, criteria) {
	// walk array looking for nested object matching criteria object
	if (isa_hash(obj)) obj = hash_values_to_array(obj);
	
	var criteria_length = 0;
	for (var a in criteria) criteria_length++;
	obj = always_array(obj);
	
	for (var a = 0; a < obj.length; a++) {
		var matches = 0;
		
		for (var b in criteria) {
			if (obj[a][b] && (obj[a][b] == criteria[b])) matches++;
			else if (obj[a]["_Attribs"] && obj[a]["_Attribs"][b] && (obj[a]["_Attribs"][b] == criteria[b])) matches++;
		}
		if (matches >= criteria_length) return obj[a];
	}
	return null;
}

function find_objects(obj, criteria) {
	// walk array gathering all nested objects that match criteria object
	if (isa_hash(obj)) obj = hash_values_to_array(obj);
	
	var objs = new Array();
	var criteria_length = 0;
	for (var a in criteria) criteria_length++;
	obj = always_array(obj);
	
	for (var a = 0; a < obj.length; a++) {
		var matches = 0;
		for (var b in criteria) {
			if (obj[a][b] && obj[a][b] == criteria[b]) matches++;
			else if (obj[a]["_Attribs"] && obj[a]["_Attribs"][b] && (obj[a]["_Attribs"][b] == criteria[b])) matches++;
		}
		if (matches >= criteria_length) array_push( objs, obj[a] );
	}
	
	return objs;
}

function find_object_idx(obj, criteria) {
	// walk array looking for nested object matching criteria object
	// return index in outer array, not object itself
	if (isa_hash(obj)) obj = hash_values_to_array(obj);
	
	var criteria_length = 0;
	for (var a in criteria) criteria_length++;
	obj = always_array(obj);
	
	for (var idx = 0; idx < obj.length; idx++) {
		var matches = 0;
		
		for (var b in criteria) {
			if (obj[idx][b] && (obj[idx][b] == criteria[b])) matches++;
			else if (obj[idx]["_Attribs"] && obj[idx]["_Attribs"][b] && (obj[idx]["_Attribs"][b] == criteria[b])) matches++;
		}
		if (matches >= criteria_length) return idx;
	}
	return -1;
}

function delete_object(obj, criteria) {
	// walk array looking for nested object matching criteria object
	// delete first object found
	var idx = find_object_idx(obj, criteria);

	if (idx > -1) {
		obj.splice( idx, 1 );
		return true;
	}
	return false;
}

function delete_objects(obj, criteria) {
	// delete all objects in obj array matching criteria
	while (delete_object(obj, criteria)) ;
}

function always_array(obj, key) {
	// if object is not array, return array containing object
	// if key is passed, work like XMLalwaysarray() instead
	// apparently MSIE has weird issues with obj = always_array(obj);
	
	if (key) {
		if ((typeof(obj[key]) != 'object') || (typeof(obj[key].length) == 'undefined')) {
			var temp = obj[key];
			delete obj[key];
			obj[key] = new Array();
			obj[key][0] = temp;
		}
		return null;
	}
	else {
		if ((typeof(obj) != 'object') || (typeof(obj.length) == 'undefined')) { return [ obj ]; }
		else return obj;
	}
}

function hash_keys_to_array(hash) {
	// convert hash keys to array (discard values)
	var array = [];
	for (var key in hash) array_push(array, key);
	return array;
}

function hash_values_to_array(hash) {
	// convert hash values to array (discard keys)
	var arr = [];
	for (var key in hash) arr.push( hash[key] );
	return arr;
};

function merge_objects(a, b) {
	// merge keys from a and b into c and return c
	// b has precedence over a
	if (!a) a = {};
	if (!b) b = {};
	var c = {};

	// also handle serialized objects for a and b
	if (typeof(a) != 'object') eval( "a = " + a );
	if (typeof(b) != 'object') eval( "b = " + b );

	for (var key in a) c[key] = a[key];
	for (var key in b) c[key] = b[key];

	return c;
}

function copy_object(obj) {
	// return copy of object (NOT DEEP)
	var new_obj = {};
	for (var key in obj) new_obj[key] = obj[key];
	return new_obj;
}

function deep_copy_object(obj) {
	// recursively copy object and nested objects
	// return new object
	return JSON.parse( JSON.stringify(obj) );
}

function copy_into_object(a, b) {
	// copy b in to a (NOT DEEP)
	// no return value
	for (var key in b) a[key] = b[key];
}

function num_keys(hash) {
	// count the number of keys in a hash
	var count = 0;
	for (var a in hash) count++;
	return count;
}

function reverse_hash(a) {
	// reverse hash keys/values
	var c = {};
	for (var key in a) {
		c[ a[key] ] = key;
	}
	return c;
}

function lookup_path(path, obj) {
	// walk through object tree, psuedo-XPath-style
	// supports arrays as well as objects
	// return final object or value
	// always start query with a slash, i.e. /something/or/other
	path = path.replace(/\/$/, ""); // strip trailing slash
	
	while (/\/[^\/]+/.test(path) && (typeof(obj) == 'object')) {
		// find first slash and strip everything up to and including it
		var slash = path.indexOf('/');
		path = path.substring( slash + 1 );
		
		// find next slash (or end of string) and get branch name
		slash = path.indexOf('/');
		if (slash == -1) slash = path.length;
		var name = path.substring(0, slash);

		// advance obj using branch
		if (typeof(obj.length) == 'undefined') {
			// obj is hash
			if (typeof(obj[name]) != 'undefined') obj = obj[name];
			else return null;
		}
		else {
			// obj is array
			var idx = parseInt(name, 10);
			if (isNaN(idx)) return null;
			if (typeof(obj[idx]) != 'undefined') obj = obj[idx];
			else return null;
		}

	} // while path contains branch

	return obj;
}

function isa_hash(arg) {
	// determine if arg is a hash
	return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) == 'undefined') );
}

function isa_array(arg) {
	// determine if arg is an array or is array-like
	if (typeof(arg) == 'array') return true;
	return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) != 'undefined') );
}

function first_key(hash) {
	// return first key from hash (unordered)
	for (var key in hash) return key;
	return null; // no keys in hash
}

function array_push(array, item) {
	// push item onto end of array
	array[ array.length ] = item;
}

function rand_array(arr) {
	// return random element from array
	return arr[ parseInt(Math.random() * arr.length, 10) ];
}

function find_in_array(arr, elem) {
	// return true if elem is found in arr, false otherwise
	for (var idx = 0, len = arr.length; idx < len; idx++) {
		if (arr[idx] == elem) return true;
	}
	return false;
}
