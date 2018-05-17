/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var t = require('assert');
var crypto = require('crypto');

var eventListener = require('./listener');

var KafkaConsumer = require('../').KafkaConsumer;

var kafkaBrokerList = process.env.KAFKA_HOST || 'localhost:9092';
var topic = 'test';

describe('Consumer', function() {
  var gcfg;

  beforeEach(function() {
    var grp = 'kafka-mocha-grp-' + crypto.randomBytes(20).toString('hex');
     gcfg = {
      'bootstrap.servers': kafkaBrokerList,
      'group.id': grp,
      'debug': 'all',
      'rebalance_cb': true
    };
  });

  describe('commit', function() {
    var consumer;
    beforeEach(function(done) {
      consumer = new KafkaConsumer(gcfg, {});

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);
        done();
      });

      eventListener(consumer);
    });

    afterEach(function(done) {
      consumer.disconnect(function() {
        done();
      });
    });
  });

  describe('committed and position', function() {
    var consumer;
    beforeEach(function(done) {
      consumer = new KafkaConsumer(gcfg, {});

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);
        done();
      });

      eventListener(consumer);
    });

    afterEach(function(done) {
      consumer.disconnect(function() {
        done();
      });
    });

    it('before assign, committed offsets are empty', function(done) {
      consumer.committed(null, 1000, function(err, committed) {
        t.ifError(err);
        t.equal(Array.isArray(committed), true, 'Committed offsets should be an array');
        t.equal(committed.length, 0);
        done();
      });
    });

    it('before assign, position returns an empty array', function() {
      var position = consumer.position();
      t.equal(Array.isArray(position), true, 'Position should be an array');
      t.equal(position.length, 0);
    });

    it('after assign, should get committed array without offsets ', function(done) {
      consumer.assign([{topic:topic, partition:0}]);
      // Defer this for a second
      setTimeout(function() {
        consumer.committed(null, 1000, function(err, committed) {
          t.ifError(err);
          t.equal(committed.length, 1);
          t.equal(typeof committed[0], 'object', 'TopicPartition should be an object');
          t.deepStrictEqual(committed[0].partition, 0);
          t.equal(committed[0].offset, undefined);
          done();
        });
      }, 1000);
    });

    it('after assign and commit, should get committed offsets', function(done) {
      this.timeout(6000);
      consumer.assign([{topic:topic, partition:0}]);
      consumer.commitSync({topic:topic, partition:0, offset:1000});
      consumer.committed(null, 1000, function(err, committed) {
        t.ifError(err);
        t.equal(committed.length, 1);
        t.equal(typeof committed[0], 'object', 'TopicPartition should be an object');
        t.deepStrictEqual(committed[0].partition, 0);
        t.deepStrictEqual(committed[0].offset, 1000);
        done();
      });
    });
    it('after assign, before consume, position should return an array without offsets', function(done) {
      consumer.assign([{topic:topic, partition:0}]);
      var position = consumer.position();
      t.equal(Array.isArray(position), true, 'Position should be an array');
      t.equal(position.length, 1);
      t.equal(typeof position[0], 'object', 'TopicPartition should be an object');
      t.deepStrictEqual(position[0].partition, 0);
      t.equal(position[0].offset, undefined, 'before consuming, offset is undefined');
      // see both.spec.js 'should be able to produce, consume messages, read position...'
      // for checking of offset numeric value
      done();
    });

    it('should obey the timeout', function(done) {
      consumer.committed(null, 0, function(err, committed) {
        if (!err) {
          t.fail(err, 'not null', 'Error should be set for a timeout');
        }
        done();
      });
    });

  });

  describe('seek and positioning', function() {
    var consumer;
    beforeEach(function(done) {
      consumer = new KafkaConsumer(gcfg, {});

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);
        consumer.assign([{
          topic: 'test',
          partition: 0,
          offset: 0
        }]);
        done();
      });

      eventListener(consumer);
    });

    afterEach(function(done) {
      consumer.disconnect(function() {
        done();
      });
    });

    it('should be able to seek', function(cb) {
      consumer.seek({
        topic: 'test',
        partition: 0,
        offset: 0
      }, 1, function(err) {
        t.ifError(err);
        cb();
      });
    });

    it('should be able to seek with a timeout of 0', function(cb) {
      consumer.seek({
        topic: 'test',
        partition: 0,
        offset: 0
      }, 0, function(err) {
        t.ifError(err);
        cb();
      });
    });
  });

  describe('subscribe', function() {

    var consumer;
    beforeEach(function(done) {
      consumer = new KafkaConsumer(gcfg, {});

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);
        done();
      });

      eventListener(consumer);
    });

    afterEach(function(done) {
      consumer.disconnect(function() {
        done();
      });
    });

    it('should be able to subscribe', function() {
      t.equal(0, consumer.subscription().length);
      consumer.subscribe([topic]);
      t.equal(1, consumer.subscription().length);
      t.equal('test', consumer.subscription()[0]);
      t.equal(0, consumer.assignments().length);
    });

    it('should be able to unsusbcribe', function() {
      consumer.subscribe([topic]);
      t.equal(1, consumer.subscription().length);
      consumer.unsubscribe();
      t.equal(0, consumer.subscription().length);
      t.equal(0, consumer.assignments().length);
    });
  });

  describe('assign', function() {

    var consumer;
    beforeEach(function(done) {
      consumer = new KafkaConsumer(gcfg, {});

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);
        done();
      });

      eventListener(consumer);
    });

    afterEach(function(done) {
      consumer.disconnect(function() {
        done();
      });
    });

    it('should be able to take an assignment', function() {
      t.equal(0, consumer.assignments().length);
      consumer.assign([{ topic:topic, partition:0 }]);
      t.equal(1, consumer.assignments().length);
      t.equal(topic, consumer.assignments()[0].topic);
      t.equal(0, consumer.subscription().length);
    });

    it('should be able to take an empty assignment', function() {
      consumer.assign([{ topic:topic, partition:0 }]);
      t.equal(1, consumer.assignments().length);
      consumer.assign([]);
      t.equal(0, consumer.assignments().length);
    });
  });

  describe('disconnect', function() {
    var tcfg = { 'auto.offset.reset': 'earliest' };

    it('should happen gracefully', function(cb) {
      var consumer = new KafkaConsumer(gcfg, tcfg);

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);

        consumer.disconnect(function() {
          cb();
        });

      });

    });

    it('should happen without issue after subscribing', function(cb) {
      var consumer = new KafkaConsumer(gcfg, tcfg);

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);

        consumer.subscribe([topic]);

        consumer.disconnect(function() {
          cb();
        });

      });

    });

    it('should happen without issue after consuming', function(cb) {
      this.timeout(11000);

      var consumer = new KafkaConsumer(gcfg, tcfg);
      consumer.setDefaultConsumeTimeout(10000);

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);

        consumer.subscribe([topic]);

        consumer.consume(1, function(err, messages) {
          t.ifError(err);

          consumer.disconnect(function() {
            cb();
          });
        });

      });

    });

    it('should happen without issue after consuming an error', function(cb) {
      var consumer = new KafkaConsumer(gcfg, tcfg);

      consumer.setDefaultConsumeTimeout(1);

      consumer.connect({ timeout: 2000 }, function(err, info) {
        t.ifError(err);

        consumer.subscribe([topic]);

        consumer.consume(1, function(err, messages) {

          // Timeouts do not classify as errors anymore
          t.equal(messages[0], undefined, 'Message should not be set');

          consumer.disconnect(function() {
            cb();
          });
        });

      });
    });

  });
});
