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

var KafkaRest = require('..'),
    argv = require('minimist')(process.argv.slice(2)),
    async = require('async');

var api_url = argv.url || "http://localhost:8082";
var help = (argv.help || argv.h);

if (help) {
    console.log("Demonstrates accessing a variety of Kafka cluster metadata via the REST proxy API wrapper.");
    console.log();
    console.log("Usage: node metadata.js [--url <api-base-url>]");
    process.exit(0);
}

var kafka = new KafkaRest({"url": api_url});

function listBrokers(done) {
    console.log("Listing brokers:");
    kafka.brokers.list(function (err, data) {
        if (err) {
            console.log("Failed trying to list brokers: " + err);
        } else {
            for (var i = 0; i < data.length; i++)
                console.log(data[i].toString() + " (raw: " + JSON.stringify(data[i].raw) + ")");
        }
        console.log();
        done(err);
    });
}

var firstTopicName = null;
function listTopics(done) {
    console.log("Listing topics:");
    kafka.topics.list(function (err, data) {
        if (err) {
            console("Failed to list topics: " + err);
        } else {
           if (data.length > 0)
                firstTopicName = data[0].name;
             for (var i = 0; i < data.length; i++)
                console.log(data[i].toString() + " (raw: " + JSON.stringify(data[i].raw) + ")");
        }
        console.log();
        done(err);
    });
}

function getSingleTopic(done) {
    if (firstTopicName == null) {
        console.log("Didn't find any topics, skipping getting a single topic.");
        console.log();
        done();
    }
    console.log("Getting single topic " + firstTopicName + ":");
    kafka.topic(firstTopicName).get(function(err, topic) {
        if (err)
            console.log("Failed to get topic " + firstTopicName + ": " + err);
        else
            console.log(topic.toString() + " (raw: " + JSON.stringify(topic.raw) + ")");
        console.log();
        done(err);
    });
}

var firstTopicPartitionId = null;
function listTopicPartitions(done) {
    if (firstTopicName == null) {
        console.log("Didn't find any topics, skipping listing partitions.");
        console.log();
        done();
    }
    console.log("Listing partitions for topic " + firstTopicName + ":");
    kafka.topic(firstTopicName).partitions.list(function (err, data) {
        if (err) {
            console("Failed to list partitions: " + err);
        } else {
            for (var i = 0; i < data.length; i++)
                console.log(data[i].toString() + " (raw: " + JSON.stringify(data[i].raw) + ")");
            if (data.length > 0)
                firstTopicPartitionId = data[0].id;
        }
        console.log();
        done(err);
    });
}

function getSingleTopicPartition(done) {
    if (firstTopicName == null || firstTopicPartitionId == null) {
        console.log("Didn't find any topics or partitions, skipping getting a single partition.");
        console.log();
        done();
    }
    console.log("Getting single partition " + firstTopicName + ":" + firstTopicPartitionId + ":");
    kafka.topic(firstTopicName).partition(firstTopicPartitionId).get(function(err, partition) {
        if (err)
            console.log("Failed to get partition \"" + firstTopicName + "\":" + firstTopicPartitionId + ": " + err);
        else
            console.log(partition.toString() + " (raw: " + JSON.stringify(partition.raw) + ")");
        console.log();
        done(err);
    });
}

async.series([listBrokers, listTopics, getSingleTopic, listTopicPartitions, getSingleTopicPartition]);