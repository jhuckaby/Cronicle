////
// Joe's Misc JavaScript Tools
// Copyright (c) 2004 - 2015 Joseph Huckaby
// Released under the MIT License
////

var months = [
	[ 1, 'January' ], [ 2, 'February' ], [ 3, 'March' ], [ 4, 'April' ],
	[ 5, 'May' ], [ 6, 'June' ], [ 7, 'July' ], [ 8, 'August' ],
	[ 9, 'September' ], [ 10, 'October' ], [ 11, 'November' ],
	[ 12, 'December' ]
];

function parse_query_string(url) {
	// parse query string into key/value pairs and return as object
	var query = {}; 
	url.replace(/^.*\?/, '').replace(/([^\=]+)\=([^\&]*)\&?/g, function(match, key, value) {
		query[key] = decodeURIComponent(value);
		if (query[key].match(/^\-?\d+$/)) query[key] = parseInt(query[key]);
		else if (query[key].match(/^\-?\d*\.\d+$/)) query[key] = parseFloat(query[key]);
		return ''; 
	} );
	return query; 
};

function compose_query_string(queryObj) {
	// compose key/value pairs into query string
	// supports duplicate keys (i.e. arrays)
	var qs = '';
	for (var key in queryObj) {
		var values = always_array(queryObj[key]);
		for (var idx = 0, len = values.length; idx < len; idx++) {
			qs += (qs.length ? '&' : '?') + escape(key) + '=' + escape(values[idx]);
		}
	}
	return qs;
}

function get_text_from_bytes(bytes, precision) {
	// convert raw bytes to english-readable format
	// set precision to 1 for ints, 10 for 1 decimal point (default), 100 for 2, etc.
	bytes = Math.floor(bytes);
	if (!precision) precision = 10;
	
	if (bytes >= 1024) {
		bytes = Math.floor( (bytes / 1024) * precision ) / precision;
		if (bytes >= 1024) {
			bytes = Math.floor( (bytes / 1024) * precision ) / precision;
			if (bytes >= 1024) {
				bytes = Math.floor( (bytes / 1024) * precision ) / precision;
				if (bytes >= 1024) {
					bytes = Math.floor( (bytes / 1024) * precision ) / precision;
					return bytes + ' TB';
				} 
				else return bytes + ' GB';
			} 
			else return bytes + ' MB';
		}
		else return bytes + ' K';
	}
	else return bytes + pluralize(' byte', bytes);
};

function get_bytes_from_text(text) {
	// parse text into raw bytes, e.g. "1 K" --> 1024
	if (text.toString().match(/^\d+$/)) return parseInt(text); // already in bytes
	var multipliers = {
		b: 1,
		k: 1024,
		m: 1024 * 1024,
		g: 1024 * 1024 * 1024,
		t: 1024 * 1024 * 1024 * 1024
	};
	var bytes = 0;
	text = text.toString().replace(/([\d\.]+)\s*(\w)\w*\s*/g, function(m_all, m_g1, m_g2) {
		var mult = multipliers[ m_g2.toLowerCase() ] || 0;
		bytes += (parseFloat(m_g1) * mult); 
		return '';
	} );
	return Math.floor(bytes);
};

function ucfirst(text) {
	// capitalize first character only, lower-case rest
	return text.substring(0, 1).toUpperCase() + text.substring(1, text.length).toLowerCase();
}

function commify(number) {
	// add commas to integer, like 1,234,567
	if (!number) number = 0;

	number = '' + number;
	if (number.length > 3) {
		var mod = number.length % 3;
		var output = (mod > 0 ? (number.substring(0,mod)) : '');
		for (i=0 ; i < Math.floor(number.length / 3); i++) {
			if ((mod == 0) && (i == 0))
				output += number.substring(mod+ 3 * i, mod + 3 * i + 3);
			else
				output+= ',' + number.substring(mod + 3 * i, mod + 3 * i + 3);
		}
		return (output);
	}
	else return number;
}

function short_float(value) {
	// Shorten floating-point decimal to 2 places, unless they are zeros.
	if (!value) value = 0;
	return parseFloat( value.toString().replace(/^(\-?\d+\.[0]*\d{2}).*$/, '$1') );
}

function pct(count, max, floor) {
	// Return formatted percentage given a number along a sliding scale from 0 to 'max'
	var pct = (count * 100) / (max || 1);
	if (!pct.toString().match(/^\d+(\.\d+)?$/)) { pct = 0; }
	return '' + (floor ? Math.floor(pct) : short_float(pct)) + '%';
};

