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

/**
 * A simple Twitter-Kafka connector using the Twitter streaming API to import.
 */

var KafkaRest = require("../.."),
    argv = require('minimist')(process.argv.slice(2)),
    util = require('util'),
    twitter = require('twitter');

// Twitter arguments
var consumer_key = argv['consumer-key'] || process.env.TWITTER_CONSUMER_KEY;
var consumer_secret = argv['consumer-secret'] || process.env.TWITTER_CONSUMER_SECRET;
var access_key = argv['access-key'] || process.env.TWITTER_ACCESS_KEY;
var access_secret = argv['access-secret'] || process.env.TWITTER_ACCESS_SECRET;
// Kafka arguments
var api_url = argv.url || "http://localhost:8082";
var topicName = argv.topic;
// General arguments
var bufferMessages = argv['message-buffer-size'] || 100; // Number of tweets to buffer before calling produce()
var format = argv.format || "avro";
var filter = argv.filter;
var help = (argv.help || argv.h);

if (help ||
    consumer_key === undefined || consumer_secret === undefined ||
    access_key === undefined || access_secret === undefined ||
    topicName === undefined ||
    (format != "binary" && format != "avro"))
{
    console.log("Stream tweets and load them into a Kafka topic.");
    console.log();
    console.log("Usage: node stream_tweets.js [--consumer-key <consumer-key>] [--consumer-secret <consumer-secret>] [--access-key <access-key>] [--access-secret <access-secret>]");
    console.log("                             [--url <api-base-url>] --topic <topic>");
    console.log("                             [--message-buffer-size <num-messages>] [--format <avro|binary>]");
    console.log("                             [--filter <term>]");
    console.log();
    console.log("You can also specify Twitter credentials via environment variables: TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_KEY, TWITTER_ACCESS_SECRET.");
    process.exit(help ? 0 : 1);
}

var binary = (format == "binary");

var twit = new twitter({
    consumer_key: consumer_key,
    consumer_secret: consumer_secret,
    access_token_key: access_key,
    access_token_secret: access_secret
});

var kafka = new KafkaRest({"url": api_url});
var target = kafka.topic(topicName);
var schema = new KafkaRest.AvroSchema({
    "name": "TweetText",
    "type": "record",
    "fields": [
        { "name": "id", "type": "string" },
        { "name": "text", "type": "string" }
    ]
});

var started = Date.now();
var stream = null;
var consumed = [];
var messages_sent = 0;
var messages_acked = 0;
var exiting = false;
// Windowed stats
var windowed_started = Date.now();
var windowed_collected = 0;
var windowed_acked = 0;
var windowed_period = 10000;
var windowed_interval = setInterval(reportWindowedRate, windowed_period);

var endpoint, endpoint_opts = {};
if (filter) {
    endpoint = 'statuses/filter';
    endpoint_opts = {'track': filter};
} else {
    endpoint = 'statuses/sample';
    endpoint_opts = {'language': 'en'};
}
twit.stream(endpoint, endpoint_opts, function(s) {
    stream = s;
    stream.on('data', function(data) {
        if (exiting) return;

        // Filter to only tweets. Streaming data may contain other data and events such as friends lists, block/favorite
        // events, list modifications, etc. Here we prefilter the data, although this could also be done downstream on
        // the consumer if we wanted to preserve the entire stream. The heuristic we use to distinguish real tweets (or
        // retweets) is the text field, which shouldn't appear at the top level of other events.
        if (data.text === undefined)
            return;

        // Extract just the ID and text. We could save more data, but this keeps the schema small and simple for this
        // example
        var saved_data = {
            'id': data.id_str,
            'text': data.text
        };
        // If we're using Avro, we can just pass the data in directly. If we're
        // using binary, we need to serialize it to a string ourselves.
        consumed.push(binary ? JSON.stringify(saved_data) : saved_data);
        windowed_collected++;
        // Send if we've hit our buffering limit. The number of buffered messages balances your tolerance for losing data
        // (if the process/host is killed/dies) against throughput (batching messages into fewer requests makes processing
        // more efficient).
        if (consumed.length >= bufferMessages) {
            messages_sent += consumed.length;
            var responseHandler = handleProduceResponse.bind(undefined, consumed.length);
            if (binary)
                target.produce(consumed, responseHandler);
            else
                target.produce(schema, consumed, responseHandler);
            consumed = [];
        }
    });
    stream.on('error', function(err) {
        console.log(util.inspect(err));
        // We just shutdown if we encounter an error, but we could also setup retry logic to try to recover the
        // stream
        shutdown();
    });
});

function handleProduceResponse(batch_messages, err, res) {
    messages_acked += batch_messages;
    windowed_acked += batch_messages;
    if (err) {
        console.log("Error sending data to specified topic: " + err);
        shutdown();
    }
    checkExit();
}

function reportWindowedRate() {
    var now = Date.now();
    console.log("Collected " + windowed_collected + " tweets and stored " + windowed_acked + " to Kafka in " + Math.round((now-windowed_started)/1000) + "s, " + Math.round(windowed_collected / ((now - windowed_started) / 1000)) + " tweets/s");
    windowed_started = now;
    windowed_collected = 0;
    windowed_acked = 0;
}

function checkExit() {
    if (exiting && messages_acked == messages_sent) {
        console.log();
        var finished = Date.now();
        console.log("Converted " + messages_acked + " tweets, dropped last " + consumed.length + " remaining buffered tweets, " + Math.round(messages_acked/((finished-started)/1000)) + " tweets/s");
        exiting = false;
    }
}

function shutdown() {
    console.log("Exiting...");
    exiting = true;
    if (stream) stream.destroy();
    clearInterval(windowed_interval);
    checkExit();
}

// Gracefully shutdown on Ctrl-C
process.on('SIGINT', shutdown);
