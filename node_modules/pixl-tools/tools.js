// Misc Tools for Node.js
// Copyright (c) 2015 - 2018 Joseph Huckaby
// Released under the MIT License

var fs = require('fs');
var cp = require('child_process');
var crypto = require('crypto');
var ErrNo = require('errno');
var os = require('os');
var hostname = os.hostname();

module.exports = {
	
	hostname: hostname,
	user_cache: {},
	
	timeNow: function(floor) {
		// return current epoch time
		var epoch = (new Date()).getTime() / 1000;
		return floor ? Math.floor(epoch) : epoch;
	},
	
	_uniqueIDCounter: 0,
	generateUniqueID: function(len, salt) {
		// generate unique ID using some readily-available bits of entropy
		this._uniqueIDCounter++;
		var shasum = crypto.createHash('sha256');
		
		shasum.update([
			'SALT_7fb1b7485647b1782c715474fba28fd1',
			this.timeNow(),
			Math.random(),
			hostname,
			process.pid,
			this._uniqueIDCounter,
			salt || ''
		].join('-'));
		
		return shasum.digest('hex').substring(0, len || 64);
	},
	
	digestHex: function(str, algo) {
		// digest string using SHA256 (by default), return hex hash
		var shasum = crypto.createHash( algo || 'sha256' );
		shasum.update( str );
		return shasum.digest('hex');
	},
	
	numKeys: function(hash) {
		// count keys in hash
		// Object.keys(hash).length may be faster, but this uses far less memory
		var count = 0;
		for (var key in hash) { count++; }
		return count;
	},
	
	firstKey: function(hash) {
		// return first key in hash (key order is undefined)
		for (var key in hash) return key;
		return null; // no keys in hash
	},
	
	hashKeysToArray: function(hash) {
		// convert hash keys to array (discard values)
		var arr = [];
		for (var key in hash) arr.push(key);
		return arr;
	},
	
	hashValuesToArray: function(hash) {
		// convert hash values to array (discard keys)
		var arr = [];
		for (var key in hash) arr.push( hash[key] );
		return arr;
	},
	
	isaHash: function(arg) {
		// determine if arg is a hash or hash-like
		return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) == 'undefined') );
	},
	
	isaArray: function(arg) {
		// determine if arg is an array or is array-like
		return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) != 'undefined') );
	},
	
	copyHash: function(hash, deep) {
		// copy hash to new one, with optional deep mode (uses JSON)
		if (deep) {
			// deep copy
			return JSON.parse( JSON.stringify(hash) );
		}
		else {
			// shallow copy
			var output = {};
			for (var key in hash) {
				output[key] = hash[key];
			}
			return output;
		}
	},
	
	copyHashRemoveKeys: function(hash, remove) {
		// shallow copy hash, excluding some keys
		var output = {};
		for (var key in hash) {
			if (!remove[key]) output[key] = hash[key];
		}
		return output;
	},
	
	mergeHashes: function(a, b) {
		// shallow-merge keys from a and b into c and return c
		// b has precedence over a
		if (!a) a = {};
		if (!b) b = {};
		var c = {};
		
		for (var key in a) c[key] = a[key];
		for (var key in b) c[key] = b[key];
		
		return c;
	},
	
	mergeHashInto: function(a, b) {
		// shallow-merge keys from b into a
		for (var key in b) a[key] = b[key];
	},
	
	parseQueryString: function(url) {
		// parse query string into key/value pairs and return as object
		var query = {}; 
		url.replace(/^.*\?/, '').replace(/([^\=]+)\=([^\&]*)\&?/g, function(match, key, value) {
			query[key] = decodeURIComponent(value);
			if (query[key].match(/^\-?\d+$/)) query[key] = parseInt(query[key]);
			else if (query[key].match(/^\-?\d*\.\d+$/)) query[key] = parseFloat(query[key]);
			return ''; 
		} );
		return query; 
	},
	
	composeQueryString: function(query) {
		// compose key/value pairs into query string
		var qs = '';
		for (var key in query) {
			qs += (qs.length ? '&' : '?') + key + '=' + encodeURIComponent(query[key]);
		}
		return qs;
	},
	
	findObjectsIdx: function(arr, crit, max) {
		// find idx of all objects that match crit keys/values
		var idxs = [];
		var num_crit = 0;
		for (var a in crit) num_crit++;
		
		for (var idx = 0, len = arr.length; idx < len; idx++) {
			var matches = 0;
			for (var key in crit) {
				if (arr[idx][key] == crit[key]) matches++;
			}
			if (matches == num_crit) {
				idxs.push(idx);
				if (max && (idxs.length >= max)) return idxs;
			}
		} // foreach elem
		
		return idxs;
	},
	
	findObjectIdx: function(arr, crit) {
		// find idx of first matched object, or -1 if not found
		var idxs = this.findObjectsIdx(arr, crit, 1);
		return idxs.length ? idxs[0] : -1;
	},
	
	findObject: function(arr, crit) {
		// return first found object matching crit keys/values, or null if not found
		var idx = this.findObjectIdx(arr, crit);
		return (idx > -1) ? arr[idx] : null;
	},
	
	findObjects: function(arr, crit) {
		// find and return all objects that match crit keys/values
		var idxs = this.findObjectsIdx(arr, crit);
		var objs = [];
		for (var idx = 0, len = idxs.length; idx < len; idx++) {
			objs.push( arr[idxs[idx]] );
		}
		return objs;
	},
	
	deleteObject: function(arr, crit) {
		// walk array looking for nested object matching criteria object
		// delete first object found
		var idx = this.findObjectIdx(arr, crit);
		if (idx > -1) {
			arr.splice( idx, 1 );
			return true;
		}
		return false;
	},
	
	deleteObjects: function(arr, crit) {
		// delete all objects in obj array matching criteria
		// TODO: This is not terribly efficient -- could use a rewrite.
		var count = 0;
		while (this.deleteObject(arr, crit)) count++;
		return count;
	},
	
	alwaysArray: function(obj) {
		// if obj is not an array, wrap it in one and return it
		return this.isaArray(obj) ? obj : [obj];
	},
	
	lookupPath: function(path, obj) {
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
			if ((typeof(obj.length) == 'undefined') || name.match(/\D/)) {
				// obj is probably a hash
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
	},
	
	substitute: function(text, args, fatal) {
		// perform simple [placeholder] substitution using supplied
		// args object (or eval) and return transformed text
		if (typeof(text) == 'undefined') text = '';
		text = '' + text;
		if (!args) args = {};
		
		while (text.indexOf('[') > -1) {
			var open_bracket = text.indexOf('[');
			var close_bracket = text.indexOf(']');
			
			var before = text.substring(0, open_bracket);
			var after = text.substring(close_bracket + 1, text.length);
			
			var name = text.substring( open_bracket + 1, close_bracket );
			var value = '';
			
			if (name.indexOf('/') == 0) {
				value = this.lookupPath(name, args);
				if (value === null) {
					if (fatal) return null;
					else value = '__APLB__' + name + '__APRB__';
				}
			}
			else if (typeof(args[name]) != 'undefined') value = args[name];
			else {
				if (fatal) return null;
				else value = '__APLB__' + name + '__APRB__';
			}
			
			text = before + value + after;
		} // while text contains [
		
		return text.replace(/__APLB__/g, '[').replace(/__APRB__/g, ']');
	},
	
	getDateArgs: function(thingy) {
		// return hash containing year, mon, mday, hour, min, sec
		// given epoch seconds, date object or date string
		var date = (typeof(thingy) == 'object') ? thingy : (new Date( (typeof(thingy) == 'number') ? (thingy * 1000) : thingy ));
		var args = {
			epoch: Math.floor( date.getTime() / 1000 ),
			year: date.getFullYear(),
			mon: date.getMonth() + 1,
			mday: date.getDate(),
			wday: date.getDay(),
			hour: date.getHours(),
			min: date.getMinutes(),
			sec: date.getSeconds(),
			msec: date.getMilliseconds(),
			offset: 0 - (date.getTimezoneOffset() / 60)
		};
		
		args.yyyy = '' + args.year;
		if (args.mon < 10) args.mm = "0" + args.mon; else args.mm = '' + args.mon;
		if (args.mday < 10) args.dd = "0" + args.mday; else args.dd = '' + args.mday;
		if (args.hour < 10) args.hh = "0" + args.hour; else args.hh = '' + args.hour;
		if (args.min < 10) args.mi = "0" + args.min; else args.mi = '' + args.min;
		if (args.sec < 10) args.ss = "0" + args.sec; else args.ss = '' + args.sec;
		
		if (args.hour >= 12) {
			args.ampm = 'pm';
			args.hour12 = args.hour - 12;
			if (!args.hour12) args.hour12 = 12;
		}
		else {
			args.ampm = 'am';
			args.hour12 = args.hour;
			if (!args.hour12) args.hour12 = 12;
		}
		
		args.yyyy_mm_dd = args.yyyy + '/' + args.mm + '/' + args.dd;
		args.hh_mi_ss = args.hh + ':' + args.mi + ':' + args.ss;
		args.tz = 'GMT' + (args.offset >= 0 ? '+' : '') + args.offset;
		
		return args;
	},
	
	getTimeFromArgs: function(args) {
		// return epoch given args like those returned from getDateArgs()
		var then = new Date(
			args.year,
			args.mon - 1,
			args.mday,
			args.hour,
			args.min,
			args.sec,
			0
		);
		return Math.floor( then.getTime() / 1000 );
	},
	
	normalizeTime: function(epoch, zero_args) {
		// quantize time into any given precision
		// examples: 
		//   hour: { min:0, sec:0 }
		//   day: { hour:0, min:0, sec:0 }
		var args = this.getDateArgs(epoch);
		for (var key in zero_args) args[key] = zero_args[key];
		
		// mday is 1-based
		if (!args['mday']) args['mday'] = 1;
		
		return this.getTimeFromArgs(args);
	},
	
	getTextFromBytes: function(bytes, precision) {
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
		else return bytes + this.pluralize(' byte', bytes);
	},
	
	getBytesFromText: function(text) {
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
	},
	
	commify: function(number) {
		// add US-formatted commas to integer, like 1,234,567
		if (!number) number = 0;
		number = '' + number;
		
		if (number.length > 3) {
			var mod = number.length % 3;
			var output = (mod > 0 ? (number.substring(0,mod)) : '');
			for (var i=0 ; i < Math.floor(number.length / 3); i++) {
				if ((mod == 0) && (i == 0))
					output += number.substring(mod+ 3 * i, mod + 3 * i + 3);
				else
					output+= ',' + number.substring(mod + 3 * i, mod + 3 * i + 3);
			}
			return (output);
		}
		else return number;
	},
	
	shortFloat: function(value) {
		// Shorten floating-point decimal to 2 places, unless they are zeros.
		if (!value) value = 0;
		return parseFloat( value.toString().replace(/^(\-?\d+\.[0]*\d{2}).*$/, '$1') );
	},
	
	pct: function(count, max, floor) {
		// Return formatted percentage given a number along a sliding scale from 0 to 'max'
		var pct = (count * 100) / (max || 1);
		if (!pct.toString().match(/^\d+(\.\d+)?$/)) { pct = 0; }
		return '' + (floor ? Math.floor(pct) : this.shortFloat(pct)) + '%';
	},
	
	zeroPad: function(value, len) {
		// Pad a number with zeroes to achieve a desired total length (max 10)
		return ('0000000000' + value).slice(0 - len);
	},
	
	getTextFromSeconds: function(sec, abbrev, no_secondary) {
		// convert raw seconds to human-readable relative time
		var neg = '';
		sec = Math.floor(sec);
		if (sec<0) { sec =- sec; neg = '-'; }
		
		var p_text = abbrev ? "sec" : "second";
		var p_amt = sec;
		var s_text = "";
		var s_amt = 0;
		
		if (sec > 59) {
			var min = Math.floor(sec / 60);
			sec = sec % 60; 
			s_text = abbrev ? "sec" : "second"; 
			s_amt = sec; 
			p_text = abbrev ? "min" : "minute"; 
			p_amt = min;
			
			if (min > 59) {
				var hour = Math.floor(min / 60);
				min = min % 60; 
				s_text = abbrev ? "min" : "minute"; 
				s_amt = min; 
				p_text = abbrev ? "hr" : "hour"; 
				p_amt = hour;
				
				if (hour > 23) {
					var day = Math.floor(hour / 24);
					hour = hour % 24; 
					s_text = abbrev ? "hr" : "hour"; 
					s_amt = hour; 
					p_text = "day"; 
					p_amt = day;
				} // hour>23
			} // min>59
		} // sec>59
		
		var text = p_amt + " " + p_text;
		if ((p_amt != 1) && !abbrev) text += "s";
		if (s_amt && !no_secondary) {
			text += ", " + s_amt + " " + s_text;
			if ((s_amt != 1) && !abbrev) text += "s";
		}
		
		return(neg + text);
	},
	
	getSecondsFromText: function(text) {
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
	},
	
	getNiceRemainingTime: function(elapsed, counter, counter_max, abbrev, shorten) {
		// estimate remaining time given starting epoch, a counter and the 
		// counter maximum (i.e. percent and 100 would work)
		// return in english-readable format
		if (counter == counter_max) return 'Complete';
		if (counter == 0) return 'n/a';
		
		var sec_remain = Math.floor(((counter_max - counter) * elapsed) / counter);
		
		return this.getTextFromSeconds( sec_remain, abbrev, shorten );
	},
	
	randArray: function(arr) {
		// return random element from array
		return arr[ Math.floor(Math.random() * arr.length) ];
	},
	
	pluralize: function(word, num) {
		// apply english pluralization to word if 'num' is not equal to 1
		if (num != 1) {
			return word.replace(/y$/, 'ie') + 's';
		}
		else return word;
	},
	
	escapeRegExp: function(text) {
		// escape text for regular expression
		return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	},
	
	ucfirst: function(text) {
		// capitalize first character only, lower-case rest
		return text.substring(0, 1).toUpperCase() + text.substring(1, text.length).toLowerCase();
	},
	
	getErrorDescription: function(err) {
		// attempt to get better error description using 'errno' module
		var msg = err.message;
		
		if (err.errno && ErrNo.code[err.errno]) {
			msg = this.ucfirst(ErrNo.code[err.errno].description) + " (" + err.message + ")";
		}
		else if (err.code && ErrNo.code[err.code]) {
			msg = this.ucfirst(ErrNo.code[err.code].description) + " (" + err.message + ")";
		}
		
		return msg;
	},
	
	bufferSplit: function(buf, chunk) {
		// Split a buffer like string split (no reg exp support tho)
		// WARNING: Splits use SAME MEMORY SPACE as original buffer
		var idx = -1;
		var lines = [];
		
		while ((idx = buf.indexOf(chunk)) > -1) {
			lines.push( buf.slice(0, idx) );
			buf = buf.slice( idx + chunk.length, buf.length );
		}
		
		lines.push(buf);
		return lines;
	},
	
	fileEachLine: function(file, opts, iterator, callback) {
		// asynchronously process file line by line, using very little memory
		var self = this;
		if (!callback && (typeof(opts) == 'function')) {
			// support 3-arg convention: file, iterator, callback
			callback = iterator;
			iterator = opts;
			opts = {};
		}
		if (!opts) opts = {};
		if (!opts.buffer_size) opts.buffer_size = 1024;
		if (!opts.eol) opts.eol = os.EOL;
		if (!('encoding' in opts)) opts.encoding = 'utf8';
		
		var chunk = Buffer.alloc ? Buffer.alloc(opts.buffer_size) : (new Buffer(opts.buffer_size));
		var lastChunk = null;
		var processNextLine = null;
		var processChunk = null;
		var readNextChunk = null;
		var lines = [];
		
		fs.open(file, "r", function(err, fh) {
			if (err) {
				if ((err.code == 'ENOENT') && (opts.ignore_not_found)) return callback();
				else return callback(err);
			}
			
			processNextLine = function() {
				// process single line from buffer
				var line = lines.shift();
				if (opts.encoding) line = line.toString( opts.encoding );
				
				iterator(line, function(err) {
					if (err) {
						fs.close(fh, function() {});
						return callback(err);
					}
					// if (lines.length) setImmediate( processNextLine ); // ensure async
					if (lines.length) process.nextTick( processNextLine );
					else readNextChunk();
				});
			};
			
			processChunk = function(err, num_bytes, chunk) {
				if (err) {
					fs.close(fh, function() {});
					return callback(err);
				}
				var eof = (num_bytes != opts.buffer_size);
				var data = chunk.slice(0, num_bytes);
				
				if (lastChunk && lastChunk.length) {
					data = Buffer.concat([lastChunk, data], lastChunk.length + data.length);
					lastChunk = null;
				}
				
				if (data.length) {
					lines = self.bufferSplit( data, opts.eol );
					
					// see if data ends on EOL -- if not, we have a partial block
					// fill buffer for next read (unless at EOF)
					if (data.slice(0 - opts.eol.length).toString() == opts.eol) {
						lines.pop(); // remove empty line caused by split
					}
					else if (!eof) {
						// more to read, save excess for next loop iteration
						var line = lines.pop();
						lastChunk = Buffer.from ? Buffer.from(line) : (new Buffer(line));
					}
					
					if (lines.length) processNextLine();
					else readNextChunk();
				}
				else {
					// close file and complete
					fs.close(fh, callback);
				}
			};
			
			readNextChunk = function() {
				// read chunk from file
				fs.read(fh, chunk, 0, opts.buffer_size, null, processChunk);
			};
			
			// begin reading
			readNextChunk();
		}); // fs.open
	},
	
	getpwnam: function(username, use_cache) {
		// Simulate POSIX getpwnam by querying /etc/passwd on linux, or /usr/bin/id on darwin / OSX.
		// Accepts username or uid, and can optionally cache results for repeat queries for same user.
		// Response keys: username, password, uid, gid, name, dir, shell
		var user = null;
		
		if (use_cache && this.user_cache[username]) {
			return this.copyHash( this.user_cache[username] );
		}
		
		if (process.platform === 'linux') {
			// use /etc/passwd on linux
			var lines = null;
			try { lines = fs.readFileSync('/etc/passwd', 'utf8').trim().split(/\n/); }
			catch (err) { return null; }
			
			for (var idx = 0, len = lines.length; idx < len; idx++) {
				var cols = lines[idx].trim().split(':');
				if ((username == cols[0]) || (username == Number(cols[2]))) {
					user = {
						username: cols[0],
						password: cols[1],
						uid: Number(cols[2]),
						gid: Number(cols[3]),
						name: cols[4] && cols[4].split(',')[0],
						dir: cols[5],
						shell: cols[6]
					};
					idx = len;
				} // found user
			} // foreach line
			
			if (!user) {
				// user not found
				return null;
			}
		}
		else if (process.platform === 'darwin') {
			// use /usr/bin/id on darwin / OSX
			var cols = null;
			var opts = { timeout: 1000, encoding: 'utf8', stdio: 'pipe' };
			try { cols = cp.execSync('/usr/bin/id -P ' + username, opts).trim().split(':'); }
			catch (err) { return null; }
			
			if ((username == cols[0]) || (username == Number(cols[2]))) {
				user = {
					username: cols[0],
					password: cols[1],
					uid: Number(cols[2]),
					gid: Number(cols[3]),
					name: cols[7],
					dir: cols[8],
					shell: cols[9]
				};
			}
			else {
				// something went wrong
				return null;
			}
		}
		else {
			// unsupported platform
			return null;
		}
		
		if (use_cache) {
			this.user_cache[ user.username ] = user;
			this.user_cache[ user.uid ] = user;
			return this.copyHash( user );
		}
		else {
			return user;
		}
	}
	
};
