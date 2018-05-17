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
var verifiedComplete = 0;
var errors = 0;
var store = [];
var started;
var done = false;
var host = process.argv[2] || '127.0.0.1:9092';
var topicName = process.argv[3] || 'test';
var compression = process.argv[4] || 'gzip';
var MAX = process.argv[5] || 10000000;

var producer = new Kafka.Producer({
  'metadata.broker.list': host,
  'group.id': 'node-rdkafka-bench',
  'compression.codec': compression,
  'retry.backoff.ms': 200,
  'message.send.max.retries': 10,
  'socket.keepalive.enable': true,
  'queue.buffering.max.messages': 100000,
  'queue.buffering.max.ms': 1000,
  'batch.num.messages': 1000
});

// Track how many messages we see per second
var interval;
var ok = true;

function getTimer() {
  if (!interval) {
    interval = setTimeout(function() {
      interval = false;
      if (!done) {
        console.log('%d messages per sent second', count);
        store.push(count);
        count = 0;
        getTimer();

      } else {
        console.log('%d messages remaining sent in last batch <1000ms', count);
      }
    }, 1000);
  }

  return interval;
}

var t;

crypto.randomBytes(4096, function(ex, buffer) {

  producer.connect()
    .on('ready', function() {
      getTimer();

      started = new Date().getTime();

      var sendMessage = function() {
        try {
          var errorCode = producer.produce(topicName, null, buffer, null);
          verifiedComplete += 1;
        } catch (e) {
          console.error(e);
          errors++;
        }

        count += 1;
        totalComplete += 1;
        if (totalComplete === MAX) {
          shutdown();
        }
        if (total < MAX) {
          total += 1;

          // This is 100% sync so we need to setImmediate to give it time
          // to breathe.
          setImmediate(sendMessage);
        }
      };

      sendMessage();

    })
    .on('event.error', function(err) {
      console.error(err);
      process.exit(1);
    })
    .on('disconnected', shutdown);

});

function shutdown(e) {
  done = true;

  clearInterval(interval);

  var killTimer = setTimeout(function() {
    process.exit();
  }, 5000);

  producer.disconnect(function() {
    clearTimeout(killTimer);
    var ended = new Date().getTime();
    var elapsed = ended - started;

    // console.log('Ended %s', ended);
    console.log('total: %d messages over %d ms', total, elapsed);

    console.log('%d messages / second', parseInt(total / (elapsed / 1000)));
    process.exit();
  });

}
