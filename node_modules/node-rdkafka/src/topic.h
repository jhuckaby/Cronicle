/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

#ifndef SRC_TOPIC_H_
#define SRC_TOPIC_H_

#include <nan.h>
#include <string>

#include "rdkafkacpp.h"

#include "src/config.h"

namespace NodeKafka {

class Topic : public Nan::ObjectWrap {
 public:
  static void Init(v8::Local<v8::Object>);
  static v8::Local<v8::Object> NewInstance(v8::Local<v8::Value> arg);

  Baton toRDKafkaTopic(Connection *handle);

 protected:
  static Nan::Persistent<v8::Function> constructor;
  static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);

  static NAN_METHOD(NodeGetMetadata);

  // TopicConfig * config_;

  std::string errstr;
  std::string name();

 private:
  Topic(std::string, RdKafka::Conf *);
  ~Topic();

  std::string m_topic_name;
  RdKafka::Conf * m_config;

  static NAN_METHOD(NodeGetName);
  static NAN_METHOD(NodePartitionAvailable);
  static NAN_METHOD(NodeOffsetStore);
};

}  // namespace NodeKafka

#endif  // SRC_TOPIC_H_
