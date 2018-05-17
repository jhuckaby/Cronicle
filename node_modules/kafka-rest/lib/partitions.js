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
    messages = require('./messages'),
    PartitionMessages = require('./partitionMessages');

/**
 * Partitions resource, scoped to a single Topic.
 * @type {Function}
 */
var Partitions = module.exports = function(topic) {
    this.client = topic.client;
    this.topic = topic;
}

/**
 * Request a list of partitions and their metadata.
 * @param res function(err, partitions)
 */
Partitions.prototype.list = function(res) {
    this.client.request(utils.urlJoin(this.topic.getPath(), "partitions"), function(err, partitions_response) {
        if (err) return res(err);
        var partitions = [];
        for(var i = 0; i < partitions_response.length; i++) {
            partitions.push(new Partition(this.client, this.topic, /* id == index */i, partitions_response[i]));
        }
        res(null, partitions);
    }.bind(this));
}

/**
 * Request a single partition's metadata. Equivalent to partition = topic.partition(id); partition.get(res); return partition;
 * @param id partition ID
 * @param res function(err, partition)
 */
Partitions.prototype.get = function(id, res) {
    var partition = this.partition(id);
    partition.get(res);
    return partition;
}

Partitions.prototype.partition = function(id) {
    return new Partition(this.client, this.topic, id);
}


var Partition = Partitions.Partition = function(client, topic, id, raw) {
    this.client = client;
    this.topic = topic;
    this.id = id;
    this.raw = raw;
}

Partition.prototype.get = function(res) {
    this.client.request(this.getPath(), function(err, partition_raw) {
        if (err) return res(err);
        this.raw = partition_raw;
        res(null, this);
    }.bind(this));
}

/**
 * Produce messages to this partition. Messages must already be serialized. They must always contain values and may also
 * contain optional keys. This method can accept one or more messages in a few formats. Each message can
 * either be a string/Buffer (value, no key) or an object (must contain a "value" key, "key"
 * optional). You may pass one or more messages, either as multiple arguments or as a single array parameter. A final
 * argument may provide a callback of the form function(err, res).
 *
 * Examples:
 *
 * // Single message containing only the value, no callback
 * partition.produce('msg1');
 * // Single message with key, with callback
 * partition.produce({'key': 'key1', 'value': 'msg1'}, cb);
 * // Multiple messages containing only values
 * partition.produce('msg1', 'msg2', 'msg3');
 * // Multiple messages containing only values passed as array
 * partition.produce(['msg1', 'msg2', 'msg3']);
 * // Multiple messages with keys
 * partition.produce({'key': 'key1', 'value': 'msg1'}, {'partition': 0, 'value': 'msg2'});
 * // Multiple messages with key passed as array
 * partition.produce([{'key': 'key1', 'value': 'msg1'}, {'partition': 0, 'value': 'msg2'}]);
 * // Avro value schema followed by messages containing only values
 * partition.produce(value_schema, {'avro': 'record'}, {'avro': 'another record'})
 * // Avro key and value schema
 * partition.produce(key_schema, value_schema, {'key': {...}, 'value': {...}}, {'key': {...}, 'value': {...}})
 */
Partition.prototype.produce = function() {
    var args = messages.normalizeFromArguments(arguments, false);
    var msgs = args[0],
        schemas = args[1],
        res = args[2];
    var request = { 'records': msgs };
    if (schemas[0] != null) {
        if (schemas[0].toSchemaID())
            request['key_schema_id'] = schemas[0].toSchemaID();
        else
            request['key_schema'] = schemas[0].toSchemaString();
    }
    if (schemas[1] != null) {
        if (schemas[1].toSchemaID())
            request['value_schema_id'] = schemas[1].toSchemaID();
        else
            request['value_schema'] = schemas[1].toSchemaString();
    }
    this.client.post(this.getPath(), request, schemas[0] || schemas[1], function(err, produce_response) {
        if (err) {
            if (res) res(err);
        } else {
            if (schemas[0] && produce_response.key_schema_id)
                schemas[0].setSchemaID(produce_response.key_schema_id);
            if (schemas[1] && produce_response.value_schema_id)
                schemas[1].setSchemaID(produce_response.value_schema_id);
            if (res) res(null, produce_response);
        }
    }.bind(this));
}

/**
 * Consume messages from one partition of the topic.
 *
 * @param options
 * @param res function(err,
 */
Partition.prototype.__defineGetter__("messages", function() {
    if (!this._messages)
        this._messages = new PartitionMessages(this);
    return this._messages.messages.bind(this._messages);
});

Partition.prototype.toString = function() {
    var result = "Partition{topic=\"" + this.topic.name + "\"" +
                ", id=" + this.id;
    if (this.raw) {
        result += ", leader=" + this.raw.leader;
        result += ", replicas=" + this.raw.replicas.length;
    }
    result += "}";
    return result;
}

Partition.prototype.getPath = function() {
    return utils.urlJoin(this.topic.getPath(), "partitions", this.id.toString());
}
