var assert = require('assert');
var http = require('http');
var spawn = require('child_process').spawn;
var after = require('after');

function launch(args) {
    var child = spawn(process.execPath, args);

    child.stdout.pipe(process.stdout, {end: false});
    child.stderr.pipe(process.stderr, {end: false});

    return child;
};

// sanity check that a no daemon process exits
test('no daemon', function(done) {
    var script = __dirname + '/fixtures/nodaemon.js';
    var child = launch([script]);
    child.on('exit', function(code) {
      assert.equal(code, 0);
      done();
    });
});

test('simple', function(done) {
    var script = __dirname + '/fixtures/simple.js';

    done = after(2, done);
    var port = 12345;

    var child = launch([script, port]);

    child.stdout.pipe(process.stdout, {end: false});
    child.stderr.pipe(process.stderr, {end: false});

    // spawning child should exit
    child.on('exit', function(code) {
      assert.equal(code, 0);
      done();
    });

    // wait for http server to start up
    setTimeout(function() {
      var opt = {
        host: 'localhost',
        port: port
      };

      http.get(opt, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          process.kill(chunk, 'SIGTERM');
          done();
        });
      });
    }, 500);
});

