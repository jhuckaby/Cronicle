/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

module.exports = Client;

var Emitter = require('events').EventEmitter;
var util = require('util');
var Kafka = require('../librdkafka.js');
var assert = require('assert');

var LibrdKafkaError = require('./error');

util.inherits(Client, Emitter);

/**
 * Base class for Consumer and Producer
 *
 * This should not be created independently, but rather is
 * the base class on which both producer and consumer
 * get their common functionality.
 *
 * @param {object} globalConf - Global configuration in key value pairs.
 * @param {function} SubClientType - The function representing the subclient
 * type. In C++ land this needs to be a class that inherits from Connection.
 * @param {object} topicConf - Topic configuration in key value pairs
 * @constructor
 * @extends Emitter
 */
function Client(globalConf, SubClientType, topicConf) {
  if (!(this instanceof Client)) {
    return new Client(globalConf, SubClientType, topicConf);
  }

  Emitter.call(this);

  // This superclass must be initialized with the Kafka.{Producer,Consumer}
  // @example var client = new Client({}, Kafka.Producer);
  // remember this is a superclass so this will get taken care of in
  // the producer and consumer main wrappers

  var no_event_cb = globalConf.event_cb === false;
  topicConf = topicConf || {};

  // delete this because librdkafka will complain since this particular
  // key is a real conf value
  delete globalConf.event_cb;

  this._client = new SubClientType(globalConf, topicConf);

  // primitive callbacks from c++ wrapper
  // need binds on them if we want to broadcast the event via the emitter

  // However, the C++ wrapper lazy processes callbacks.
  // If we want to improve performance, removing this line is a good way to do it.
  // we need to do this on creation of the object
  // thats why we did some processing on config

  // Self required because we are inside an async callback function scope
  if (!no_event_cb) {
    this._client.onEvent(function eventHandler(eventType, eventData) {
      switch (eventType) {
        case 'error':
          self.emit('event.error', LibrdKafkaError.create(eventData));
          break;
        case 'stats':
          self.emit('event.stats', eventData);
          break;
        case 'log':
          self.emit('event.log', eventData);
          break;
        default:
          self.emit('event.event', eventData);
          self.emit('event.' + eventType, eventData);
      }
    });
  }

  this.metrics = {};
  this._isConnected = false;
  this.errorCounter = 0;

  /**
   * Metadata object. Starts out empty but will be filled with information after
   * the initial connect.
   *
   * @type {Client~Metadata}
   */
  this._metadata = {};

  var self = this;

  this.on('ready', function(info) {
    self.metrics.connectionOpened = Date.now();
    self.name = info.name;
  })
  .on('disconnected', function() {
    // reset metrics
    self.metrics = {};
    self._isConnected = false;
    // keep the metadata. it still may be useful
  })
  .on('event.error', function(err) {
    self.lastError = err;
    ++self.errorCounter;
  });

}

/**
 * Connect to the broker and receive its metadata.
 *
 * Connects to a broker by establishing the client and fetches its metadata.
 *
 * @param {object} metadataOptions - Options to be sent to the metadata.
 * @param {string} metadataOptions.topic - Topic to fetch metadata for. Empty string is treated as empty.
 * @param {boolean} metadataOptions.allTopics - Fetch metadata for all topics, not just the ones we know about.
 * @param {int} metadataOptions.timeout - The timeout, in ms, to allow for fetching metadata. Defaults to 30000ms
 * @param  {Client~connectionCallback} cb - Callback that indicates we are
 * done connecting.
 * @return {Client} - Returns itself.
 */
