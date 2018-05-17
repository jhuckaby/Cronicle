var http = require('http');
var daemon = require('../../');

var port = process.argv[2];

daemon({
    stdout: process.stdout,
    stderr: process.stderr
});

var server = http.createServer(function(req, res) {
    res.end('' + process.pid);
});

server.listen(port);

// safety, kills process if test framework doesn't
setTimeout(function() {
    process.exit();
}, 5000);