function get_text_from_seconds(sec, abbrev, no_secondary) {
	// convert raw seconds to human-readable relative time
	var neg = '';
	sec = parseInt(sec, 10);
	if (sec<0) { sec =- sec; neg = '-'; }
	
	var p_text = abbrev ? "sec" : "second";
	var p_amt = sec;
	var s_text = "";
	var s_amt = 0;
	
	if (sec > 59) {
		var min = parseInt(sec / 60, 10);
		sec = sec % 60; 
		s_text = abbrev ? "sec" : "second"; 
		s_amt = sec; 
		p_text = abbrev ? "min" : "minute"; 
		p_amt = min;
		
		if (min > 59) {
			var hour = parseInt(min / 60, 10);
			min = min % 60; 
			s_text = abbrev ? "min" : "minute"; 
			s_amt = min; 
			p_text = abbrev ? "hr" : "hour"; 
			p_amt = hour;
			
			if (hour > 23) {
				var day = parseInt(hour / 24, 10);
				hour = hour % 24; 
				s_text = abbrev ? "hr" : "hour"; 
				s_amt = hour; 
				p_text = "day"; 
				p_amt = day;
				
				if (day > 29) {
					var month = parseInt(day / 30, 10);
					day = day % 30; 
					s_text = "day"; 
					s_amt = day; 
					p_text = abbrev ? "mon" : "month"; 
					p_amt = month;
				} // day>29
			} // hour>23
		} // min>59
	} // sec>59
	
	var text = p_amt + "&nbsp;" + p_text;
	if ((p_amt != 1) && !abbrev) text += "s";
	if (s_amt && !no_secondary) {
		text += ", " + s_amt + "&nbsp;" + s_text;
		if ((s_amt != 1) && !abbrev) text += "s";
	}
	
	return(neg + text);
}

function get_text_from_seconds_round(sec, abbrev) {
	// convert raw seconds to human-readable relative time
	// round to nearest instead of floor
	var neg = '';
	sec = Math.round(sec);
	if (sec < 0) { sec =- sec; neg = '-'; }
	
	var text = abbrev ? "sec" : "second";
	var amt = sec;
	
	if (sec > 59) {
		var min = Math.round(sec / 60);
		text = abbrev ? "min" : "minute"; 
		amt = min;
		
		if (min > 59) {
			var hour = Math.round(min / 60);
			text = abbrev ? "hr" : "hour"; 
			amt = hour;
			
			if (hour > 23) {
				var day = Math.round(hour / 24);
				text = "day"; 
				amt = day;
			} // hour>23
		} // min>59
	} // sec>59
	
	var text = "" + amt + " " + text;
	if ((amt != 1) && !abbrev) text += "s";
	
	return(neg + text);
};

function get_seconds_from_text(text) {
	// parse text into raw seconds, e.g. "1 minute" --> 60
	if (text.toString().match(/^\d+$/)) return parseInt(text); // already in seconds
	var multipliers = {
		s: 1,
		m: 60,
		h: 60 * 60,
		d: 60 * 60 * 24,
		w: 60 * 60 * 24 * 7
	};
	var seconds = 0;
	text = text.toString().replace(/([\d\.]+)\s*(\w)\w*\s*/g, function(m_all, m_g1, m_g2) {
		var mult = multipliers[ m_g2.toLowerCase() ] || 0;
		seconds += (parseFloat(m_g1) * mult); 
		return '';
	} );
	return Math.floor(seconds);
};

function get_inner_window_size(dom) {
	// get size of inner window
	if (!dom) dom = window;
	var myWidth = 0, myHeight = 0;
	
	if( typeof( dom.innerWidth ) == 'number' ) {
		// Non-IE
		myWidth = dom.innerWidth;
		myHeight = dom.innerHeight;
	}
	else if( dom.document.documentElement && ( dom.document.documentElement.clientWidth || dom.document.documentElement.clientHeight ) ) {
		// IE 6+ in 'standards compliant mode'
		myWidth = dom.document.documentElement.clientWidth;
		myHeight = dom.document.documentElement.clientHeight;
	}
	else if( dom.document.body && ( dom.document.body.clientWidth || dom.document.body.clientHeight ) ) {
		// IE 4 compatible
		myWidth = dom.document.body.clientWidth;
		myHeight = dom.document.body.clientHeight;
	}
	return { width: myWidth, height: myHeight };
}

function get_scroll_xy(dom) {
	// get page scroll X, Y
	if (!dom) dom = window;
  var scrOfX = 0, scrOfY = 0;
  if( typeof( dom.pageYOffset ) == 'number' ) {
    //Netscape compliant
    scrOfY = dom.pageYOffset;
    scrOfX = dom.pageXOffset;
  } else if( dom.document.body && ( dom.document.body.scrollLeft || dom.document.body.scrollTop ) ) {
    //DOM compliant
    scrOfY = dom.document.body.scrollTop;
    scrOfX = dom.document.body.scrollLeft;
  } else if( dom.document.documentElement && ( dom.document.documentElement.scrollLeft || dom.document.documentElement.scrollTop ) ) {
    //IE6 standards compliant mode
    scrOfY = dom.document.documentElement.scrollTop;
    scrOfX = dom.document.documentElement.scrollLeft;
  }
  return { x: scrOfX, y: scrOfY };
}

function get_scroll_max(dom) {
	// get maximum scroll width/height
	if (!dom) dom = window;
	var myWidth = 0, myHeight = 0;
	if (dom.document.body.scrollHeight) {
		myWidth = dom.document.body.scrollWidth;
		myHeight = dom.document.body.scrollHeight;
	}
	else if (dom.document.documentElement.scrollHeight) {
		myWidth = dom.document.documentElement.scrollWidth;
		myHeight = dom.document.documentElement.scrollHeight;
	}
	return { width: myWidth, height: myHeight };
}

