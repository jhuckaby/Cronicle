/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

#ifndef SRC_CONFIG_H_
#define SRC_CONFIG_H_

#include <nan.h>
#include <iostream>
#include <vector>
#include <list>
#include <string>

#include "rdkafkacpp.h"
#include "src/common.h"
#include "src/callbacks.h"

namespace NodeKafka {

class Conf : public RdKafka::Conf {
 public:
  ~Conf();

  static Conf* create(RdKafka::Conf::ConfType, v8::Local<v8::Object>, std::string &);  // NOLINT
  static void DumpConfig(std::list<std::string> *);

  void listen();
  void stop();
 protected:
  NodeKafka::Callbacks::Rebalance * m_rebalance_cb = NULL;
  NodeKafka::Callbacks::OffsetCommit * m_offset_commit_cb = NULL;
};

}  // namespace NodeKafka

#endif  // SRC_CONFIG_H_
