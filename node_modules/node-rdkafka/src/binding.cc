/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

#include <iostream>
#include "src/binding.h"

using NodeKafka::Producer;
using NodeKafka::KafkaConsumer;
using NodeKafka::Topic;

using node::AtExit;
using RdKafka::ErrorCode;

static void RdKafkaCleanup(void*) {  // NOLINT
  /*
   * Wait for RdKafka to decommission.
   * This is not strictly needed but
   * allows RdKafka to clean up all its resources before the application
   * exits so that memory profilers such as valgrind wont complain about
   * memory leaks.
   */

  RdKafka::wait_destroyed(5000);
}

NAN_METHOD(NodeRdKafkaErr2Str) {
  int points = Nan::To<int>(info[0]).FromJust();
  // Cast to error code
  RdKafka::ErrorCode err = static_cast<RdKafka::ErrorCode>(points);

  std::string errstr = RdKafka::err2str(err);

  info.GetReturnValue().Set(Nan::New<v8::String>(errstr).ToLocalChecked());
}

NAN_METHOD(NodeRdKafkaBuildInFeatures) {
  RdKafka::Conf * config = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);

  std::string features;

  if (RdKafka::Conf::CONF_OK == config->get("builtin.features", features)) {
    info.GetReturnValue().Set(Nan::New<v8::String>(features).ToLocalChecked());
  } else {
    info.GetReturnValue().Set(Nan::Undefined());
  }

  delete config;
}

void ConstantsInit(v8::Local<v8::Object> exports) {
  v8::Local<v8::Object> constants = Nan::New<v8::Object>();

  // RdKafka Error Code definitions
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__BEGIN);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__BEGIN);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__BAD_MSG);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__BAD_COMPRESSION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__DESTROY);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__FAIL);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__TRANSPORT);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__CRIT_SYS_RESOURCE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__RESOLVE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__MSG_TIMED_OUT);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__PARTITION_EOF);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__UNKNOWN_PARTITION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__FS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__UNKNOWN_TOPIC);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__ALL_BROKERS_DOWN);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__INVALID_ARG);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__TIMED_OUT);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__QUEUE_FULL);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__ISR_INSUFF);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__NODE_UPDATE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__SSL);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__WAIT_COORD);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__UNKNOWN_GROUP);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__IN_PROGRESS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__PREV_IN_PROGRESS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__EXISTING_SUBSCRIPTION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__ASSIGN_PARTITIONS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__REVOKE_PARTITIONS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__CONFLICT);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__STATE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__UNKNOWN_PROTOCOL);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__NOT_IMPLEMENTED);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__AUTHENTICATION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__NO_OFFSET);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__OUTDATED);

  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__END);

  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_UNKNOWN);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_NO_ERROR);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_OFFSET_OUT_OF_RANGE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_INVALID_MSG);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_UNKNOWN_TOPIC_OR_PART);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_INVALID_MSG_SIZE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_LEADER_NOT_AVAILABLE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_NOT_LEADER_FOR_PARTITION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_REQUEST_TIMED_OUT);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_BROKER_NOT_AVAILABLE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_REPLICA_NOT_AVAILABLE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_MSG_SIZE_TOO_LARGE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_STALE_CTRL_EPOCH);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_OFFSET_METADATA_TOO_LARGE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_NETWORK_EXCEPTION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_GROUP_LOAD_IN_PROGRESS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_GROUP_COORDINATOR_NOT_AVAILABLE);  // NOLINT
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_NOT_COORDINATOR_FOR_GROUP);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_TOPIC_EXCEPTION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_RECORD_LIST_TOO_LARGE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_NOT_ENOUGH_REPLICAS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_NOT_ENOUGH_REPLICAS_AFTER_APPEND);  // NOLINT
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_INVALID_REQUIRED_ACKS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_ILLEGAL_GENERATION);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_INCONSISTENT_GROUP_PROTOCOL);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_INVALID_GROUP_ID);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_UNKNOWN_MEMBER_ID);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_INVALID_SESSION_TIMEOUT);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_REBALANCE_IN_PROGRESS);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_INVALID_COMMIT_OFFSET_SIZE);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_TOPIC_AUTHORIZATION_FAILED);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_GROUP_AUTHORIZATION_FAILED);
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR_CLUSTER_AUTHORIZATION_FAILED);

  #if RD_KAFKA_VERSION > 0x00090200
  NODE_DEFINE_CONSTANT(constants, ErrorCode::ERR__TIMED_OUT_QUEUE);
  #endif

  exports->Set(Nan::New("codes").ToLocalChecked(), constants);

  exports->Set(Nan::New("err2str").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(NodeRdKafkaErr2Str)).ToLocalChecked());  // NOLINT

  exports->Set(Nan::New("features").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(NodeRdKafkaBuildInFeatures)).ToLocalChecked());  // NOLINT
}

void Init(v8::Local<v8::Object> exports, v8::Local<v8::Object> module) {
  AtExit(RdKafkaCleanup);
  KafkaConsumer::Init(exports);
  Producer::Init(exports);
  Topic::Init(exports);
  ConstantsInit(exports);

  exports->Set(Nan::New("librdkafkaVersion").ToLocalChecked(),
      Nan::New(RdKafka::version_str().c_str()).ToLocalChecked());
}

NODE_MODULE(kafka, Init)
