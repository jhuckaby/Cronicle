/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

module.exports = Producer;

var Client = require('./client');

var util = require('util');
var Kafka = require('../librdkafka.js');
var ProducerStream = require('./producer-stream');
var LibrdKafkaError = require('./error');

util.inherits(Producer, Client);

/**
 * Producer class for sending messages to Kafka
 *
 * This is the main entry point for writing data to Kafka. You
 * configure this like you do any other client, with a global
 * configuration and default topic configuration.
 *
 * Once you instantiate this object, you need to connect to it first.
 * This allows you to get the metadata and make sure the connection
 * can be made before you depend on it. After that, problems with
 * the connection will by brought down by using poll, which automatically
 * runs when a transaction is made on the object.
 *
 * @param {object} conf - Key value pairs to configure the producer
 * @param {object} topicConf - Key value pairs to create a default
 * topic configuration
 * @extends Client
 * @constructor
 */
function Producer(conf, topicConf) {
  if (!(this instanceof Producer)) {
    return new Producer(conf, topicConf);
  }

  /**
   * Producer message. This is sent to the wrapper, not received from it
   *
   * @typedef {object} Producer~Message
   * @property {string|buffer} message - The buffer to send to Kafka.
   * @property {Topic} topic - The Kafka topic to produce to.
   * @property {number} partition - The partition to produce to. Defaults to
   * the partitioner
   * @property {string} key - The key string to use for the message.
   * @see Consumer~Message
   */

  var gTopic = conf.topic || false;
  var gPart = conf.partition || null;
  var dr_cb = conf.dr_cb || null;
  var dr_msg_cb = conf.dr_msg_cb || null;

  // delete keys we don't want to pass on
  delete conf.topic;
  delete conf.partition;

  delete conf.dr_cb;
  delete conf.dr_msg_cb;

  // client is an initialized consumer object
  // @see NodeKafka::Consumer::Init
  Client.call(this, conf, Kafka.Producer, topicConf);
  var self = this;

  // Delete these keys after saving them in vars
  this.globalConfig = conf;
  this.topicConfig = topicConf;
  this.defaultTopic = gTopic || null;
  this.defaultPartition = gPart == null ? -1 : gPart;

  this.sentMessages = 0;

  this.pollInterval = undefined;

  if (dr_msg_cb || dr_cb) {
    this._client.onDeliveryReport(function onDeliveryReport(err, report) {
      if (err) {
        err = LibrdKafkaError.create(err);
      }
      self.emit('delivery-report', err, report);
    }, !!dr_msg_cb);

    if (typeof dr_cb === 'function') {
      self.on('delivery-report', dr_cb);
    }

  }
}

/**
 * Produce a message to Kafka synchronously.
 *
 * This is the method mainly used in this class. Use it to produce
 * a message to Kafka. The first and only parameter of the synchronous
 * variant is the message object.
 *
 * When this is sent off, there is no guarantee it is delivered. If you need
 * guaranteed delivery, change your *acks* settings, or use delivery reports.
 *
 * @param {string} topic - The topic name to produce to.
 * @param {number|null} partition - The partition number to produce to.
 * @param {Buffer|null} message - The message to produce.
 * @param {string} key - The key associated with the message.
 * @param {number|null} timestamp - Timestamp to send with the message.
 * @param {object} opaque - An object you want passed along with this message, if provided.
 * @throws {LibrdKafkaError} - Throws a librdkafka error if it failed.
 * @return {boolean} - returns an error if it failed, or true if not
 * @see Producer#produce
 */
Producer.prototype.produce = function(topic, partition, message, key, timestamp, opaque) {
  if (!this._isConnected) {
    throw new Error('Producer not connected');
  }

  // I have removed support for using a topic object. It is going to be removed
  // from librdkafka soon, and it causes issues with shutting down
  if (!topic || typeof topic !== 'string') {
    throw new TypeError('"topic" must be a string');
  }

  this.sentMessages++;

  partition = partition == null ? this.defaultPartition : partition;

  return this._errorWrap(
    this._client.produce(topic, partition, message, key, timestamp, opaque));

};

