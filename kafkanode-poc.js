#!/usr/bin/env node

let KafkaRest = require('kafka-rest');
let kafka = new KafkaRest({ 'url': 'http://localhost:8082' });

let jobid = `${process.env.JOB_EVENT_TITLE}-${process.env.JOB_ID}`;

// kafka.brokers is a Brokers instance, list() returns a list of Broker instances
kafka.brokers.list(function(err, brokers) {
    for(var i = 0; i < brokers.length; i++)
        console.log(brokers[i].toString());
});

// With Avro data:
let triggerSchema = new KafkaRest.AvroSchema({
    "name": "TriggerForecastOptimization",
    "type": "record",
    "namespace" : "com.wba.scheduler" ,
    "fields": [
        { "name": "timeout", "type": "long" },
        { "name": "jobid", "type": "string" },
        { "name" : "processingTime" , "type" : "long"},
        { "name" : "error" , "type" : "boolean"} ]
});

let trigger = {
     timeout : process.env.timeout,
     jobid :  jobid ,
     processingTime : process.env.PROCESSING_TIME,
     error : process.env.IN_ERROR
};

// Avro value schema followed by messages containing only values
topic.produce(triggerSchema, trigger , (err,res) => {
  if(err){
    console.log(`Something wrong producing event FOre`)
  }
});

// event published , start a consumer
kafka.consumer("my-consumer-group").join({
    "format": "avro",
    "auto.commit.enable": "true",
}, function(err, consumer_instance) {
    // consumer_instance is a ConsumerInstance object
    var stream = consumer_instance.subscribe('my-topic')
    stream.on('data', function(msgs) {
    for(var i = 0; i < msgs.length; i++)
        console.log("Got a message: key=" + msgs[i].key + " value=" + msgs[i].value + " partition=" + msgs[i].partition);
    });
    stream.on('error', function(err) {
    console.log("Something broke: " + err);
  });
});
