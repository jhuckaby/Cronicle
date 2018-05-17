/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var Kafka = require('../');
var count = 0;
var total = 0;
var store = [];
var host = process.argv[2] || 'localhost:9092';
var topic = process.argv[3] || 'test';

var consumer = new Kafka.KafkaConsumer({
  'metadata.broker.list': host,
  'group.id': 'node-rdkafka-bench-s',
  'fetch.wait.max.ms': 100,
  'fetch.message.max.bytes': 1024 * 1024,
  'enable.auto.commit': false
  // paused: true,
}, {
  'auto.offset.reset': 'earliest'
});

var interval;

consumer.connect()
  .once('ready', function() {
    consumer.subscribe([topic]);
    consumer.consume();
  })
  .on('rebalance', function() {
    console.log('rebalance');
  })
  .once('data', function() {
    interval = setInterval(function() {
      console.log('%d messages per second', count);
      if (count > 0) {
        store.push(count);
      }
      count = 0;
    }, 1000);
  })
  .on('data', function(message) {
    count += 1;
    total += 1;
  });

function shutdown() {
  clearInterval(interval);

  if (store.length > 0) {
    var calc = 0;
    for (var x in store) {
      calc += store[x];
    }

    var mps = parseFloat(calc * 1.0/store.length);

    console.log('%d messages per second on average', mps);

  }

  var killTimer = setTimeout(function() {
    process.exit();
  }, 5000);

  consumer.disconnect(function() {
    clearTimeout(killTimer);
    process.exit();
  });

}
