/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

'use strict';

var net = require('net');
var util = require('util');
var Emitter = require('events');

function KafkaServer(config) {
  if (!(this instanceof KafkaServer)) {
    return new KafkaServer(config);
  }

  if (config === undefined) {
    config = {};
  } else if (typeof config !== 'object') {
    throw new TypeError('"config" must be an object');
  }

  Emitter.call(this);

  var self = this;

  this.socket = net.createServer(function(socket) {
    socket.end();
  }); //.unref();

  this.socket.on('error', function(err) {
    console.error(err);
  });

  this.socket.listen({
    port: 9092,
    host: 'localhost'
  }, function() {
    self.address = self.socket.address();
    self.emit('ready');
  });

}

util.inherits(KafkaServer, Emitter);

KafkaServer.prototype.close = function(cb) {
  this.socket.close(cb);
};

module.exports = KafkaServer;
