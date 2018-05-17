node-rdkafka - Node.js wrapper for Kafka C/C++ library
==============================================

Copyright (c) 2016 Blizzard Entertainment.

[https://github.com/blizzard/node-rdkafka](https://github.com/blizzard/node-rdkafka)

[![Build Status](https://travis-ci.org/Blizzard/node-rdkafka.svg?branch=master)](https://travis-ci.org/Blizzard/node-rdkafka)
[![npm version](https://badge.fury.io/js/node-rdkafka.svg)](https://badge.fury.io/js/node-rdkafka)

# Overview

The `node-rdkafka` library is a high-performance NodeJS client for [Apache Kafka](http://kafka.apache.org/) that wraps the native  [librdkafka](https://github.com/edenhill/librdkafka) library.  All the complexity of balancing writes across partitions and managing (possibly ever-changing) brokers should be encapsulated in the library.

__This library currently uses `librdkafka` version `0.11.1`.__

## Reference Docs

To view the reference docs for the current version, go [here](https://blizzard.github.io/node-rdkafka/current/)

## Contributing

For guidelines on contributing please see [CONTRIBUTING.md](https://github.com/blizzard/node-rdkafka/blob/master/CONTRIBUTING.md)

## Code of Conduct

Play nice; Play fair.

## Requirements

* Apache Kafka >=0.9
* Node.js >=4
* Linux/Mac
* Windows?! See below

__NOTE:__ From the `librdkafka` docs

> WARNING: Due to a bug in Apache Kafka 0.9.0.x, the ApiVersionRequest (as sent by the client when connecting to the broker) will be silently ignored by the broker causing the request to time out after 10 seconds. This causes client-broker connections to stall for 10 seconds during connection-setup before librdkafka falls back on the broker.version.fallback protocol features. The workaround is to explicitly configure api.version.request to false on clients communicating with &lt=0.9.0.x brokers.

### Windows

Installing `node-rdkafka` on Windows is now possible thanks to [#248](https://github.com/Blizzard/node-rdkafka/pull/248). However, it does require some special instructions.

You can read the [Librdkafka Windows Instructions](https://github.com/edenhill/librdkafka/blob/master/README.win32) here. As it says in that document, you must be using Microsoft Visual Studio 2013 to compile `librdkafka`. This is because a version of openssl that is used requires this version of Visual Studio.

If you have multiple versions of Visual Studio on your machine you may need to ensure that the correct MSBuild is called by node-gyp. For whatever reason, gyp just uses the MSBuild in your path if there is one, so you will need to ensure it resolves to the right place. The `bin` directory for MSBuild will usually be similar to `C:/Program Files (x86)/MSBuild/12.0/Bin/` so ensure it comes late in your path.

Additionally, `librdkafka` requires a few dependencies be installed via `nuget` before it will build properly on Windows. You will need to [download the nuget command line tools](https://www.nuget.org/downloads) and make sure `nuget.exe` is available in your path. It is recommended that you install the latest stable version, as versions before `v4.3.0` did not always correctly read dependencies.

Lastly, you may need to set the MS build tools gyp uses to the correct version.

```sh
node-gyp configure --msvs_version=2013
```

After that it should compile!

**Note:** I _still_ do not recommend using `node-rdkafka` in production on Windows. This feature was in high demand and is provided to help develop, but we do not test against Windows, and windows support may lag behind Linux/Mac support because those platforms are the ones used to develop this library. Contributors are welcome if any Windows issues are found :)

## Tests

This project includes two types of unit tests in this project:
* end-to-end integration tests
* unit tests

You can run both types of tests by using `Makefile`. Doing so calls `mocha` in your locally installed `node_modules` directory.

* Before you run the tests, be sure to init and update the submodules:
  1. `git submodule init`
  2. `git submodule update`
* To run the unit tests, you can run `make lint` or `make test`.
* To run the integration tests, you must have a running Kafka installation available. By default, the test tries to connect to `localhost:9092`; however, you can supply the `KAFKA_HOST` environment variable to override this default behavior. Run `make e2e`.

# Usage

You can install the `node-rdkafka` module like any other module:

```
npm install node-rdkafka
```

To use the module, you must `require` it.

```js
var Kafka = require('node-rdkafka');
```

## Configuration

You can pass many configuration options to `librdkafka`.  A full list can be found in `librdkafka`'s [Configuration.md](https://github.com/edenhill/librdkafka/blob/0.11.1.x/CONFIGURATION.md)

Configuration keys that have the suffix `_cb` are designated as callbacks. Some
of these keys are informational and you can choose to opt-in (for example, `dr_cb`). Others are callbacks designed to
return a value, such as `partitioner_cb`.

Not all of these options are supported.
The library will throw an error if the value you send in is invalid.

The library currently supports the following callbacks:
* `partitioner_cb`
* `dr_cb` or `dr_msg_cb`
* `event_cb`

### Librdkafka Methods

This library includes two utility functions for detecting the status of your installation. Please try to include these when making issue reports where applicable.

You can get the features supported by your compile of `librdkafka` by reading the variable "features" on the root of the `node-rdkafka` object.

```js
const Kafka = require('node-rdkafka');
console.log(Kafka.features);

// #=> [ 'gzip', 'snappy', 'ssl', 'sasl', 'regex', 'lz4' ]
```

You can also get the version of `librdkafka`

```js
const Kafka = require('node-rdkafka');
console.log(Kafka.librdkafkaVersion);

// #=> 0.11.1
```

## Sending Messages

A `Producer` sends messages to Kafka.  The `Producer` constructor takes a configuration object, as shown in the following example:

```js
var producer = new Kafka.Producer({
  'metadata.broker.list': 'kafka-host1:9092,kafka-host2:9092'
});
```

A `Producer` requires only `metadata.broker.list` (the Kafka brokers) to be created.  The values in this list are separated by commas.  For other configuration options, see the [Configuration.md](https://github.com/edenhill/librdkafka/blob/0.11.1.x/CONFIGURATION.md) file described previously.

The following example illustrates a list with several `librdkafka` options set.

```js
var producer = new Kafka.Producer({
  'client.id': 'kafka',
  'metadata.broker.list': 'localhost:9092',
  'compression.codec': 'gzip',
  'retry.backoff.ms': 200,
  'message.send.max.retries': 10,
  'socket.keepalive.enable': true,
  'queue.buffering.max.messages': 100000,
  'queue.buffering.max.ms': 1000,
  'batch.num.messages': 1000000,
  'dr_cb': true
});
```

#### Stream API

You can easily use the `Producer` as a writable stream immediately after creation (as shown in the following example):

```js
// Our producer with its Kafka brokers
// This call returns a new writable stream to our topic 'topic-name'
var stream = Kafka.Producer.createWriteStream({
  'metadata.broker.list': 'kafka-host1:9092,kafka-host2:9092'
}, {}, {
  topic: 'topic-name'
});

// Writes a message to the stream
var queuedSuccess = stream.write(new Buffer('Awesome message'));

if (queuedSuccess) {
  console.log('We queued our message!');
} else {
  // Note that this only tells us if the stream's queue is full,
  // it does NOT tell us if the message got to Kafka!  See below...
  console.log('Too many messages in our queue already');
}

stream.on('error', function (err) {
  // Here's where we'll know if something went wrong sending to Kafka
  console.error('Error in our kafka stream');
  console.error(err);
})
```

If you do not want your code to crash when an error happens, ensure you have an `error` listener on the stream. Most errors are not necessarily fatal, but the ones that are will immediately destroy the stream. If you use `autoClose`, the stream will close itself at the first sign of a problem.

#### Standard API

The Standard API is more performant, particularly when handling high volumes of messages.
However, it requires more manual setup to use. The following example illustrates its use:

```js
var producer = new Kafka.Producer({
  'metadata.broker.list': 'localhost:9092',
  'dr_cb': true
});

// Connect to the broker manually
producer.connect();

// Wait for the ready event before proceeding
producer.on('ready', function() {
  try {
    producer.produce(
      // Topic to send the message to
      'topic',
      // optionally we can manually specify a partition for the message
      // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
      null,
      // Message to send. Must be a buffer
      new Buffer('Awesome message'),
      // for keyed messages, we also specify the key - note that this field is optional
      'Stormwind',
      // you can send a timestamp here. If your broker version supports it,
      // it will get added. Otherwise, we default to 0
      Date.now(),
      // you can send an opaque token here, which gets passed along
      // to your delivery reports
    );
  } catch (err) {
    console.error('A problem occurred when sending our message');
    console.error(err);
  }
});

// Any errors we encounter, including connection errors
producer.on('event.error', function(err) {
  console.error('Error from producer');
  console.error(err);
})
```

To see the configuration options available to you, see the [Configuration](#configuration) section.

##### Methods

|Method|Description|
|-------|----------|
|`producer.connect()`| Connects to the broker. <br><br> The `connect()` method emits the `ready` event when it connects successfully. If it does not, the error will be passed through the callback. |
|`producer.disconnect()`| Disconnects from the broker. <br><br>The `disconnect()` method emits the `disconnected` event when it has disconnected. If it does not, the error will be passed through the callback. |
|`producer.poll()` | Polls the producer for delivery reports or other events to be transmitted via the emitter. <br><br>In order to get the events in `librdkafka`'s queue to emit, you must call this regularly. |
|`producer.setPollInterval(interval)` | Polls the producer on this interval, handling disconnections and reconnection. Set it to 0 to turn it off. |
|`producer.produce(topic, partition, msg, key, timestamp, opaque)`| Sends a message. <br><br>The `produce()` method throws when produce would return an error. Ordinarily, this is just if the queue is full. |
|`producer.flush(timeout, callback)`| Flush the librdkafka internal queue, sending all messages. Default timeout is 500ms |

##### Events

Some configuration properties that end in `_cb` indicate that an event should be generated for that option.  You can either:

* provide a value of `true` and react to the event
* provide a callback function directly

The following example illustrates an event:

```js
var producer = new Kafka.Producer({
  'client.id': 'my-client', // Specifies an identifier to use to help trace activity in Kafka
  'metadata.broker.list': 'localhost:9092', // Connect to a Kafka instance on localhost
  'dr_cb': true // Specifies that we want a delivery-report event to be generated
});

// Poll for events every 100 ms
producer.setPollInterval(100);

producer.on('delivery-report', function(err, report) {
  // Report of delivery statistics here:
  //
  console.log(report);
});
```

The following table describes types of events.

|Event|Description|
|-------|----------|
| `disconnected` | The `disconnected` event is emitted when the broker has disconnected. <br><br>This event is emitted only when `.disconnect` is called. The wrapper will always try to reconnect otherwise. |
| `ready` | The `ready` event is emitted when the `Producer` is ready to send messages. |
| `event` | The `event` event is emitted when `librdkafka` reports an event (if you opted in via the `event_cb` option). |
| `event.log` | The `event.log` event is emitted when logging events come in (if you opted into logging via the `event_cb` option). <br><br>You will need to set a value for `debug` if you want to send information. |
| `event.stats` | The  `event.stats` event is emitted when `librdkafka` reports stats (if you opted in). |
| `event.error` | The  `event.error` event is emitted when `librdkafka` reports an error |
| `event.throttle` | The `event.throttle` event emitted  when `librdkafka` reports throttling. |
| `delivery-report` | The `delivery-report` event is emitted when a delivery report has been found via polling. <br><br>To use this event, you must set `request.required.acks` to `1` or `-1` in topic configuration and `dr_cb` (or `dr_msg_cb` if you want the report to contain the message payload) to `true` in the `Producer` constructor options. |

## Kafka.KafkaConsumer

To read messages from Kafka, you use a `KafkaConsumer`.  You instantiate a `KafkaConsumer` object as follows:

```js
var consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092',
}, {});
```

The first parameter is the global config, while the second parameter is the topic config that gets applied to all subscribed topics. To view a list of all supported configuration properties, see the [Configuration.md](https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md) file described previously. Look for the `C` and `*` keys.

The `group.id` and `metadata.broker.list` properties are required for a consumer.

### Rebalancing

Rebalancing is managed internally by `librdkafka` by default. If you would like to override this functionality, you may provide your own logic as a rebalance callback.

```js
var consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092',
  'rebalance_cb': function(err, assignment) {

    if (err.code === Kafka.CODES.ERRORS.ERR__ASSIGN_PARTITIONS) {
      // Note: this can throw when you are disconnected. Take care and wrap it in
      // a try catch if that matters to you
      this.assign(assignment);
    } else if (err.code == Kafka.CODES.ERRORS.ERR__REVOKE_PARTITIONS){
      // Same as above
      this.unassign();
    } else {
      // We had a real error
      console.error(err);
    }

  }
})
```

`this` is bound to the `KafkaConsumer` you have created. By specifying a `rebalance_cb` you can also listen to the `rebalance` event as an emitted event. This event is not emitted when using the internal `librdkafka` rebalancer.

### Commits

When you commit in `node-rdkafka`, the standard way is to queue the commit request up with the next `librdkafka` request to the broker. When doing this, there isn't a way to know the result of the commit. Luckily there is another callback you can listen to to get this information

```js
var consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'localhost:9092',
  'offset_commit_cb': function(err, topicPartitions) {

    if (err) {
      // There was an error committing
      console.error(err);
    } else {
      // Commit went through. Let's log the topic partitions
      console.log(topicPartitions);
    }

  }
})
```

`this` is bound to the `KafkaConsumer` you have created. By specifying an `offset_commit_cb` you can also listen to the `offset.commit` event as an emitted event. It also has an error parameter and a list of topic partitions. This is not emitted unless opted in.

### Message Structure

Messages that are returned by the `KafkaConsumer` have the following structure.

```js
{
  value: new Buffer('hi'), // message contents as a Buffer
  size: 2, // size of the message, in bytes
  topic: 'librdtesting-01', // topic the message comes from
  offset: 1337, // offset the message was read from
  partition: 1, // partition the message was on
  key: 'someKey', // key of the message if present
  timestamp: 1510325354780 // timestamp of message creation
}
```

### Stream API

The stream API is the easiest way to consume messages. The following example illustrates the use of the stream API:

```js
// Read from the librdtesting-01 topic... note that this creates a new stream on each call!
var stream = KafkaConsumer.createReadStream(globalConfig, topicConfig, {
  topics: ['librdtesting-01']
});

stream.on('data', function(message) {
  console.log('Got message');
  console.log(message.value.toString());
});
```

### Standard API

You can also use the Standard API and manage callbacks and events yourself.  You can choose different modes for consuming messages:

* *Flowing mode*. This mode flows all of the messages it can read by maintaining an infinite loop in the event loop. It only stops when it detects the consumer has issued the `unsubscribe` or `disconnect` method.
* *Non-flowing mode*. This mode reads a single message from Kafka at a time manually.

The following example illustrates flowing mode:
```js
// Flowing mode
consumer.connect();

consumer
  .on('ready', function() {
    consumer.subscribe(['librdtesting-01']);

    // Consume from the librdtesting-01 topic. This is what determines
    // the mode we are running in. By not specifying a callback (or specifying
    // only a callback) we get messages as soon as they are available.
    consumer.consume();
  })
  .on('data', function(data) {
    // Output the actual message contents
    console.log(data.value.toString());
  });
```
The following example illustrates non-flowing mode:
```js
// Non-flowing mode
consumer.connect();

consumer
  .on('ready', function() {
    // Subscribe to the librdtesting-01 topic
    // This makes subsequent consumes read from that topic.
    consumer.subscribe(['librdtesting-01']);

    // Read one message every 1000 milliseconds
    setInterval(function() {
      consumer.consume(1);
    }, 1000);
  })
  .on('data', function(data) {
    console.log('Message found!  Contents below.');
    console.log(data.value.toString());
  });
```

The following table lists important methods for this API.

|Method|Description|
|-------|----------|
|`consumer.connect()` | Connects to the broker. <br><br>The `connect()` emits the event `ready` when it has successfully connected. If it does not, the error will be passed through the callback. |
|`consumer.disconnect()` | Disconnects from the broker. <br><br>The `disconnect()` method emits `disconnected` when it has disconnected. If it does not, the error will be passed through the callback. |
|`consumer.subscribe(topics)` | Subscribes to an array of topics. |
|`consumer.unsubscribe()` | Unsubscribes from the currently subscribed topics. <br><br>You cannot subscribe to different topics without calling the `unsubscribe()` method first. |
|`consumer.consume(cb)` | Gets messages from the existing subscription as quickly as possible. This method keeps a background thread running to do the work. If `cb` is specified, invokes `cb(err, message)`. |
|`consumer.consume(number, cb)` | Gets `number` of messages from the existing subscription. If `cb` is specified, invokes `cb(err, message)`. |
|`consumer.commit()` | Commits all locally stored offsets |
|`consumer.commit(topicPartition)` | Commits offsets specified by the topic partition |
|`consumer.commitMessage(message)` | Commits the offsets specified by the message |

The following table lists events for this API.

|Event|Description|
|-------|----------|
|`data` | When using the Standard API consumed messages are emitted in this event. |
|`disconnected` | The `disconnected` event is emitted when the broker disconnects. <br><br>This event is only emitted when `.disconnect` is called. The wrapper will always try to reconnect otherwise. |
|`ready` | The `ready` event is emitted when the `Consumer` is ready to read messages. |
|`event` | The `event` event is emitted when `librdkafka` reports an event (if you opted in via the `event_cb` option).|
|`event.log` | The `event.log` event is emitted when logging events occur (if you opted in for logging  via the `event_cb` option).<br><br> You will need to set a value for `debug` if you want information to send. |
|`event.stats` | The `event.stats` event is emitted when `librdkafka` reports stats (if you opted in). |
|`event.throttle` | The `event.throttle` event is emitted when `librdkafka` reports throttling.|

## Reading current offsets from the broker for a topic

Some times you find yourself in the situation where you need to know the latest (and earliest) offset for one of your topics. Connected producers and consumers both allow you to query for these through `queryWaterMarkOffsets` like follows:

```js
var timeout = 5000, partition = 0;
consumer.queryWatermarkOffsets('my-topic', partition, timeout, function(err, offsets) {
  var high = offsets.highOffest;
  var low = offsets.lowOffset;
});

producer.queryWatermarkOffsets('my-topic', partition, timeout, function(err, offsets) {
  var high = offsets.highOffest;
  var low = offsets.lowOffset;
});

An error will be returned if the client was not connected or the request timed out within the specified interval.

```

## Metadata

Both `Kafka.Producer` and `Kafka.KafkaConsumer` include a `getMetadata` method to retrieve metadata from Kafka.

Getting metadata on any connection returns the following data structure:

```js
{
  orig_broker_id: 1,
  orig_broker_name: "broker_name",
  brokers: [
    {
      id: 1,
      host: 'localhost',
      port: 40
    }
  ],
  topics: [
    {
      name: 'awesome-topic',
      partitions: [
        {
          id: 1,
          leader: 20,
          replicas: [1, 2],
          isrs: [1, 2]
        }
      ]
    }
  ]
}
```

The following example illustrates how to use the `getMetadata` method.

When fetching metadata for a specific topic, if a topic reference does not exist, one is created using the default config.
Please see the documentation on `Client.getMetadata` if you want to set configuration parameters, e.g. `acks`, on a topic to produce messages to.

```js
var opts = {
  topic: 'librdtesting-01',
  timeout: 10000
};

producer.getMetadata(opts, function(err, metadata) {
  if (err) {
    console.error('Error getting metadata');
    console.error(err);
  } else {
    console.log('Got metadata');
    console.log(metadata);
  }
});
```