/**
 * Create a write stream interface for a producer.
 *
 * This stream does not run in object mode. It only takes buffers of data.
 *
 * @param {object} conf - Key value pairs to configure the producer
 * @param {object} topicConf - Key value pairs to create a default
 * topic configuration
 * @param {object} options - Stream options
 * @return {ProducerStream} - returns the write stream for writing to Kafka.
 */
Producer.createWriteStream = function(conf, topicConf, streamOptions) {
  var producer = new Producer(conf, topicConf);
  return new ProducerStream(producer, streamOptions);
};

/**
 * Poll for events
 *
 * We need to run poll in order to learn about new events that have occurred.
 * This is no longer done automatically when we produce, so we need to run
 * it manually, or set the producer to automatically poll.
 *
 * @return {Producer} - returns itself.
 */
Producer.prototype.poll = function() {
  if (!this._isConnected) {
    throw new Error('Producer not connected');
  }
  this._client.poll();
  return this;
};

/**
 * Set automatic polling for events.
 *
 * We need to run poll in order to learn about new events that have occurred.
 * If you would like this done on an interval with disconnects and reconnections
 * managed, you can do it here
 *
 * @param {number} interval - Interval, in milliseconds, to poll
 *
 * @return {Producer} - returns itself.
 */
Producer.prototype.setPollInterval = function(interval) {
  // If we already have a poll interval we need to stop it
  if (this.pollInterval) {
    clearInterval(this.pollInterval);
    this.pollInterval = undefined;
  }

  if (interval === 0) {
    // If the interval was set to 0, bail out. We don't want to process this.
    // If there was an interval previously set, it has been removed.
    return;
  }

  var self = this;

  // Now we want to make sure we are connected.
  if (!this._isConnected) {
    // If we are not, execute this once the connection goes through.
    this.once('ready', function() {
      self.setPollInterval(interval);
    });
    return;
  }

  // We know we are connected at this point.
  // Unref this interval
  this.pollInterval = setInterval(function() {
    try {
      self.poll();
    } catch (e) {
      // We can probably ignore errors here as far as broadcasting.
      // Disconnection issues will get handled below
    }
  }, interval).unref();

  // Handle disconnections
  this.once('disconnected', function() {
    // Just rerun this function. It will unset the original
    // interval and then bind to ready
    self.setPollInterval(interval);
  });

  return this;
};

/**
 * Flush the producer
 *
 * Flush everything on the internal librdkafka producer buffer. Do this before
 * disconnects usually
 *
 * @param {number} timeout - Number of milliseconds to try to flush before giving up.
 * @param {function} callback - Callback to fire when the flush is done.
 *
 * @return {Producer} - returns itself.
 */
Producer.prototype.flush = function(timeout, callback) {
  if (!this._isConnected) {
    throw new Error('Producer not connected');
  }

  if (timeout === undefined || timeout === null) {
    timeout = 500;
  }

  this._client.flush(timeout, function(err) {
    if (err) {
      err = LibrdKafkaError.create(err);
    }

    if (callback) {
      callback(err);
    }
  });
  return this;
};

/**
 * Save the base disconnect method here so we can overwrite it and add a flush
 */
Producer.prototype._disconnect = Producer.prototype.disconnect;

/**
 * Disconnect the producer
 *
 * Flush everything on the internal librdkafka producer buffer. Then disconnect
 *
 * @param {number} timeout - Number of milliseconds to try to flush before giving up.
 *                           defaults to 5 seconds.
 * @param {function} cb - The callback to fire when
 */
Producer.prototype.disconnect = function(timeout, cb) {
  var self = this;
  var timeoutInterval = 5000;

  if (typeof timeout === 'function') {
    cb = timeout;
  } else {
    timeoutInterval = timeout;
  }

  this.flush(timeoutInterval, function() {
    self._disconnect(cb);
  });
}
