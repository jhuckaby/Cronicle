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

var messages = require('../lib/messages'),
    AvroSchema = require('../lib/avroSchema');

// Test data
var MSG = 'foo';
var MSG_ENC = 'Zm9v';
var KEY = 'key';
var KEY_ENC = 'a2V5';
var CB = function() {};

var KEY_SCHEMA = new AvroSchema("string");
var VALUE_SCHEMA = new AvroSchema({
    "name": "myrecord",
    "type": "record",
    "fields": [{"name":"f1","type":"string"}]
});
var AVRO_MSG = { 'avro': 'field' };


// Test helpers
var assertMessageEquals = function(test, msg, value, key, partition) {
    test.strictEqual(msg.value, value);
    test.strictEqual(msg.key, key);
    test.strictEqual(msg.partition, partition);
};

exports.testNormalizeFromArguments = {
    // Test formats of a bunch of individual messages

    testNullMessage: function(test) {
        var result = messages.normalizeFromArguments([null], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], null, null, null);
        test.done();
    },

    testStringMessage: function(test) {
        var result = messages.normalizeFromArguments([MSG], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        test.done();
    },

    testBufferMessage: function(test) {
        var result = messages.normalizeFromArguments([new Buffer(MSG)], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        test.done();
    },

    testObjectMessage: function(test) {
        var result = messages.normalizeFromArguments([{'value': MSG}], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        test.done();
    },

    testObjectMessageWithKey: function(test) {
        var result = messages.normalizeFromArguments([{'value': MSG, 'key': KEY}], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], MSG_ENC, KEY_ENC, null);
        test.done();
    },

    testObjectMessageWithPartition: function(test) {
        var result = messages.normalizeFromArguments([{'value': MSG, 'partition': 0}], true),
                    msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, 0);
        test.done();
    },

    testObjectMessageWithPartitionNotAllowed: function(test) {
        test.throws(function() {
            messages.normalizeFromArguments([{'value': MSG, 'partition': 0}], false);
        });
        test.done();
    },

    testObjectMessageWithKeyAndPartition: function(test) {
        var result = messages.normalizeFromArguments([{'value': MSG, 'key': KEY, 'partition': 0}], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], MSG_ENC, KEY_ENC, 0);
        test.done();
    },



    // Make sure we can parse lists of messages/callbacks and generate correct errors. Not exhaustive on all types of
    // message formats

    testMultiple: function(test) {
        var result = messages.normalizeFromArguments([MSG, MSG, MSG], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 3);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        test.done();
    },

    testMultipleWithCallback: function(test) {
        var result = messages.normalizeFromArguments([MSG, MSG, MSG, CB], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 3);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        test.strictEqual(cb, CB);
        test.done();
    },

    testMultipleCallbackError: function(test) {
        test.throws(function() {
            messages.normalizeFromArguments([MSG, MSG, MSG, CB, CB], true);
        });
        test.done();
    },


    testMultipleAsList: function(test) {
        var result = messages.normalizeFromArguments([[MSG, MSG, MSG]], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 3);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        test.done();
    },

    testMultipleAsListWithCallback: function(test) {
        var result = messages.normalizeFromArguments([[MSG, MSG, MSG], CB], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 3);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        test.strictEqual(cb, CB);
        test.done();
    },


    // And test a few mixed types to sanity check combinations
    testMixed: function(test) {
        var result = messages.normalizeFromArguments([MSG, new Buffer(MSG), {'value':MSG,'key':KEY}, {'value':MSG,'partition':0}, CB], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(msgs.length, 4);
        assertMessageEquals(test, msgs[0], MSG_ENC, null, null);
        assertMessageEquals(test, msgs[1], MSG_ENC, null, null);
        assertMessageEquals(test, msgs[2], MSG_ENC, KEY_ENC, null);
        assertMessageEquals(test, msgs[3], MSG_ENC, null, 0);
        test.strictEqual(cb, CB);
        test.done();
    },


    // Try some key/value schemas

    testValueSchemaStr: function(test) {
        var result = messages.normalizeFromArguments([VALUE_SCHEMA], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(schemas[0], null);
        test.strictEqual(schemas[1], VALUE_SCHEMA);
        test.done();
    },

    testKeyValueSchemaStr: function(test) {
        var result = messages.normalizeFromArguments([KEY_SCHEMA, VALUE_SCHEMA], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(schemas[0], KEY_SCHEMA);
        test.strictEqual(schemas[1], VALUE_SCHEMA);
        test.done();
    },

    testAvroObjectMessage: function(test) {
        // Object envelope should be detected properly because key/partition are included in addition to value field
        var result = messages.normalizeFromArguments([VALUE_SCHEMA, {'value': AVRO_MSG, 'partition': 0}], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(schemas[1], VALUE_SCHEMA);
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], AVRO_MSG, null, 0);
        test.done();
    },

    testAvroValueOnly: function(test) {
        // An Avro JSON value should be usable directly without an envelope
        var result = messages.normalizeFromArguments([VALUE_SCHEMA, AVRO_MSG], true),
            msgs = result[0], schemas = result[1], cb = result[2];
        test.strictEqual(schemas[1], VALUE_SCHEMA);
        test.strictEqual(msgs.length, 1);
        assertMessageEquals(test, msgs[0], AVRO_MSG, null, null);
        test.done();
    }

};