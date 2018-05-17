/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var crypto = require('crypto');
var t = require('assert');

var Kafka = require('../');
var kafkaBrokerList = process.env.KAFKA_HOST || 'localhost:9092';
var eventListener = require('./listener');

describe('Consumer group/Producer', function() {

  var producer;
  var consumer;
  var grp = 'kafka-mocha-grp-' + crypto.randomBytes(20).toString('hex');

  var config = {
    'metadata.broker.list': kafkaBrokerList,
    'group.id': grp,
    'fetch.wait.max.ms': 1000,
    'session.timeout.ms': 10000,
    'enable.auto.commit': false,
    'debug': 'all'
  };

  beforeEach(function(done) {
    producer = new Kafka.Producer({
      'client.id': 'kafka-mocha',
      'metadata.broker.list': kafkaBrokerList,
      'fetch.wait.max.ms': 1,
      'debug': 'all',
      'dr_cb': true
    });

    producer.connect({}, function(err, d) {
      t.ifError(err);
      t.equal(typeof d, 'object', 'metadata should be returned');
      done();
    });

    eventListener(producer);
  });

  beforeEach(function(done) {
    consumer = new Kafka.KafkaConsumer(config, {
      'auto.offset.reset': 'largest'
    });

    consumer.connect({}, function(err, d) {
      t.ifError(err);
      t.equal(typeof d, 'object', 'metadata should be returned');
      done();
    });

    eventListener(consumer);
  });

  afterEach(function(done) {
    producer.disconnect(function() {
      done();
    });
  });

  it('should be able to commit, read committed and restart from the committed offset', function(done) {
    this.timeout(30000);
    var topic = 'test';
    var key = 'key';
    var payload = new Buffer('value');
    var count = 0;
    var offsets = {
      'first': true
    };

    var tt = setInterval(function() {
      try {
        producer.produce(topic, null, payload, key);
      } catch (e) {
        clearInterval(tt);
      }
    }, 100);

    consumer.on('disconnected', function() {
      var consumer2 = new Kafka.KafkaConsumer(config, {
        'auto.offset.reset': 'largest'
      });

      consumer2.on('data', function(message) {
        if (offsets.first) {
          offsets.first = false;
          t.deepStrictEqual(offsets.committed, message.offset, 'Offset read by consumer 2 incorrect');
          clearInterval(tt);
          consumer2.unsubscribe();
          consumer2.disconnect(function() {
            done();
          });
        }
      });

      consumer2.on('ready', function() {
        consumer2.subscribe([topic]);
        consumer2.consume();
      });
      consumer2.connect();
    });

    consumer.on('data', function(message) {
      count++;
      if (count === 3) {
        consumer.commitMessageSync(message);
        // test consumer.committed( ) API
        consumer.committed(null, 5000, function(err, topicPartitions) {
          t.ifError(err);
          t.deepStrictEqual(topicPartitions.length, 1);
          t.deepStrictEqual(topicPartitions[0].offset, message.offset + 1, 'Offset read by consumer 1 incorrect');
          offsets.committed = message.offset + 1;
          consumer.unsubscribe();
          consumer.disconnect();
        });

      }
    });

    consumer.subscribe([topic]);
    consumer.consume();
  });

});
