'use strict';

var getInclude = process.argv[2];

var fs = require('fs');
var path = require('path');

var baseDir = path.resolve(__dirname, '../');
var librdkafkaConfig = path.resolve(baseDir, 'deps', 'librdkafka', 'Makefile.config');

var isWin = /^win/.test(process.platform);

// Skip running this if we are running on a windows system
if (isWin) {
  process.stdout.write('0');
  process.exit(0);
}

var buf;

try {
  buf = fs.readFileSync(librdkafkaConfig);
} catch (e) {
  if (e.code === 'ENOENT') {
    process.stderr.write('Please run configure before using this script\n');
    process.exit(1);
  }
}

var bufLines = buf.toString().split('\n');

// Get rid of comment lines and get rid of empty lines
bufLines = bufLines.map(function(line) {
  return line.trim();
}).filter(function(line) {
  if (line === '') {
    return false;
  }

  if (line.startsWith('//')) {
    return false;
  }

  if (line.startsWith('#pragma')) {
    return false;
  }

  return true;
});

var libDirs = [];

var currentKey = null;

// Key pattern. Word boundaries with padding tabs or spaces
var KEY_PATTERN = /^(\w+)\+?\=[ \t]*/;

bufLines.forEach(function(line) {
  var matches;
  // Check if the line is establishing a new key
  if (matches = line.match(KEY_PATTERN)) {
    currentKey = matches[1];
  }

  if (!currentKey) {
    return;
  }

  // Strip out the key pattern
  var modified = line.replace(KEY_PATTERN, '').trim();

  if (!modified) {
    return;
  }

  if (!getInclude) {
    // console.log('Processing for key: ' + currentKey);
    if (currentKey === 'LIBS') {
      var currentLibDirs = modified.split(/[ \t]/).filter(function(v) {
        return v.startsWith('-L');
      }).map(function(v) {
        return v.substring(2);
      });

      libDirs = libDirs.concat(currentLibDirs);
    }
  } else {
    if (currentKey === 'CFLAGS') {
      var currentIDirs = modified.split(/[ \t]/).filter(function(v) {
        return v.startsWith('-I');
      }).map(function(v) {
        return v.substring(2);
      });

      libDirs = libDirs.concat(currentIDirs);
    }
  }

});

process.stdout.write(libDirs.join(' '));
