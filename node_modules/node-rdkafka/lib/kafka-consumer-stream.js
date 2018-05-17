/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

'use strict';

module.exports = KafkaConsumerStream;

var Readable = require('stream').Readable;
var util = require('util');

util.inherits(KafkaConsumerStream, Readable);

/**
 * ReadableStream integrating with the Kafka Consumer.
 *
 * This class is used to read data off of Kafka in a streaming way. It is
 * useful if you'd like to have a way to pipe Kafka into other systems. You
 * should generally not make this class yourself, as it is not even exposed
 * as part of module.exports. Instead, you should KafkaConsumer.createReadStream.
 *
 * The stream implementation is slower than the continuous subscribe callback.
 * If you don't care so much about backpressure and would rather squeeze
 * out performance, use that method. Using the stream will ensure you read only
 * as fast as you write.
 *
 * The stream detects if Kafka is already connected. If it is, it will begin
 * reading. If it is not, it will connect and read when it is ready.
 *
 * This stream operates in objectMode. It streams {Consumer~Message}
 *
 * @param {Consumer} consumer - The Kafka Consumer object.
 * @param {object} options - Options to configure the stream.
 * @param {number} options.waitInterval - Number of ms to wait if Kafka reports
 * that it has timed out or that we are out of messages (right now).
 * @param {array} options.topics - Array of topics, or a function that parses
 * metadata into an array of topics
 * @constructor
 * @extends stream.Readable
 * @see Consumer~Message
 */
function KafkaConsumerStream(consumer, options) {
  if (!(this instanceof KafkaConsumerStream)) {
    return new KafkaConsumerStream(consumer, options);
  }

  if (options === undefined) {
    options = { waitInterval: 1000 };
  } else if (typeof options === 'number') {
    options = { waitInterval: options };
  } else if (options === null || typeof options !== 'object') {
    throw new TypeError('"options" argument must be a number or an object');
  }

  var topics = options.topics;

  if (typeof topics === 'function') {
    // Just ignore the rest of the checks here
  } else if (!Array.isArray(topics)) {
    if (typeof topics !== 'string' && !(topics instanceof RegExp)) {
      throw new TypeError('"topics" argument must be a string, regex, or an array');
    } else {
      topics = [topics];
    }
  }

  options = Object.create(options);

  var fetchSize = options.fetchSize || 1;

  // Run in object mode by default.
  if (options.objectMode === null || options.objectMode === undefined) {
    options.objectMode = true;

    // If they did not explicitly set high water mark, and we are running
    // in object mode, set it to the fetch size + 2 to ensure there is room
    // for a standard fetch
    if (!options.highWaterMark) {
      options.highWaterMark = fetchSize + 2;
    }
  }

  if (options.objectMode !== true) {
    this._read = this._read_buffer;
  } else {
    this._read = this._read_message;
  }

  Readable.call(this, options);

  this.consumer = consumer;
  this.topics = topics;
  this.autoClose = options.autoClose === undefined ? true : !!options.autoClose;
  this.waitInterval = options.waitInterval === undefined ? 1000 : options.waitInterval;
  this.fetchSize = fetchSize;
  this.connectOptions = options.connectOptions || {};
  this.streamAsBatch = options.streamAsBatch || false;

  // Hold the messages in here
  this.messages = [];

  var self = this;

  this.consumer
    .on('unsubscribed', function() {
      // Invalidate the stream when we unsubscribe
      self.push(null);
    });

  // Call connect. Handles potentially being connected already
  this.connect(this.connectOptions);

  this.once('end', function() {
    if (this.autoClose) {
      this.destroy();
    }
  });

}

/**
 * Internal stream read method. This method reads message objects.
 * @param {number} size - This parameter is ignored for our cases.
 * @private
 */
