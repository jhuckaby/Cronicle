'use strict';

var env = process.argv[2];
var def = process.argv[3] || '';

process.stdout.write(process.env[env] || def);
