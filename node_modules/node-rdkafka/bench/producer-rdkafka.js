/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var Kafka = require('../');
var crypto = require('crypto');
var count = 0;
var total = 0;
var totalComplete = 0;
var store = [];
var host = process.argv[2] || '127.0.0.1:9092';
var topicName = process.argv[3] || 'test';
var compression = process.argv[4] || 'gzip';
var MAX = process.argv[5] || 1000000;

var stream = Kafka.Producer.createWriteStream({
  'metadata.broker.list': host,
  'group.id': 'node-rdkafka-bench',
  'compression.codec': compression,
  'retry.backoff.ms': 200,
  'message.send.max.retries': 10,
  'socket.keepalive.enable': true,
  'queue.buffering.max.messages': 100000,
  'queue.buffering.max.ms': 1000,
  'batch.num.messages': 1000,
}, {}, {
  topic: topicName,
  pollInterval: 20
});

stream.on('error', function(e) {
  console.log(e);
  process.exit(1);
});

// Track how many messages we see per second
var interval;
var done = false;

function log() {
  console.log('%d messages per sent second', count);
  store.push(count);
  count = 0;
}

crypto.randomBytes(4096, function(ex, buffer) {

  var x = function(e) {
    if (e) {
      console.error(e);
    }
    count += 1;
    totalComplete += 1;
    if (totalComplete >= MAX && !done) {
      done = true;
      clearInterval(interval);
      setTimeout(shutdown, 5000);
    }
  };

  function write() {
    if (!stream.write(buffer, 'base64', x)) {
      return stream.once('drain', write);
    } else {
      total++;
    }

    if (total < MAX) {
      // we are not done
      setImmediate(write);
    }

  }

  write();
  interval = setInterval(log, 1000);
  stream.on('error', function(err) {
    console.log(err);
  });
  // stream.on('end', shutdown);

});


process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
process.once('SIGHUP', shutdown);

function shutdown() {

  if (store.length > 0) {
    var calc = 0;
    for (var x in store) {
      calc += store[x];
    }

    var mps = parseFloat(calc * 1.0/store.length);

    console.log('%d messages per second on average', mps);
    console.log('%d messages total', total);

  }

  clearInterval(interval);

  stream.end();

  stream.on('close', function() {
    console.log('total: %d', total);
  });

}