function hires_time_now() {
	// return the Epoch seconds for like right now
	var now = new Date();
	return ( now.getTime() / 1000 );
}

function str_value(str) {
	// Get friendly string value for display purposes.
	if (typeof(str) == 'undefined') str = '';
	else if (str === null) str = '';
	return '' + str;
}

function pluralize(word, num) {
	// Pluralize a word using English language rules.
	if (num != 1) {
		if (word.match(/[^e]y$/)) return word.replace(/y$/, '') + 'ies';
		else return word + 's';
	}
	else return word;
}

function render_menu_options(items, sel_value, auto_add) {
	// return HTML for menu options
	var html = '';
	var found = false;
	
	for (var idx = 0, len = items.length; idx < len; idx++) {
		var item = items[idx];
		var item_name = '';
		var item_value = '';
		if (isa_hash(item)) {
			if (('label' in item) && ('data' in item)) {
				item_name = item.label;
				item_value = item.data;
			}
			else {
				item_name = item.title;
				item_value = item.id;
			}
		}
		else if (isa_array(item)) {
			item_value = item[0];
			item_name = item[1];
		}
		else {
			item_name = item_value = item;
		}
		html += '<option value="'+item_value+'" '+((item_value == sel_value) ? 'selected="selected"' : '')+'>'+item_name+'</option>';
		if (item_value == sel_value) found = true;
	}
	
	if (!found && (str_value(sel_value) != '') && auto_add) {
		html += '<option value="'+sel_value+'" selected="selected">'+sel_value+'</option>';
	}
	
	return html;
}

function dirname(path) {
	// return path excluding file at end (same as POSIX function of same name)
	return path.toString().replace(/\/$/, "").replace(/\/[^\/]+$/, "");
}

function basename(path) {
	// return filename, strip path (same as POSIX function of same name)
	return path.toString().replace(/\/$/, "").replace(/^(.*)\/([^\/]+)$/, "$2");
}

function strip_ext(path) {
	// strip extension from filename
	return path.toString().replace(/\.\w+$/, "");
}

function load_script(url) {
	// Dynamically load script into DOM.
	Debug.trace( "Loading script: " + url );
	var scr = document.createElement('SCRIPT');
	scr.type = 'text/javascript';
	scr.src = url;
	document.getElementsByTagName('HEAD')[0].appendChild(scr);
}

function compose_attribs(attribs) {
	// compose Key="Value" style attributes for HTML elements
	var html = '';
	
	if (attribs) {
		for (var key in attribs) {
			html += " " + key + "=\"" + attribs[key] + "\"";
		}
	}

	return html;
}

function compose_style(attribs) {
	// compose key:value; pairs for style (CSS) elements
	var html = '';
	
	if (attribs) {
		for (var key in attribs) {
			html += " " + key + ":" + attribs[key] + ";";
		}
	}

	return html;
}

function truncate_ellipsis(str, len) {
	// simple truncate string with ellipsis if too long
	str = str_value(str);
	if (str.length > len) {
		str = str.substring(0, len - 3) + '...';
	}
	return str;
}

function escape_text_field_value(text) {
	// escape text field value, with stupid IE support
	text = encode_attrib_entities( str_value(text) );
	if (navigator.userAgent.match(/MSIE/) && text.replace) text = text.replace(/\&apos\;/g, "'");
	return text;
}

function expando_text(text, max, link) {
	// if text is longer than max chars, chop with ellipsis and include link to show all
	if (!link) link = 'More';
	text = str_value(text);
	if (text.length <= max) return text;
	
	var before = text.substring(0, max);
	var after = text.substring(max);
	
	return before + 
		'<span>... <a href="javascript:void(0)" onMouseUp="$(this).parent().hide().next().show()">'+link+'</a></span>' + 
		'<span style="display:none">' + after + '</span>';
};

function get_int_version(str, pad) {
	// Joe's Fun Multi-Decimal Comparision Trick
	// Example: convert 2.5.1 to 2005001 for numerical comparison against other similar "numbers".
	if (!pad) pad = 3;
	str = str_value(str).replace(/[^\d\.]+/g, '');
	if (!str.match(/\./)) return parseInt(str, 10);
	
	var parts = str.split(/\./);
	var output = '';
	for (var idx = 0, len = parts.length; idx < len; idx++) {
		var part = '' + parts[idx];
		while (part.length < pad) part = '0' + part;
		output += part;
	}
	return parseInt( output.replace(/^0+/, ''), 10 );
};

function get_unique_id(len, salt) {
	// Get unique ID using MD5, hires time, pseudo-random number and static counter.
	if (this.__unique_id_counter) this.__unique_id_counter = 0;
	this.__unique_id_counter++;
	return hex_md5( '' + hires_time_now() + Math.random() + this.__unique_id_counter + (salt || '') ).substring(0, len || 32);
};

function escape_regexp(text) {
	// Escape text for use in a regular expression.
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

