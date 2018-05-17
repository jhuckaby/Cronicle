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
#include "rdkafka.h"

#include <stdarg.h>

/**
 * Various partitioner tests
 *
 * - Issue #797 - deadlock on failed partitioning
 */

int32_t my_invalid_partitioner (const rd_kafka_topic_t *rkt,
				const void *keydata, size_t keylen,
				int32_t partition_cnt,
				void *rkt_opaque,
				void *msg_opaque) {
	int32_t partition = partition_cnt + 10;
	TEST_SAYL(4, "partition \"%.*s\" to %"PRId32"\n",
		 (int)keylen, (const char *)keydata, partition);
	return partition;
}


/* FIXME: This doesn't seem to trigger the bug in #797.
 *        Still a useful test though. */
static void do_test_failed_partitioning (void) {
	rd_kafka_t *rk;
	rd_kafka_topic_t *rkt;
	rd_kafka_topic_conf_t *tconf;
	const char *topic = test_mk_topic_name(__FUNCTION__, 1);
	int i;

	test_conf_init(NULL, &tconf, 0);

	rk = test_create_producer();
	rd_kafka_topic_conf_set_partitioner_cb(tconf, my_invalid_partitioner);
	test_topic_conf_set(tconf, "message.timeout.ms",
                            tsprintf("%d", tmout_multip(10000)));
	rkt = rd_kafka_topic_new(rk, topic, tconf);
	TEST_ASSERT(rkt != NULL, "%s", rd_kafka_err2str(rd_kafka_last_error()));

	/* Produce some messages (to p 0) to create topic */
	test_produce_msgs(rk, rkt, 0, 0, 0, 100, NULL, 0);

	/* Now use partitioner */
	for (i = 0 ; i < 10000 ; i++) {
		rd_kafka_resp_err_t err = RD_KAFKA_RESP_ERR_NO_ERROR;
		if (rd_kafka_produce(rkt, RD_KAFKA_PARTITION_UA,
				     0, NULL, 0, NULL, 0, NULL) == -1)
			err = rd_kafka_last_error();
		if (err != RD_KAFKA_RESP_ERR__UNKNOWN_PARTITION)
			TEST_FAIL("produce(): "
				  "Expected UNKNOWN_PARTITION, got %s\n",
				  rd_kafka_err2str(err));
	}
	test_flush(rk, 5000);

	rd_kafka_topic_destroy(rkt);
	rd_kafka_destroy(rk);
}

int main_0048_partitioner (int argc, char **argv) {
	do_test_failed_partitioning();
	return 0;
}
