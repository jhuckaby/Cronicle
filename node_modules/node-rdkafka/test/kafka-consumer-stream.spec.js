/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

var KafkaConsumerStream = require('../lib/kafka-consumer-stream');
var t = require('assert');
var Writable = require('stream').Writable;
var Emitter = require('events');

var fakeClient;

module.exports = {
  'KafkaConsumerStream stream': {
    'beforeEach': function() {
      fakeClient = new Emitter();
      fakeClient._isConnecting = false;
      fakeClient._isConnected = true;
      fakeClient.isConnected = function() {
        return true;
      };
      fakeClient.unsubscribe = function() {
        this.emit('unsubscribed');
        return true;
      };
      fakeClient.disconnect = function(cb) {
        this.emit('disconnected');
        if (cb) {
          t.equal(typeof cb, 'function');
          setImmediate(cb);
        }
      };
      fakeClient.consume = function(size, cb) {
        if (!size) {
          cb = size;
        }

        t.equal(typeof cb, 'function',
          'Provided callback should always be a function');
        setImmediate(function() {
          cb(null, [{
            value: new Buffer('test'),
            key: 'testkey',
            offset: 1
          }]);
        });
      };
      fakeClient.subscribe = function(topics) {
        t.equal(Array.isArray(topics), true);
        return this;
      };
    },

    'exports a stream class': function() {
      t.equal(typeof(KafkaConsumerStream), 'function');
    },

    'can be instantiated': function() {
      t.equal(typeof new KafkaConsumerStream(fakeClient, {
        topics: 'topic'
      }), 'object');
    },

    'properly reads off the fake client': function(cb) {
      var stream = new KafkaConsumerStream(fakeClient, {
        topics: 'topic'
      });
      stream.on('error', function(err) {
        t.fail(err);
      });
      stream.once('readable', function() {
        var message = stream.read();
        t.notEqual(message, null);
        t.ok(Buffer.isBuffer(message.value));
        t.equal('test', message.value.toString());
        t.equal('testkey', message.key);
        t.equal(typeof message.offset, 'number');
        stream.pause();
        cb();
      });
    },

    'properly reads off the fake with a topic function': function(cb) {
      fakeClient._metadata = {
        orig_broker_id: 1,
        orig_broker_name: "broker_name",
        brokers: [
          {
            id: 1,
            host: 'localhost',
            port: 40
          }
        ],
        topics: [
          {
            name: 'awesome-topic',
            partitions: [
              {
                id: 1,
                leader: 20,
                replicas: [1, 2],
                isrs: [1, 2]
              }
            ]
          }
        ]
      };

      var stream = new KafkaConsumerStream(fakeClient, {
        topics: function(metadata) {
          var topics = metadata.topics.map(function(v) {
            return v.name;
          });

          return topics;
        }
      });
      fakeClient.subscribe = function(topics) {
        t.equal(Array.isArray(topics), true);
        t.equal(topics[0], 'awesome-topic');
        t.equal(topics.length, 1);
        return this;
      };

      stream.on('error', function(err) {
        t.fail(err);
      });
      stream.once('readable', function() {
        var message = stream.read();
        t.notEqual(message, null);
        t.ok(Buffer.isBuffer(message.value));
        t.equal('test', message.value.toString());
        t.equal('testkey', message.key);
        t.equal(typeof message.offset, 'number');
        stream.pause();
        cb();
      });
    },

    'properly reads correct number of messages but does not stop': function(next) {
      var numMessages = 10;
      var numReceived = 0;
      var numSent = 0;

      fakeClient.consume = function(size, cb) {
        if (numSent < numMessages) {
          numSent++;
          setImmediate(function() {
            cb(null, [{
              value: new Buffer('test'),
              offset: 1
            }]);
          });
        } else {
        }
      };
      var stream = new KafkaConsumerStream(fakeClient, {
        topics: 'topic'
      });
      stream.on('error', function(err) {
        // Ignore
      });
      stream.on('readable', function() {
        var message = stream.read();
        numReceived++;
        t.notEqual(message, null);
        t.ok(Buffer.isBuffer(message.value));
        t.equal(typeof message.offset, 'number');
        if (numReceived === numMessages) {
          // give it a second to get an error
          next();
        }
      });
    },

    'can be piped around': function(cb) {
      var stream = new KafkaConsumerStream(fakeClient, {
        topics: 'topic'
      });
      var writable = new Writable({
        write: function(message, encoding, next) {
          t.notEqual(message, null);
          t.ok(Buffer.isBuffer(message.value));
          t.equal(typeof message.offset, 'number');
          this.cork();
          cb();
        },
        objectMode: true
      });

      stream.pipe(writable);
      stream.on('error', function(err) {
        t.fail(err);
      });

    },

    'streams as batch when specified': function(next) {
      var numMessages = 10;
      var numReceived = 0;
      var numSent = 0;

      fakeClient.consume = function(size, cb) {
        if (numSent < numMessages) {
          numSent++;
          setImmediate(function() {
            cb(null, [{
              value: new Buffer('test'),
              offset: 1
            }]);
          });
        } else {
        }
      };
      var stream = new KafkaConsumerStream(fakeClient, {
        topics: 'topic',
        streamAsBatch: true
      });
      stream.on('error', function(err) {
        // Ignore
      });
      stream.on('readable', function() {
        var messages = stream.read();
        numReceived++;
        t.equal(Array.isArray(messages), true);
        t.equal(messages.length, 1);
        var message = messages[0];

        t.notEqual(message, null);
        t.ok(Buffer.isBuffer(message.value));
        t.equal(typeof message.offset, 'number');
        if (numReceived === numMessages) {
          // give it a second to get an error
          next();
        }
      });
    },

    'stops reading on unsubscribe': function(next) {
      var numMessages = 10;
      var numReceived = 0;
      var numSent = 0;

      fakeClient.consume = function(size, cb) {
        if (numSent < numMessages) {
          numSent++;
          setImmediate(function() {
            cb(null, [{
              value: new Buffer('test'),
              offset: 1
            }]);
          });
        } else {
        }
      };

      var stream = new KafkaConsumerStream(fakeClient, {
        topics: 'topic'
      });
      stream.on('error', function(err) {
        // Ignore
      });
      stream.on('readable', function() {
        var message = stream.read();
        numReceived++;
        if (message) {
          t.ok(Buffer.isBuffer(message.value));
          t.equal(typeof message.offset, 'number');
          if (numReceived === numMessages) {
            // give it a second to get an error
            fakeClient.emit('unsubscribed');
          }
        }
      });

      stream.on('end', function() {
        next();
      });
    },

    'calls the callback on destroy': function (next) {

      fakeClient.unsubscribe = function () {};
      var stream = new KafkaConsumerStream(fakeClient, {
        topics: 'topic'
      });
      stream.once('readable', function () {
        stream.destroy();
        stream.once('close', next);
      });

    },
  }
};
