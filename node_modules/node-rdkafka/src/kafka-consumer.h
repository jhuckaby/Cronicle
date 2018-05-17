/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

#ifndef SRC_KAFKA_CONSUMER_H_
#define SRC_KAFKA_CONSUMER_H_

#include <nan.h>
#include <uv.h>
#include <iostream>
#include <string>
#include <vector>

#include "rdkafkacpp.h"

#include "src/common.h"
#include "src/connection.h"
#include "src/callbacks.h"

namespace NodeKafka {

/**
 * @brief KafkaConsumer v8 wrapped object.
 *
 * Specializes the connection to wrap a consumer object through compositional
 * inheritence. Establishes its prototype in node through `Init`
 *
 * @sa RdKafka::Handle
 * @sa NodeKafka::Client
 */

class KafkaConsumer : public Connection {
 public:
  static void Init(v8::Local<v8::Object>);
  static v8::Local<v8::Object> NewInstance(v8::Local<v8::Value>);

  Baton Connect();
  Baton Disconnect();

  Baton Subscription();
  Baton Unsubscribe();
  bool IsSubscribed();

  Baton Pause(std::vector<RdKafka::TopicPartition*> &);
  Baton Resume(std::vector<RdKafka::TopicPartition*> &);

  // Asynchronous commit events
  Baton Commit(std::string, int, int64_t);
  Baton Commit();
  Baton OffsetsStore(std::vector<RdKafka::TopicPartition*> &);

  Baton GetWatermarkOffsets(std::string, int32_t, int64_t*, int64_t*);

  // Synchronous commit events
  Baton CommitSync(std::string, int, int64_t);
  Baton CommitSync();

  Baton Committed(std::vector<RdKafka::TopicPartition*> &, int timeout_ms);
  Baton Position(std::vector<RdKafka::TopicPartition*> &);

  Baton RefreshAssignments();

  bool HasAssignedPartitions();
  int AssignedPartitionCount();

  Baton Assign(std::vector<RdKafka::TopicPartition*>);
  Baton Unassign();

  Baton Seek(const RdKafka::TopicPartition &partition, int timeout_ms);

  std::string Name();

  Baton Subscribe(std::vector<std::string>);
  Baton Consume(int timeout_ms);

  void ActivateDispatchers();
  void DeactivateDispatchers();

 protected:
  static Nan::Persistent<v8::Function> constructor;
  static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);

  KafkaConsumer(Conf *, Conf *);
  ~KafkaConsumer();

 private:
  static void part_list_print(const std::vector<RdKafka::TopicPartition*>&);

  std::vector<RdKafka::TopicPartition*> m_partitions;
  int m_partition_cnt;
  bool m_is_subscribed = false;

  // Node methods
  static NAN_METHOD(NodeConnect);
  static NAN_METHOD(NodeSubscribe);
  static NAN_METHOD(NodeDisconnect);
  static NAN_METHOD(NodeAssign);
  static NAN_METHOD(NodeUnassign);
  static NAN_METHOD(NodeAssignments);
  static NAN_METHOD(NodeUnsubscribe);
  static NAN_METHOD(NodeCommit);
  static NAN_METHOD(NodeCommitSync);
  static NAN_METHOD(NodeOffsetsStore);
  static NAN_METHOD(NodeCommitted);
  static NAN_METHOD(NodePosition);
  static NAN_METHOD(NodeSubscription);
  static NAN_METHOD(NodeSeek);
  static NAN_METHOD(NodeGetWatermarkOffsets);
  static NAN_METHOD(NodeConsumeLoop);
  static NAN_METHOD(NodeConsume);

  static NAN_METHOD(NodePause);
  static NAN_METHOD(NodeResume);
};

}  // namespace NodeKafka

#endif  // SRC_KAFKA_CONSUMER_H_
