/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

#include <string>

#include "src/connection.h"
#include "src/workers.h"

using RdKafka::Conf;

namespace NodeKafka {

/**
 * @brief Connection v8 wrapped object.
 *
 * Wraps the RdKafka::Handle object with compositional inheritence and
 * provides sensible defaults for exposing callbacks to node
 *
 * This object can't itself expose methods to the prototype directly, as far
 * as I can tell. But it can provide the NAN_METHODS that just need to be added
 * to the prototype. Since connections, etc. are managed differently based on
 * whether it is a producer or consumer, they manage that. This base class
 * handles some of the wrapping functionality and more importantly, the
 * configuration of callbacks
 *
 * Any callback available to both consumers and producers, like logging or
 * events will be handled in here.
 *
 * @sa RdKafka::Handle
 * @sa NodeKafka::Client
 */

Connection::Connection(Conf* gconfig, Conf* tconfig):
  m_event_cb(),
  m_gconfig(gconfig),
  m_tconfig(tconfig) {
    std::string errstr;

    m_client = NULL;
    m_is_closing = false;
    uv_rwlock_init(&m_connection_lock);

    // Try to set the event cb. Shouldn't be an error here, but if there
    // is, it doesn't get reported.
    //
    // Perhaps node new methods should report this as an error? But there
    // isn't anything the user can do about it.
    m_gconfig->set("event_cb", &m_event_cb, errstr);
  }

Connection::~Connection() {
  uv_rwlock_destroy(&m_connection_lock);

  if (m_tconfig) {
    delete m_tconfig;
  }

  if (m_gconfig) {
    delete m_gconfig;
  }
}

RdKafka::TopicPartition* Connection::GetPartition(std::string &topic) {
  return RdKafka::TopicPartition::create(topic, RdKafka::Topic::PARTITION_UA);
}

RdKafka::TopicPartition* Connection::GetPartition(std::string &topic, int partition) {  // NOLINT
  return RdKafka::TopicPartition::create(topic, partition);
}

bool Connection::IsConnected() {
  return !m_is_closing && m_client != NULL;
}

bool Connection::IsClosing() {
  return m_client != NULL && m_is_closing;
}

RdKafka::Handle* Connection::GetClient() {
  return m_client;
}

Baton Connection::CreateTopic(std::string topic_name) {
  return CreateTopic(topic_name, NULL);
}

Baton Connection::CreateTopic(std::string topic_name, RdKafka::Conf* conf) {
  std::string errstr;

  RdKafka::Topic* topic = NULL;

  if (IsConnected()) {
    scoped_shared_read_lock lock(m_connection_lock);
    if (IsConnected()) {
      topic = RdKafka::Topic::create(m_client, topic_name, conf, errstr);
    } else {
      return Baton(RdKafka::ErrorCode::ERR__STATE);
    }
  } else {
    return Baton(RdKafka::ErrorCode::ERR__STATE);
  }

  if (!errstr.empty()) {
    return Baton(RdKafka::ErrorCode::ERR_TOPIC_EXCEPTION, errstr);
  }

  // Maybe do it this way later? Then we don't need to do static_cast
  // <RdKafka::Topic*>
  return Baton(topic);
}

Baton Connection::QueryWatermarkOffsets(
  std::string topic_name, int32_t partition,
  int64_t* low_offset, int64_t* high_offset,
  int timeout_ms) {
  // Check if we are connected first

  RdKafka::ErrorCode err;

  if (IsConnected()) {
    scoped_shared_read_lock lock(m_connection_lock);
    if (IsConnected()) {
      // Always send true - we
      err = m_client->query_watermark_offsets(topic_name, partition,
        low_offset, high_offset, timeout_ms);

    } else {
      err = RdKafka::ERR__STATE;
    }
  } else {
    err = RdKafka::ERR__STATE;
  }

  return Baton(err);
}

Baton Connection::GetMetadata(
  bool all_topics, std::string topic_name, int timeout_ms) {
  RdKafka::Topic* topic = NULL;
  RdKafka::ErrorCode err;

  std::string errstr;

  if (!topic_name.empty()) {
    Baton b = CreateTopic(topic_name);
    if (b.err() == RdKafka::ErrorCode::ERR_NO_ERROR) {
      topic = b.data<RdKafka::Topic*>();
    }
  }

  RdKafka::Metadata* metadata = NULL;

  if (!errstr.empty()) {
    return Baton(RdKafka::ERR_TOPIC_EXCEPTION);
  }

  if (IsConnected()) {
    scoped_shared_read_lock lock(m_connection_lock);
    if (IsConnected()) {
      // Always send true - we
      err = m_client->metadata(all_topics, topic, &metadata, timeout_ms);
    } else {
      err = RdKafka::ERR__STATE;
    }
  } else {
    err = RdKafka::ERR__STATE;
  }

  if (err == RdKafka::ERR_NO_ERROR) {
    return Baton(metadata);
  } else {
    // metadata is not set here
    // @see https://github.com/edenhill/librdkafka/blob/master/src-cpp/rdkafkacpp.h#L860
    return Baton(err);
  }
}

// NAN METHODS

NAN_METHOD(Connection::NodeGetMetadata) {
  Nan::HandleScope scope;

  Connection* obj = ObjectWrap::Unwrap<Connection>(info.This());

  v8::Local<v8::Object> config;
  if (info[0]->IsObject()) {
    config = info[0].As<v8::Object>();
  } else {
    config = Nan::New<v8::Object>();
  }

  if (!info[1]->IsFunction()) {
    Nan::ThrowError("Second parameter must be a callback");
    return;
  }

  v8::Local<v8::Function> cb = info[1].As<v8::Function>();

  std::string topic = GetParameter<std::string>(config, "topic", "");
  bool allTopics = GetParameter<bool>(config, "allTopics", true);
  int timeout_ms = GetParameter<int64_t>(config, "timeout", 30000);

  Nan::Callback *callback = new Nan::Callback(cb);

  Nan::AsyncQueueWorker(new Workers::ConnectionMetadata(
    callback, obj, topic, timeout_ms, allTopics));

  info.GetReturnValue().Set(Nan::Null());
}

NAN_METHOD(Connection::NodeQueryWatermarkOffsets) {
  Nan::HandleScope scope;

  Connection* obj = ObjectWrap::Unwrap<Connection>(info.This());

  if (!info[0]->IsString()) {
    Nan::ThrowError("1st parameter must be a topic string");;
    return;
  }

  if (!info[1]->IsNumber()) {
    Nan::ThrowError("2nd parameter must be a partition number");
    return;
  }

  if (!info[2]->IsNumber()) {
    Nan::ThrowError("3rd parameter must be a number of milliseconds");
    return;
  }

  if (!info[3]->IsFunction()) {
    Nan::ThrowError("4th parameter must be a callback");
    return;
  }

  // Get string pointer for the topic name
  Nan::Utf8String topicUTF8(info[0]->ToString());
  // The first parameter is the topic
  std::string topic_name(*topicUTF8);

  // Second parameter is the partition
  int32_t partition = Nan::To<int32_t>(info[1]).FromJust();

  // Third parameter is the timeout
  int timeout_ms = Nan::To<int>(info[2]).FromJust();

  // Fourth parameter is the callback
  v8::Local<v8::Function> cb = info[3].As<v8::Function>();
  Nan::Callback *callback = new Nan::Callback(cb);

  Nan::AsyncQueueWorker(new Workers::ConnectionQueryWatermarkOffsets(
    callback, obj, topic_name, partition, timeout_ms));

  info.GetReturnValue().Set(Nan::Null());
}

// Node methods
NAN_METHOD(Connection::NodeOnEvent) {
  Nan::HandleScope scope;

  if (info.Length() < 1 || !info[0]->IsFunction()) {
    // Just throw an exception
    return Nan::ThrowError("Need to specify a callback");
  }

  Connection* obj = ObjectWrap::Unwrap<Connection>(info.This());

  v8::Local<v8::Function> cb = info[0].As<v8::Function>();
  obj->m_event_cb.dispatcher.AddCallback(cb);

  info.GetReturnValue().Set(Nan::True());
}

}  // namespace NodeKafka
