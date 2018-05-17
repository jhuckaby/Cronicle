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

#include "test.h"

/* Typical include path would be <librdkafka/rdkafka.h>, but this program
 * is built from within the librdkafka source tree and thus differs. */
#include "rdkafka.h"  /* for Kafka driver */


/**
 * Consumer: pause and resume.
 * Make sure no messages are lost or duplicated.
 */



static int consume_pause (void) {
	const char *topic = test_mk_topic_name(__FUNCTION__, 1);
	rd_kafka_t *rk;
	rd_kafka_topic_conf_t *tconf;
	rd_kafka_topic_partition_list_t *topics;
	rd_kafka_resp_err_t err;
        const int msgcnt = 1000;
        uint64_t testid;
	int it, iterations = 3;
	int msg_base = 0;
	int fails = 0;

	test_conf_init(NULL, &tconf, 60 + (test_session_timeout_ms * 3 / 1000));
	test_topic_conf_set(tconf, "auto.offset.reset", "smallest");
	
        /* Produce messages */
        testid = test_produce_msgs_easy(topic, 0,
                                        RD_KAFKA_PARTITION_UA, msgcnt);

	topics = rd_kafka_topic_partition_list_new(1);
	rd_kafka_topic_partition_list_add(topics, topic, -1);

	for (it = 0 ; it < iterations ; it++) {
		char group_id[32];
		const int pause_cnt = 5;
		const int per_pause_msg_cnt = msgcnt / pause_cnt;
		const int pause_time = 1200 /* 1.2s */;
		int pause;
		rd_kafka_topic_partition_list_t *parts;
		test_msgver_t mv_all;
		int j;

		test_msgver_init(&mv_all, testid); /* All messages */

		test_str_id_generate(group_id, sizeof(group_id));

		TEST_SAY("Iteration %d/%d, using group.id %s\n", it, iterations,
			 group_id);

		rk = test_create_consumer(group_id, NULL, NULL,
					  rd_kafka_topic_conf_dup(tconf));


		TEST_SAY("Subscribing to %d topic(s): %s\n",
			 topics->cnt, topics->elems[0].topic);
		if ((err = rd_kafka_subscribe(rk, topics)))
			TEST_FAIL("Failed to subscribe: %s\n",
				  rd_kafka_err2str(err));


		for (pause = 0 ; pause < pause_cnt ; pause++) {
			int rcnt;
			test_timing_t t_assignment;
			test_msgver_t mv;

			test_msgver_init(&mv, testid);
			mv.fwd = &mv_all;

			/* Consume sub-part of the messages. */
			TEST_SAY("Pause-Iteration #%d: Consume %d messages at "
				 "msg_base %d\n", pause, per_pause_msg_cnt,
				 msg_base);
			rcnt = test_consumer_poll("consume.part", rk, testid,
						  -1,
						  msg_base, per_pause_msg_cnt,
						  &mv);

			TEST_ASSERT(rcnt == per_pause_msg_cnt,
				    "expected %d messages, got %d",
				    per_pause_msg_cnt, rcnt);

			test_msgver_verify("pause.iteration",
					   &mv, TEST_MSGVER_PER_PART,
					   msg_base, per_pause_msg_cnt);
			test_msgver_clear(&mv);

			msg_base += per_pause_msg_cnt;

			TIMING_START(&t_assignment, "rd_kafka_assignment()");
			if ((err = rd_kafka_assignment(rk, &parts)))
				TEST_FAIL("failed to get assignment: %s\n",
					  rd_kafka_err2str(err));
			TIMING_STOP(&t_assignment);

			TEST_ASSERT(parts->cnt > 0,
				    "parts->cnt %d, expected > 0", parts->cnt);

			TEST_SAY("Now pausing %d partition(s) for %dms\n",
				 parts->cnt, pause_time);
			if ((err = rd_kafka_pause_partitions(rk, parts)))
				TEST_FAIL("Failed to pause: %s\n",
					  rd_kafka_err2str(err));

			/* Check per-partition errors */
			for (j = 0 ; j < parts->cnt ; j++) {
				if (parts->elems[j].err) {
					TEST_WARN("pause failure for "
						  "%s %"PRId32"]: %s\n",
						  parts->elems[j].topic,
						  parts->elems[j].partition,
						  rd_kafka_err2str(
							  parts->elems[j].err));
					fails++;
				}
			}
			TEST_ASSERT(fails == 0, "See previous warnings\n");

			TEST_SAY("Waiting for %dms, should not receive any "
				 "messages during this time\n", pause_time);
			
			test_consumer_poll_no_msgs("silence.while.paused",
						   rk, testid, pause_time);

			TEST_SAY("Resuming %d partitions\n", parts->cnt);
			if ((err = rd_kafka_resume_partitions(rk, parts)))
				TEST_FAIL("Failed to resume: %s\n",
					  rd_kafka_err2str(err));

			/* Check per-partition errors */
			for (j = 0 ; j < parts->cnt ; j++) {
				if (parts->elems[j].err) {
					TEST_WARN("resume failure for "
						  "%s %"PRId32"]: %s\n",
						  parts->elems[j].topic,
						  parts->elems[j].partition,
						  rd_kafka_err2str(
							  parts->elems[j].err));
					fails++;
				}
			}
			TEST_ASSERT(fails == 0, "See previous warnings\n");

			rd_kafka_topic_partition_list_destroy(parts);
		}

		test_msgver_verify("all.msgs", &mv_all, TEST_MSGVER_ALL_PART,
				   0, msgcnt);
		test_msgver_clear(&mv_all);
		
		/* Should now not see any more messages. */
		test_consumer_poll_no_msgs("end.exp.no.msgs", rk, testid, 3000);
		
		test_consumer_close(rk);

		/* Hangs if bug isn't fixed */
		rd_kafka_destroy(rk);
	}

	rd_kafka_topic_partition_list_destroy(topics);
	rd_kafka_topic_conf_destroy(tconf);

        return 0;
}




int main_0026_consume_pause (int argc, char **argv) {
        int fails = 0;

        fails += consume_pause();

        if (fails > 0)
                TEST_FAIL("See %d previous error(s)\n", fails);

        return 0;
}
