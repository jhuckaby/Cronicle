/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

#ifndef SRC_PRODUCER_H_
#define SRC_PRODUCER_H_

#include <nan.h>
#include <node.h>
#include <node_buffer.h>
#include <string>

#include "rdkafkacpp.h"

#include "src/common.h"
#include "src/connection.h"
#include "src/callbacks.h"
#include "src/topic.h"

namespace NodeKafka {

class ProducerMessage {
 public:
  explicit ProducerMessage(v8::Local<v8::Object>, NodeKafka::Topic*);
  ~ProducerMessage();

  void* Payload();
  size_t Size();
  bool IsEmpty();
  RdKafka::Topic * GetTopic();

  std::string m_errstr;

  Topic * m_topic;
  int32_t m_partition;
  std::string m_key;

  void* m_buffer_data;
  size_t m_buffer_length;

  bool m_is_empty;
};

class Producer : public Connection {
 public:
  static void Init(v8::Local<v8::Object>);
  static v8::Local<v8::Object> NewInstance(v8::Local<v8::Value>);

  Baton Connect();
  void Disconnect();
  void Poll();
  #if RD_KAFKA_VERSION > 0x00090200
  Baton Flush(int timeout_ms);
  #endif

  Baton Produce(void* message, size_t message_size,
    RdKafka::Topic* topic, int32_t partition,
    const void* key, size_t key_len,
    void* opaque);

  Baton Produce(void* message, size_t message_size,
    std::string topic, int32_t partition,
    std::string* key,
    int64_t timestamp, void* opaque);

  Baton Produce(void* message, size_t message_size,
    std::string topic, int32_t partition,
    const void* key, size_t key_len,
    int64_t timestamp, void* opaque);

  std::string Name();

  void ActivateDispatchers();
  void DeactivateDispatchers();

 protected:
  static Nan::Persistent<v8::Function> constructor;
  static void New(const Nan::FunctionCallbackInfo<v8::Value>&);

  Producer(Conf*, Conf*);
  ~Producer();

 private:
  static NAN_METHOD(NodeProduce);
  static NAN_METHOD(NodeOnDelivery);
  static NAN_METHOD(NodeSetPartitioner);
  static NAN_METHOD(NodeConnect);
  static NAN_METHOD(NodeDisconnect);
  static NAN_METHOD(NodePoll);
  #if RD_KAFKA_VERSION > 0x00090200
  static NAN_METHOD(NodeFlush);
  #endif

  Callbacks::Delivery m_dr_cb;
  Callbacks::Partitioner m_partitioner_cb;
};

}  // namespace NodeKafka

#endif  // SRC_PRODUCER_H_