KafkaConsumerStream.prototype._read_message = function(size) {
  if (this.messages.length > 0) {
    return this.push(this.messages.shift());
  }

  if (!this.consumer) {
    // This consumer is set to `null` in the close function
    return;
  }

  if (!this.consumer.isConnected()) {
    this.consumer.once('ready', function() {
      // This is the way Node.js does it
      // https://github.com/nodejs/node/blob/master/lib/fs.js#L1733
      this._read(size);
    }.bind(this));
    return;
  }

  if (this.destroyed) {
    return;
  }

  var self = this;

  // If the size (number of messages) we are being advised to fetch is
  // greater than or equal to the fetch size, use the fetch size.
  // Only opt to use the size in case it is LESS than the fetch size.
  // Essentially, we want to use the smaller value here
  var fetchSize = size >= this.fetchSize ? this.fetchSize : size;

  this.consumer.consume(fetchSize, onread);

  function onread(err, messages) {
    if (err) {
      // bad error
      if (self.autoClose) {
        self.destroy();
      }
      self.emit('error', err);
      return;
    }

    // If there are no messages it means we reached EOF or a timeout.
    // Do what we used to do

    if (messages.length < 1) {

      if (!self.waitInterval) {
        setImmediate(function() {
          self._read(size);
        });
      } else {
        setTimeout(function() {
          self._read(size);
        }, self.waitInterval * Math.random()).unref();
      }

      return;
    } else {
      if (self.streamAsBatch) {
        self.push(messages);
      } else {
        for (var i = 0; i < messages.length; i++) {
          self.messages.push(messages[i]);
        }

        // Now that we have added them all the inner messages buffer,
        // we can just push the most recent one
        self.push(self.messages.shift());
      }
    }

  }
};

/**
 * Internal stream read method. This method reads message buffers.
 * @param {number} size - This parameter is ignored for our cases.
 * @private
 */
KafkaConsumerStream.prototype._read_buffer = function(size) {
  if (this.messages.length > 0) {
    return this.push(this.messages.shift());
  }

  if (!this.consumer) {
    // This consumer is set to `null` in the close function
    return;
  }

  if (!this.consumer.isConnected()) {
    this.consumer.once('ready', function() {
      // This is the way Node.js does it
      // https://github.com/nodejs/node/blob/master/lib/fs.js#L1733
      this._read(size);
    }.bind(this));
    return;
  }

  if (this.destroyed) {
    return;
  }

  var self = this;

  // If the size (number of messages) we are being advised to fetch is
  // greater than or equal to the fetch size, use the fetch size.
  // Only opt to use the size in case it is LESS than the fetch size.
  // Essentially, we want to use the smaller value here
  var fetchSize = size >= this.fetchSize ? this.fetchSize : size;

  this.consumer.consume(fetchSize, onread);

  function onread(err, messages) {
    if (err) {
      // bad error
      if (self.autoClose) {
        self.destroy();
      }
      self.emit('error', err);
      return;
    }

    // If there are no messages it means we reached EOF or a timeout.
    // Do what we used to do

    if (messages.length < 1) {

      if (!self.waitInterval) {
        setImmediate(function() {
          self._read(size);
        });
      } else {
        setTimeout(function() {
          self._read(size);
        }, self.waitInterval * Math.random()).unref();
      }

      return;
    } else {
      if (self.streamAsBatch) {
        self.push(messages);
      } else {
        for (var i = 0; i < messages.length; i++) {
          self.messages.push(messages[i].value);
        }
        // Now that we have added them all the inner messages buffer,
        // we can just push the most recent one
        self.push(self.messages.shift());
      }
    }

  }
};

KafkaConsumerStream.prototype.connect = function(options) {
  var self = this;

  function connectCallback(err, metadata) {
    if (err) {
      self.emit('error', err);
      self.destroy();
      return;
    }

    try {
      // Subscribe to the topics as well so we will be ready
      // If this throws the stream is invalid

      // This is the magic part. If topics is a function, before we subscribe,
      // pass the metadata in
      if (typeof self.topics === 'function') {
        var topics = self.topics(metadata);
        self.consumer.subscribe(topics);
      } else {
        self.consumer.subscribe(self.topics);
      }
    } catch (e) {
      self.emit('error', e);
      self.destroy();
      return;
    }

    // start the flow of data
    self.read();
  }

  if (!this.consumer.isConnected()) {
    self.consumer.connect(options, connectCallback);
  } else {
    // Immediately call the connect callback
    setImmediate(function() {
      connectCallback(null, self.consumer._metadata);
    });
  }

};

KafkaConsumerStream.prototype.destroy = function() {
  if (this.destroyed) {
    return;
  }
  this.destroyed = true;
  this.close();
};

KafkaConsumerStream.prototype.close = function(cb) {
  var self = this;
  if (cb) {
    this.once('close', cb);
  }

  if (!self.consumer._isConnecting && !self.consumer._isConnected) {
    // If we aren't even connected just exit. We are done.
    close();
    return;
  }

  if (self.consumer._isConnecting) {
    self.consumer.once('ready', function() {
      // Don't pass the CB because it has already been passed.
      self.close();
    });
    return;
  }

  if (self.consumer._isConnected) {
    self.consumer.unsubscribe();
    self.consumer.disconnect(function() {
      self.consumer = null;
      close();
    });
  }

  function close() {
    self.emit('close');
  }
};
