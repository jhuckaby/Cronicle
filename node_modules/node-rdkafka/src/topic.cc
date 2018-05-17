/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

#include <string>
#include <vector>

#include "src/common.h"
#include "src/connection.h"
#include "src/topic.h"

namespace NodeKafka {

/**
 * @brief Producer v8 wrapped object.
 *
 * Wraps the RdKafka::Producer object with compositional inheritence and
 * provides methods for interacting with it exposed to node.
 *
 * The base wrappable RdKafka::Handle deals with most of the wrapping but
 * we still need to declare its prototype.
 *
 * @sa RdKafka::Producer
 * @sa NodeKafka::Connection
 */

Topic::Topic(std::string topic_name, RdKafka::Conf* config):
  m_topic_name(topic_name),
  m_config(config) {
  // We probably want to copy the config. May require refactoring if we do not
}

Topic::~Topic() {
  if (m_config) {
    delete m_config;
  }
}

std::string Topic::name() {
  return m_topic_name;
}

Baton Topic::toRDKafkaTopic(Connection* handle) {
  if (m_config) {
    return handle->CreateTopic(m_topic_name, m_config);
  } else {
    return handle->CreateTopic(m_topic_name);
  }
}

/*

bool partition_available(int32_t partition) {
  return topic_->partition_available(partition);
}

Baton offset_store (int32_t partition, int64_t offset) {
  RdKafka::ErrorCode err = topic_->offset_store(partition, offset);

  switch (err) {
    case RdKafka::ERR_NO_ERROR:

      break;
    default:

      break;
  }
}

*/

Nan::Persistent<v8::Function> Topic::constructor;

void Topic::Init(v8::Local<v8::Object> exports) {
  Nan::HandleScope scope;

  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
  tpl->SetClassName(Nan::New("Topic").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "name", NodeGetName);

  // connect. disconnect. resume. pause. get meta data
  constructor.Reset(tpl->GetFunction());

  exports->Set(Nan::New("Topic").ToLocalChecked(), tpl->GetFunction());
}

void Topic::New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (!info.IsConstructCall()) {
    return Nan::ThrowError("non-constructor invocation not supported");
  }

  if (info.Length() < 1) {
    return Nan::ThrowError("topic name is required");
  }

  if (!info[0]->IsString()) {
    return Nan::ThrowError("Topic name must be a string");
  }

  RdKafka::Conf* config = NULL;

  if (info.Length() >= 2 && !info[1]->IsUndefined() && !info[1]->IsNull()) {
    // If they gave us two parameters, or the 3rd parameter is null or
    // undefined, we want to pass null in for the config

    std::string errstr;
    if (!info[1]->IsObject()) {
      return Nan::ThrowError("Configuration data must be specified");
    }

    config = Conf::create(RdKafka::Conf::CONF_TOPIC, info[1]->ToObject(), errstr);  // NOLINT

    if (!config) {
      return Nan::ThrowError(errstr.c_str());
    }
  }

  Nan::Utf8String parameterValue(info[0]->ToString());
  std::string topic_name(*parameterValue);

  Topic* topic = new Topic(topic_name, config);

  // Wrap it
  topic->Wrap(info.This());

  // Then there is some weird initialization that happens
  // basically it sets the configuration data
  // we don't need to do that because we lazy load it

  info.GetReturnValue().Set(info.This());
}

// handle

v8::Local<v8::Object> Topic::NewInstance(v8::Local<v8::Value> arg) {
  Nan::EscapableHandleScope scope;

  const unsigned argc = 1;

  v8::Local<v8::Value> argv[argc] = { arg };
  v8::Local<v8::Function> cons = Nan::New<v8::Function>(constructor);
  v8::Local<v8::Object> instance =
    Nan::NewInstance(cons, argc, argv).ToLocalChecked();

  return scope.Escape(instance);
}

NAN_METHOD(Topic::NodeGetName) {
  Nan::HandleScope scope;

  Topic* topic = ObjectWrap::Unwrap<Topic>(info.This());

  info.GetReturnValue().Set(Nan::New(topic->name()).ToLocalChecked());
}

NAN_METHOD(Topic::NodePartitionAvailable) {
  // @TODO(sparente)
}

NAN_METHOD(Topic::NodeOffsetStore) {
  // @TODO(sparente)
}

}  // namespace NodeKafka
