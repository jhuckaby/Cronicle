/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var Writable = require('stream').Writable;

var Kafka = require('../');
var count = 0;
var total = 0;
var store = [];
var host = process.argv[2] || 'localhost:9092';
var topic = process.argv[3] || 'test';

var stream = Kafka.createReadStream({
  'metadata.broker.list': host,
  'group.id': 'node-rdkafka-benchs',
  'fetch.wait.max.ms': 100,
  'fetch.message.max.bytes': 1024 * 1024,
  'enable.auto.commit': false
  // paused: true,
}, {
  'auto.offset.reset': 'earliest'
}, {
  fetchSize: 16,
  topics: [topic]
});

// Track how many messages we see per second
var interval;

var isShuttingDown = false;

stream
  .on('error', function(err) {
    console.log('Shutting down due to error');
    console.log(err.stack);
    shutdown();
  })
  .once('data', function(d) {
    interval = setInterval(function() {
      if (isShuttingDown) {
        clearInterval(interval);
      }
      console.log('%d messages per second', count);
      if (count > 0) {
        // Don't store ones when we didn't get data i guess?
        store.push(count);
        // setTimeout(shutdown, 500);
      }
     count = 0;
   }, 1000).unref();
  })
  .on('end', function() {
    // Can be called more than once without issue because of guard var
    console.log('Shutting down due to stream end');
    shutdown();
  })
  .pipe(new Writable({
    objectMode: true,
    write: function(message, encoding, cb) {
      count += 1;
      total += 1;
      setImmediate(cb);
    }
  }));

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
process.once('SIGHUP', shutdown);

function shutdown() {
  if (isShuttingDown) {
    return;
  }
  clearInterval(interval);
  isShuttingDown = true;
  if (store.length > 0) {
    var calc = 0;
    for (var x in store) {
      calc += store[x];
    }

    var mps = parseFloat(calc * 1.0/store.length);

    console.log('%d messages per second on average', mps);
  }

  // Destroy the stream
  stream.destroy();

  stream.once('end', function() {
    console.log('total: %d', total);
  });

}
