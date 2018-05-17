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
 * A simple consumer of tweets that periodically reports trending hashtags.
 */

var KafkaRest = require("../.."),
    argv = require('minimist')(process.argv.slice(2));

var api_url = argv.url || "http://localhost:8082";
var topicName = argv.topic;
var consumerGroup = argv.group;
var format = argv.format || "avro";
var fromBeginning = argv['from-beginning'];
var help = (argv.help || argv.h);

if (help || topicName === undefined || (format != "binary" && format != "avro")) {
    console.log("Compute and report trending hashtags in tweets.");
    console.log();
    console.log("Usage: node trending.js [--url <api-base-url>] --topic <topic> [--group <consumer-group-name>] [--from-beginning] [--format <avro|binary>]");
    process.exit(help ? 0 : 1);
}

var binary = (format == "binary");

if (consumerGroup === undefined)
    consumerGroup = "tweet-trending-consumer-" + Math.round(Math.random() * 100000);

var kafka = new KafkaRest({"url": api_url});
var consumer_instance;
// How often to report the top 10
var report_period = 10000;
// How much to discount the current weights for each report_period
var period_discount_rate = .99;

var consumerConfig = { "format" : format };
if (fromBeginning) {
    consumerConfig['auto.offset.reset'] = 'smallest';
}
kafka.consumer(consumerGroup).join(consumerConfig, function(err, ci) {
    if (err) return console.log("Failed to create instance in consumer group: " + err);
    consumer_instance = ci;
    var stream = consumer_instance.subscribe(topicName);
    stream.on('data', function(msgs) {
        for(var i = 0; i < msgs.length; i++) {
            var tweet = (binary ? JSON.parse(msgs[i].value.toString('utf8')) : msgs[i].value);
            processTweet(tweet);
        }
    });
    stream.on('error', function(err) {
        console.log("Consumer instance reported an error: " + err);
        shutdown();
    });

    process.on('SIGINT', shutdown);
});

// Implements a simple EWA scheme on lower-cased hashtags.
var hashtags = {};
function processTweet(tweet) {
    var words = tweet.text.toLowerCase().split(/\s/);

    // Filter to hash tags, increment weights
    for(var i = 0; i < words.length; i++) {
        var word = words[i];
        if (word.length > 0 && word[0] == '#') {
            if (hashtags[word] === undefined)
                hashtags[word] = {'name': word, 'weight': 0};
            hashtags[word].weight += 1;
        }
    }
}

// Setup period reporting, discounting of hashtag weights, and cleanup of small
var reportInterval = setInterval(function() {
    var sorted_terms = [];
    for(var hashtagKey in hashtags) {
        var hashtag = hashtags[hashtagKey];
        // Discounting won't affect sorting, so we can do this in the same pass
        hashtag.weight *= period_discount_rate;
        sorted_terms.push(hashtag);
    }
    sorted_terms.sort(function(a,b) { return (a.weight > b.weight ? -1 : (a.weight == b.weight ? 0 : 1)); });

    for(var i = 0; i < Math.min(10, sorted_terms.length); i++) {
        var line = "" + i + ". " + sorted_terms[i].name;
        for(var s = 0; s < (50-sorted_terms[i].name.length); s++)
            line += ' ';
        line +=  "(" + sorted_terms[i].weight + ")";
        console.log(line);
    }
    console.log();
}, report_period);

function shutdown() {
    consumer_instance.shutdown(function(err) {
        if (err) console.log("Error shutting down consumer instance: " + err);
    });
    clearInterval(reportInterval);
}
