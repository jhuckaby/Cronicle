/*
 * librdkafka - Apache Kafka C library
 *
 * Copyright (c) 2012-2015, Magnus Edenhill
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

#include <iostream>
#include "testcpp.h"


class myEventCb : public RdKafka::EventCb {
 public:
	 myEventCb() {
		 stats_cnt = 0;
	 }
  int stats_cnt;
  void event_cb (RdKafka::Event &event) {
    switch (event.type())
    {
      case RdKafka::Event::EVENT_STATS:
		  Test::Say(tostr() << "Stats (#" << stats_cnt << "): " <<
					event.str() << "\n");
		  if (event.str().length() > 20)
			  stats_cnt += 1;
        break;
      default:
        break;
    }
  }
};

void test_stats_cb () {
  RdKafka::Conf *conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
  myEventCb my_event = myEventCb();
  std::string errstr;

  if (conf->set("statistics.interval.ms", "100", errstr) != RdKafka::Conf::CONF_OK)
	  Test::Fail(errstr);

  if (conf->set("event_cb", &my_event, errstr) != RdKafka::Conf::CONF_OK)
	  Test::Fail(errstr);

  RdKafka::Producer *p = RdKafka::Producer::create(conf, errstr);
  if (!p)
	  Test::Fail("Failed to create Producer: " + errstr);
  delete conf;

  int64_t t_start = test_clock();

  while (my_event.stats_cnt < 12)
    p->poll(1000);

  int elapsed = (int)((test_clock() - t_start) / 1000);
  const int expected_time = 1200;

  Test::Say(tostr() << my_event.stats_cnt << " (expected 12) stats callbacks received in " <<
			elapsed << "ms (expected " << expected_time << "ms +-25%)\n");

  if (elapsed < expected_time * 0.75 ||
	  elapsed > expected_time * 1.25)
	  Test::Fail(tostr() << "Elapsed time " << elapsed << "ms outside +-25% window (" <<
				  expected_time << "ms), cnt " << my_event.stats_cnt);
  delete p;
}

extern "C" {
  int main_0053_stats_cb (int argc, char **argv) {
    test_stats_cb();
    return 0;
  }
}
