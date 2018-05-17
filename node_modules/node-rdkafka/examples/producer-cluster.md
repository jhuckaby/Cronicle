```js
/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var cluster = require('cluster');
var numCPUs = 6;
var Kafka = require('../');

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  var exited_workers = 0;

  cluster.on('exit', function(worker, code, signal) {
    exited_workers++;
    if (exited_workers === numCPUs - 1) {
      process.exit();
    }
  });
} else {
  // Configure client
  var producer = new Kafka.Producer({
    'client.id': 'kafka',
    'metadata.broker.list': 'localhost:9092',
    'compression.codec': 'none',
    'retry.backoff.ms': 200,
    'message.send.max.retries': 10,
    'socket.keepalive.enable': true,
    'queue.buffering.max.messages': 100000,
    'queue.buffering.max.ms': 1000,
    'batch.num.messages': 1000000,
    'dr_cb': true
  });

  producer.setPollInterval(100);

  var total = 0;
  var totalSent = 0;
  var max = 20000;
  var errors = 0;
  var started = Date.now();

  var sendMessage = function() {
    var ret = producer.sendMessage({
      topic: 'librdtesting-01',
      message: new Buffer('message ' + total)
    }, function() {
    });
    total++;
    if (total >= max) {
    } else {
      setImmediate(sendMessage);
    }
  };

  var verified_received = 0;
  var exitNextTick = false;
  var errorsArr = [];

  var t = setInterval(function() {
    producer.poll();

    if (exitNextTick) {
      clearInterval(t);
      return setTimeout(function() {
        console.log('[%d] Received: %d, Errors: %d, Total: %d', process.pid, verified_received, errors, total);
        // console.log('[%d] Finished sending %d in %d seconds', process.pid, total, parseInt((Date.now() - started) / 1000));
        if (errors > 0) {
          console.error(errorsArr[0]);
          return process.exitCode = 1;
        }
        process.exitCode = 0;
        setTimeout(process.exit, 1000);
      }, 2000);
    }

    if (verified_received + errors === max) {
      exitNextTick = true;
    }

  }, 1000);
  producer.connect()
    .on('event.error', function(e) {
      errors++;
      errorsArr.push(e);
    })
    .on('delivery-report', function() {
      verified_received++;
    })
    .on('ready', sendMessage);


}
```
