/**
 * Copyright 2014 Confluent Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var utils = require('./utils'),
    avroSchema = require('./avroSchema'),
    binarySchema = require('./binarySchema');

/**
 * PartitionMessages resource, scoped to a single Partition.
 * @type {Function}
 */
var PartitionMessages = module.exports = function(partition) {
    this.client = partition.client;
    this.partition = partition;
}

/**
 * Request a specified number of messages from a specified offset
 *
 * type options {
 *      offset: number,
 *      count: ?number,
 *      format: ?string (json, avro, binary)
 *  }
 *
 * @param options
 * @param res function(err, messages)
 */
PartitionMessages.prototype.messages = function(options, res) {
    options = options || {};

    // Ensure that offset is passed in
    if (typeof options === 'function' || options.offset === undefined || options.offset === null) {
        var callback = res || options;
        return callback(new Error('Offset is required'));
    }

    var query = { offset: options.offset };

    // Count is optional
    if (options.count) query.count = options.count;

    var reqOpts = {
        path: this.getPath() + this.getQueryString(query),
        accept: this.getContentType(options.format)
    };

    this.client.request(reqOpts, function(err, messages) {
        if (err) return res(err);
        res(null, messages);
    }.bind(this));
}

PartitionMessages.prototype.getPath = function() {
    return utils.urlJoin(this.partition.getPath(), "messages");
}

PartitionMessages.prototype.getQueryString = function(query) {
    return utils.urlQueryString(query);
}

PartitionMessages.prototype.getContentType = function(format) {
    switch (format) {
        case 'avro':
            return avroSchema.getContentType(this.client);
        case 'binary':
            return binarySchema.getContentType(this.client);
        case 'json':
        default:
            return null;

    }
}
