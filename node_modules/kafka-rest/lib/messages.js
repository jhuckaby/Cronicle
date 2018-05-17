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
    Schema = require('./schema');

/**
 * Handles extraction and normalization of producer records from arguments to a produce() method.
 * @returns {Array}
 */
exports.normalizeFromArguments = function(args, allow_partition) {
    if (allow_partition === undefined) throw new Error("allow_partition must be specified");

    // Extract
    var arg_mode = null;
    var msgs = [];
    var keySchema = null;
    var valueSchema = null;
    var res = null;
    for(var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (typeof(arg) == "function") {
            if (res != null)
                throw new Error("Produce request contains multiple callbacks");
            res = arg;
        } else if (Array.isArray(arg)) {
            // Should only ever encounter a single array of msgs; also shouldn't encounter an array if we already saw individual messages
            if (arg_mode != null) {
                if (arg_mode == "array")
                    throw new Error("Produce request contains multiple arrays of messages");
                else
                    throw new Error("Produce request contains both arrays of messages and individual messages.");
            }
            msgs = arg;
            arg_mode = "array";
        } else if (arg instanceof Schema) {
            // Schemas can be specified either as only the value schema, or as key schema, value schema, in that order.
            if (valueSchema != null) {
                if (keySchema != null) {
                    throw new Error("Multiple value schemas specified in produce request.");
                } else {
                    keySchema = valueSchema;
                    valueSchema = arg;
                }
            } else {
                valueSchema = arg;
            }
        } else if (typeof(arg) == "object" || typeof(arg) == "string") { // typeof(null) is object
            msgs.push(arg || null);
        }
    }

    // Validate/transform messages into standard format
    var hasSchema = (keySchema || valueSchema);
    for(var i = 0; i < msgs.length; i++) {
        var key = undefined, value = undefined, partition = undefined;
        if (msgs[i] === null || typeof(msgs[i]) == "string" || Buffer.isBuffer(msgs[i])) {
            value = msgs[i];
        }
        else if (!hasSchema || (msgs[i].value !== undefined && (msgs[i].key !== undefined || msgs[i].partition !== undefined))) {
            // This isn't the ideal location for this logic, but there's an
            // ambiguity depending on whether you're using binary data or
            // Avro. With binary data, the only valid object we could encounter
            // is a message "envelope", i.e. the object containing
            // key/value/partition fields. But with Avro, an object could also
            // just be the JSON-serialized form of a value or one of these
            // envelopes. To make sure the envelope form always works, the
            // heuristic we use when we see an Avro schema is to consider it an
            // envelope if it has a value field and at least one
            // of key/partition since it's pointless to use an envelope unless
            // you have one of them. In all those cases, the field has to be
            // present (defined) but may be null.
            value = msgs[i].value;
            key = msgs[i].key;
            partition = msgs[i].partition;
        } else {
            // This is an Avro JSON value
            value = msgs[i];
        }
        if (!allow_partition && partition !== undefined && partition !== null)
            throw new Error("Message " + i + " contains a partition but this resource does not allow specifying the partition.");
        if (!hasSchema) {
            key = utils.toBase64(key);
            value = utils.toBase64(value);
        }
        msgs[i] = {
            'value': (value === undefined ? null : value),
            'key' : (key === undefined ? null : key)
        };
        // The partition field is not permitted to be present at all (not even
        // null) when producing to a partition
        if (allow_partition)
            msgs[i]['partition'] = (partition === undefined ? null : partition);
    }

    return [msgs, [keySchema, valueSchema], res];
};