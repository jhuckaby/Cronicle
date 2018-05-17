kafka-rest
==========

kafka-rest is a node.js library for the Kafka REST Proxy. It provides a thin
wrapper around the REST API, providing a more convenient interface for accessing
cluster metadata and producing and consuming Avro and binary data.

Getting Started
---------------

You can install the `kafka-rest` library via npm:

    npm install kafka-rest

The only required dependency is `async`. However, some additional libraries are
required to run the examples and are included as devDependencies.

Next, make sure you have Kafka, the Schema Registry (if using Avro), and the
Kafka REST Proxy running. The Confluent Quickstart and REST Proxy
[documentation](http://docs.confluent.io) explains how to do this step-by-step.

API
---

Start by requiring the library and creating a `KafkaRest` object to interact
with the server:

    var KafkaRest = require('kafka-rest');
    var kafka = new KafkaRest({ 'url': 'http://localhost:8082' });

### Metadata

The API mirrors the REST API closely: there are resources for Brokers, Topics,
Partitions, and Consumers, and these are available in the `KafkaRest`
object. For example, to get a list of brokers (we'll skip error checking to keep
things simple):

    // kafka.brokers is a Brokers instance, list() returns a list of Broker instances
    kafka.brokers.list(function(err, brokers) {
        for(var i = 0; i < brokers.length; i++)
            console.log(brokers[i].toString());
    });

Objects generated from API responses will have a field `raw` where you can get
at the raw response data. For the brokers, `brokers[i].raw` would just be a
number because the broker list API only returns broker IDs.

All types have both collection (`Topics`) and singular (`Topic`) types
corresponding to the `/topics` and `/topics/<topic>` API endpoints. The
collection types primary method is `list()` which returns a list of singular
types which are initialize **only with the data returned by the API call to get
the list of objects**. Singular objects can be constructed directly, or there is
a shorthand via the collection type:

    kafka.topics.get('test', function(err, topic) {
        // topic is a Topic object
    });

And you can create an incomplete singular object (i.e. no API call is made, only
its identifying properties are stored):

    kafka.topics.topic('test');

This can be useful when you want to get directly at a nested resource you know
the path to and don't want to do API calls on the intermediate resources
(i.e. get a single partition, but don't look up topic metadata):

    // The complete version makes the resource hierarchy clear
    kafka.topics.topic('test').partitions.partition(0);
    // Or use the shorter version. Under the hood they do the same thing, so you
    // can use whichever is clearer based on context
    kafka.topic('test').partition(0);
    // For partitions there's also:
    kafka.topicPartition('test', 0)

If you have an incomplete singular object returned by a `list()` call, you can
fill request its data using `get()`.

### Producing

You can produce messages by calling `produce()` on `Topic` or `Partition`
objects. They can be incomplete instances, e.g.:

    kafka.topic('test').produce('message')

With this one method you can:

* Specify values by passing them in directly, or records with any combination
  of key, value, and partition fields. (Only `Topic` objects support the
  partition field).
* Send a batch of messages by passing them as separate arguments or as an
  array. Messages may be of mixed form, i.e. some may be raw values, others may
  be records with key and value fields.
* Send raw binary data (`null`, `string`, or `Buffer` objects) or Avro data (in
  JSON form) with a schema. For Avro data, you can pass up to two `AvroSchema`
  objects. If one is included, it is used as the value schema; if two are
  include the first is the key schema, the second is the value schema.
* Add a callback of the form `function(err, res)` anywhere in the argument list
  to be notified when the request completes. `res` is the JSON response returned
  by the proxy.

Here are a few examples showing these features:

    // With binary data:

    // Single message with a string value
    topic.produce('msg1');

    // Single message with key, value, and partition, with callback
    topic.produce({'key': 'key1', 'value': 'msg1', 'partition': 0}, function(err,res){});

    // Any record fields can be omitted
    topic.produce({'partition': 0, 'value': 'msg1'});

    // Multiple messages containing only values
    topic.produce('msg1', 'msg2', 'msg3');

    // Multiple messages containing only values, passed as array
    topic.produce(['msg1', 'msg2', 'msg3']);

    // Multiple messages, mixed format
    topic.produce('msg1', {'partition': 0, 'value': 'msg2'});


    // With Avro data:

    var userIdSchema = new KafkaRest.AvroSchema("int");
    var userInfoSchema = new KafkaRest.AvroSchema({
        "name": "UserInfo",
        "type": "record",
        "fields": [
            { "name": "id", "type": "int" },
            { "name": "name", "type": "string" }]
    });

    // Avro value schema followed by messages containing only values
    topic.produce(userInfoSchema, {'avro': 'record'}, {'avro': 'another record'});

    // Avro key and value schema.
    topic.produce(userIdSchema, userInfoSchema, {'key': 1, 'value': {'id': 1, 'name': 'Bob'}});

To avoid sending schemas with every request, the REST API supports *schema IDs*.
Use of schema IDs is handled transparently for you -- as long as you
use the same `AvroSchema` object across calls to `produce()`, the IDs will be
used instead of the full schemas.

Note that because this API is a thin wrapper around the REST Proxy, you must
batch your messages to improve performance. The `twitter/stream_tweets.js`
example performs this type of batching.

### Consumers

Currently the REST proxy supports the high-level consumer interface using
consumer groups. To start consuming data, join a consumer group, optionally
specifying some configuration options (passed directly to the API call):

    kafka.consumer("my-consumer-group").join({
        "format": "avro",
        "auto.commit.enable": "true",
    }, function(err, consumer_instance) {
        // consumer_instance is a ConsumerInstance object
    });

The group doesn't have to exist yet -- if you use a new consumer group name, it
will be created. You can then subscribe to a topic, resulting in a
`ConsumerStream`, and setup event handlers:

    var stream = consumer_instance.subscribe('my-topic')
    stream.on('data', function(msgs) {
        for(var i = 0; i < msgs.length; i++)
            console.log("Got a message: key=" + msgs[i].key + " value=" + msgs[i].value + " partition=" + msgs[i].partition);
    });
    stream.on('error', function(err) {
        console.log("Something broke: " + err);
    });

The exact type for each messages key/value depends on the data format you're
reading. Binary data will have been decoded from its base64 representation into
a `Buffer` (or `null`). For Avro, you'll get an object.

Finally, when you're ready to clean up, request a graceful shutdown of the
consumer instance, which also cleans up the stream:

    consumer_instance.shutdown(function() {
        console.log("Shutdown complete.");
    });

Examples
--------

A few examples are included in the `examples/` directory:

* `metadata.js` - A simple demo of some of the metadata APIs, covering brokers,
  topics, and partitions.
* `console_producer.js` - Reads from stdin and produces each line as a message
  to a Kafka topic.
* `console_consumer.js` - Consumes a Kafka topic and writes each message to
  stdout.
* `twitter/stream_tweets.js` - Uses Twitter's API to get a realtime feed of
  tweets which it produces to a Kafka topic.
* `twitter/trending.js` - Uses the tweet data produced by the previous example
  to generate a list of trending hashtags, which it prints every 10 seconds to
  stdout.

Contribute
----------

- Source Code: https://github.com/confluentinc/kafka-rest-node
- Issue Tracker: https://github.com/confluentinc/kafka-rest-node/issues

License
-------

The project is licensed under the Apache 2 license.
