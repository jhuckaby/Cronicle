'use strict';

var query = process.argv[2];

var fs = require('fs');
var path = require('path');

var baseDir = path.resolve(__dirname, '../');
var librdkafkaConfig = path.resolve(baseDir, 'deps', 'librdkafka', 'config.h');

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

var defines = {};

bufLines.forEach(function(line) {
  if (line.startsWith('#define')) {
    var modified = line.substring('#define'.length).trim();
    var varSplit = modified.split(' ');
    if (varSplit.length >= 2 && varSplit[0] && varSplit[1]) {
      defines[varSplit[0]] = varSplit[1];
    }
  }
});

if (defines.hasOwnProperty(query)) {
  process.stdout.write(defines[query]);
} else {
  process.stdout.write('0');
}