Client.prototype.connect = function(metadataOptions, cb) {
  var self = this;

  var next = function(err, data) {
    self._isConnecting = false;
    if (cb) {
      cb(err, data);
    }
  };

  if (this._isConnected) {
    setImmediate(next);
    return self;
  }

  if (this._isConnecting) {
    this.once('ready', function() {
      next(null, this._metadata);
    });
    return self;
  }

  this._isConnecting = true;

  var fail = function(err) {
    var callbackCalled = false;
    var t;

    if (self._isConnected) {
      self._isConnected = false;
      self._client.disconnect(function() {
        if (callbackCalled) {
          return;
        }
        clearTimeout(t);
        callbackCalled = true;

        next(err); return;
      });

      // don't take too long. this is a failure, after all
      t = setTimeout(function() {
        if (callbackCalled) {
          return;
        }
        callbackCalled = true;

        next(err); return;
      }, 10000).unref();
      
      self.emit('connection.failure', self.metrics);
    } else {

      next(err);
    }
  };

  this._client.connect(function(err, info) {
    if (err) {
      fail(LibrdKafkaError.create(err)); return;
    }

    self._isConnected = true;

    // Otherwise we are successful
    self.getMetadata(metadataOptions || {}, function(err, metadata) {
      if (err) {
        // We are connected so we need to disconnect
        fail(LibrdKafkaError.create(err)); return;
      }

      self._isConnecting = false;
      // We got the metadata otherwise. It is set according to above param
      // Set it here as well so subsequent ready callbacks
      // can check it
      self._isConnected = true;

      /**
       * Ready event. Called when the Client connects successfully
       *
       * @event Client#ready
       * @type {object}
       * @property {string} name - the name of the broker.
       */
      self.emit('ready', info, metadata);
      next(null, metadata); return;

    });

  });

  return self;

};

/**
 * Get the native Kafka client.
 *
 * You probably shouldn't use this, but if you want to execute methods directly
 * on the c++ wrapper you can do it here.
 *
 * @see connection.cc
 * @return {Connection} - The native Kafka client.
 */
Client.prototype.getClient = function() {
  return this._client;
};

/**
 * Find out how long we have been connected to Kafka.
 *
 * @return {number} - Milliseconds since the connection has been established.
 */
Client.prototype.connectedTime = function() {
  if (!this.isConnected()) {
    return 0;
  }
  return Date.now() - this.metrics.connectionOpened;
};

/**
 * Whether or not we are connected to Kafka.
 *
 * @return {boolean} - Whether we are connected.
 */
Client.prototype.isConnected = function() {
  return !!(this._isConnected && this._client);
};

/**
 * Get the last error emitted if it exists.
 *
 * @return {LibrdKafkaError} - Returns the LibrdKafkaError or null if
 * one hasn't been thrown.
 */
Client.prototype.getLastError = function() {
  return this.lastError || null;
};

/**
 * Disconnect from the Kafka client.
 *
 * This method will disconnect us from Kafka unless we are already in a
 * disconnecting state. Use this when you're done reading or producing messages
 * on a given client.
 *
 * It will also emit the disconnected event.
 *
 * @fires Client#disconnected
 * @return {function} - Callback to call when disconnection is complete.
 */
Client.prototype.disconnect = function(cb) {
  var self = this;

  if (!this._isDisconnecting && this._client) {
    this._isDisconnecting = true;
    this._client.disconnect(function() {
      // this take 5000 milliseconds. Librdkafka needs to make sure the memory
      // has been cleaned up before we delete things. @see RdKafka::wait_destroyed

      // Broadcast metrics. Gives people one last chance to do something with them
      self._isDisconnecting = false;
      /**
       * Disconnect event. Called after disconnection is finished.
       *
       * @event Client#disconnected
       * @type {object}
       * @property {date} connectionOpened - when the connection was opened.
       */
      self.emit('disconnected', self.metrics);
      if (cb) {
        cb(null, self.metrics);
      }

    });

  }

  return self;
};

/**
 * Get client metadata.
 *
 * Note: using a <code>metadataOptions.topic</code> parameter has a potential side-effect.
 * A Topic object will be created, if it did not exist yet, with default options
 * and it will be cached by librdkafka.
 *
 * A subsequent call to create the topic object with specific options (e.g. <code>acks</code>) will return
 * the previous instance and the specific options will be silently ignored.
 *
 * To avoid this side effect, the topic object can be created with the expected options before requesting metadata,
 * or the metadata request can be performed for all topics (by omitting <code>metadataOptions.topic</code>).
 *
 * @param {object} metadataOptions - Metadata options to pass to the client.
 * @param {string} metadataOptions.topic - Topic string for which to fetch
 * metadata
 * @param {number} metadataOptions.timeout - Max time, in ms, to try to fetch
 * metadata before timing out. Defaults to 3000.
 * @param {Client~metadataCallback} cb - Callback to fire with the metadata.
 */
Client.prototype.getMetadata = function(metadataOptions, cb) {
  if (!this.isConnected()) {
    return cb(new Error('Client is disconnected'));
  }

  var self = this;

  this._client.getMetadata(metadataOptions || {}, function(err, metadata) {
    if (err) {
      if (cb) {
        cb(LibrdKafkaError.create(err));
      }
      return;
    }

    // No error otherwise
    self._metadata = metadata;

    if (cb) {
      cb(null, metadata);
    }

  });

};

/**
 * Query offsets from the broker.
 *
 * This function makes a call to the broker to get the current low (oldest/beginning)
 * and high (newest/end) offsets for a topic partition.
 *
 * @param {string} topic - Topic to recieve offsets from.
 * @param {number} partition - Partition of the provided topic to recieve offsets from
 * @param {number} timeout - Number of ms to wait to recieve a response.
 * @param {Client~watermarkOffsetsCallback} cb - Callback to fire with the offsets.
 */
Client.prototype.queryWatermarkOffsets = function(topic, partition, timeout, cb) {
  if (!this.isConnected()) {
    if (cb) {
      return cb(new Error('Client is disconnected'));
    } else {
      return;
    }
  }

  var self = this;

  if (typeof timeout === 'function') {
    cb = timeout;
    timeout = 1000;
  }

  if (!timeout) {
    timeout = 1000;
  }

  this._client.queryWatermarkOffsets(topic, partition, timeout, function(err, offsets) {
    if (err) {
      if (cb) {
        cb(LibrdKafkaError.create(err));
      }
      return;
    }

    if (cb) {
      cb(null, offsets);
    }

  });
};

/**
 * Wrap a potential RdKafka error.
 *
 * This internal method is meant to take a return value
 * from a function that returns an RdKafka error code, throw if it
 * is an error (Making it a proper librdkafka error object), or
 * return the appropriate value otherwise.
 *
 * It is intended to be used in a return statement,
 *
 * @private
 * @param {number} errorCode - Error code returned from a native method
 * @param {bool} intIsError - If specified true, any non-number return type will be classified as a success
 * @return {boolean} - Returns true or the method return value unless it throws.
 */
Client.prototype._errorWrap = function(errorCode, intIsError) {
  var returnValue = true;
  if (intIsError) {
    returnValue = errorCode;
    errorCode = typeof errorCode === 'number' ? errorCode : 0;
  }

  if (errorCode !== LibrdKafkaError.codes.ERR_NO_ERROR) {
    var e = LibrdKafkaError.create(errorCode);
    throw e;
  }

  return returnValue;
};

/**
 * This callback is used to pass metadata or an error after a successful
 * connection
 *
 * @callback Client~connectionCallback
 * @param {Error} err - An error, if one occurred while connecting.
 * @param {Client~Metadata} metadata - Metadata object.
 */

 /**
  * This callback is used to pass offsets or an error after a successful
  * query
  *
  * @callback Client~watermarkOffsetsCallback
  * @param {Error} err - An error, if one occurred while connecting.
  * @param {Client~watermarkOffsets} offsets - Watermark offsets
  */

/**
 * @typedef {object} Client~watermarkOffsets
 * @property {number} high - High (newest/end) offset
 * @property {number} low - Low (oldest/beginning) offset
 */

/**
 * @typedef {object} Client~MetadataBroker
 * @property {number} id - Broker ID
 * @property {string} host - Broker host
 * @property {number} port - Broker port.
 */

/**
 * @typedef {object} Client~MetadataTopic
 * @property {string} name - Topic name
 * @property {Client~MetadataPartition[]} partitions - Array of partitions
 */

/**
 * @typedef {object} Client~MetadataPartition
 * @property {number} id - Partition id
 * @property {number} leader - Broker ID for the partition leader
 * @property {number[]} replicas - Array of replica IDs
 * @property {number[]} isrs - Arrqay of ISRS ids
*/

/**
 * Metadata object.
 *
 * This is the representation of Kafka metadata in JavaScript.
 *
 * @typedef {object} Client~Metadata
 * @property {number} orig_broker_id - The broker ID of the original bootstrap
 * broker.
 * @property {string} orig_broker_name - The name of the original bootstrap
 * broker.
 * @property {Client~MetadataBroker[]} brokers - An array of broker objects
 * @property {Client~MetadataTopic[]} topics - An array of topics.
 */
