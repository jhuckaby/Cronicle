/*
 * librdkafka - Apache Kafka C library
 *
 * Copyright (c) 2012-2013, Magnus Edenhill
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


#define _CRT_RAND_S  // rand_s() on MSVC
#include <stdarg.h>
#include "test.h"
#include <signal.h>
#include <stdlib.h>
#include <stdio.h>


/* Typical include path would be <librdkafka/rdkafka.h>, but this program
 * is built from within the librdkafka source tree and thus differs. */
#include "rdkafka.h"

int test_level = 2;
int test_seed = 0;

char test_mode[64] = "bare";
static int  test_exit = 0;
static char test_topic_prefix[128] = "rdkafkatest";
static int  test_topic_random = 0;
       int  tests_running_cnt = 0;
static int  test_concurrent_max = 5;
int         test_assert_on_fail = 0;
double test_timeout_multiplier  = 1.0;
static char *test_sql_cmd = NULL;
int  test_session_timeout_ms = 6000;
int          test_broker_version;
static const char *test_broker_version_str = "0.9.0.0";
int          test_flags = 0;
int          test_neg_flags = TEST_F_KNOWN_ISSUE;
static const char *test_git_version = "HEAD";
static const char *test_sockem_conf = "";

static int show_summary = 1;
static int test_summary (int do_lock);

/**
 * Protects shared state, such as tests[]
 */
mtx_t test_mtx;

static const char *test_states[] = {
        "DNS",
        "SKIPPED",
        "RUNNING",
        "PASSED",
        "FAILED",
};



#define _TEST_DECL(NAME)                                                \
        extern int main_ ## NAME (int, char **)
#define _TEST(NAME,FLAGS,...)						\
        { .name = # NAME, .mainfunc = main_ ## NAME, .flags = FLAGS, __VA_ARGS__ }


/**
 * Declare all tests here
 */
_TEST_DECL(0000_unittests);
_TEST_DECL(0001_multiobj);
_TEST_DECL(0002_unkpart);
_TEST_DECL(0003_msgmaxsize);
_TEST_DECL(0004_conf);
_TEST_DECL(0005_order);
_TEST_DECL(0006_symbols);
_TEST_DECL(0007_autotopic);
_TEST_DECL(0008_reqacks);
_TEST_DECL(0011_produce_batch);
_TEST_DECL(0012_produce_consume);
_TEST_DECL(0013_null_msgs);
_TEST_DECL(0014_reconsume_191);
_TEST_DECL(0015_offsets_seek);
_TEST_DECL(0017_compression);
_TEST_DECL(0018_cgrp_term);
_TEST_DECL(0019_list_groups);
_TEST_DECL(0020_destroy_hang);
_TEST_DECL(0021_rkt_destroy);
_TEST_DECL(0022_consume_batch);
_TEST_DECL(0025_timers);
_TEST_DECL(0026_consume_pause);
_TEST_DECL(0028_long_topicnames);
_TEST_DECL(0029_assign_offset);
_TEST_DECL(0030_offset_commit);
_TEST_DECL(0031_get_offsets);
_TEST_DECL(0033_regex_subscribe);
_TEST_DECL(0033_regex_subscribe_local);
_TEST_DECL(0034_offset_reset);
_TEST_DECL(0035_api_version);
_TEST_DECL(0036_partial_fetch);
_TEST_DECL(0037_destroy_hang_local);
_TEST_DECL(0038_performance);
_TEST_DECL(0039_event);
_TEST_DECL(0040_io_event);
_TEST_DECL(0041_fetch_max_bytes);
_TEST_DECL(0042_many_topics);
_TEST_DECL(0043_no_connection);
_TEST_DECL(0044_partition_cnt);
_TEST_DECL(0045_subscribe_update);
_TEST_DECL(0045_subscribe_update_topic_remove);
_TEST_DECL(0045_subscribe_update_non_exist_and_partchange);
_TEST_DECL(0046_rkt_cache);
_TEST_DECL(0047_partial_buf_tmout);
_TEST_DECL(0048_partitioner);
_TEST_DECL(0049_consume_conn_close);
_TEST_DECL(0050_subscribe_adds);
_TEST_DECL(0051_assign_adds);
_TEST_DECL(0052_msg_timestamps);
_TEST_DECL(0053_stats_cb);
_TEST_DECL(0054_offset_time);
_TEST_DECL(0055_producer_latency);
_TEST_DECL(0056_balanced_group_mt);
_TEST_DECL(0057_invalid_topic);
_TEST_DECL(0058_log);
_TEST_DECL(0059_bsearch);
_TEST_DECL(0060_op_prio);
_TEST_DECL(0061_consumer_lag);
_TEST_DECL(0062_stats_event);
_TEST_DECL(0063_clusterid);
_TEST_DECL(0064_interceptors);
_TEST_DECL(0065_yield);
_TEST_DECL(0066_plugins);
_TEST_DECL(0067_empty_topic);
_TEST_DECL(0068_produce_timeout);
_TEST_DECL(0069_consumer_add_parts);
_TEST_DECL(0070_null_empty);


/* Manual tests */
_TEST_DECL(8000_idle);


/**
 * Define all tests here
 */
struct test tests[] = {
        /* Special MAIN test to hold over-all timings, etc. */
        { .name = "<MAIN>", .flags = TEST_F_LOCAL },
        _TEST(0000_unittests, TEST_F_LOCAL),
        _TEST(0001_multiobj, 0),
        _TEST(0002_unkpart, 0),
        _TEST(0003_msgmaxsize, 0),
        _TEST(0004_conf, TEST_F_LOCAL),
        _TEST(0005_order, 0),
        _TEST(0006_symbols, TEST_F_LOCAL),
        _TEST(0007_autotopic, 0),
        _TEST(0008_reqacks, 0),
        _TEST(0011_produce_batch, 0),
        _TEST(0012_produce_consume, 0),
        _TEST(0013_null_msgs, 0),
        _TEST(0014_reconsume_191, 0),
        _TEST(0015_offsets_seek, 0),
        _TEST(0017_compression, 0),
        _TEST(0018_cgrp_term, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0019_list_groups, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0020_destroy_hang, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0021_rkt_destroy, 0),
        _TEST(0022_consume_batch, 0),
        _TEST(0025_timers, TEST_F_LOCAL),
	_TEST(0026_consume_pause, 0, TEST_BRKVER(0,9,0,0)),
	_TEST(0028_long_topicnames, TEST_F_KNOWN_ISSUE, TEST_BRKVER(0,9,0,0),
	      .extra = "https://github.com/edenhill/librdkafka/issues/529"),
	_TEST(0029_assign_offset, 0),
	_TEST(0030_offset_commit, 0, TEST_BRKVER(0,9,0,0)),
	_TEST(0031_get_offsets, 0),
	_TEST(0033_regex_subscribe, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0033_regex_subscribe_local, TEST_F_LOCAL),
	_TEST(0034_offset_reset, 0),
	_TEST(0035_api_version, 0),
	_TEST(0036_partial_fetch, 0),
	_TEST(0037_destroy_hang_local, TEST_F_LOCAL),
	_TEST(0038_performance, 0),
	_TEST(0039_event, 0),
	_TEST(0040_io_event, 0, TEST_BRKVER(0,9,0,0)),
	_TEST(0041_fetch_max_bytes, 0),
	_TEST(0042_many_topics, 0),
	_TEST(0043_no_connection, TEST_F_LOCAL),
	_TEST(0044_partition_cnt, 0),
	_TEST(0045_subscribe_update, 0, TEST_BRKVER(0,9,0,0)),
	_TEST(0045_subscribe_update_topic_remove, TEST_F_KNOWN_ISSUE,
              TEST_BRKVER(0,9,0,0)),
        _TEST(0045_subscribe_update_non_exist_and_partchange, 0,
              TEST_BRKVER(0,9,0,0)),
	_TEST(0046_rkt_cache, TEST_F_LOCAL),
	_TEST(0047_partial_buf_tmout, TEST_F_KNOWN_ISSUE),
	_TEST(0048_partitioner, 0),
#if WITH_SOCKEM
        _TEST(0049_consume_conn_close, 0, TEST_BRKVER(0,9,0,0)),
#endif
        _TEST(0050_subscribe_adds, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0051_assign_adds, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0052_msg_timestamps, 0, TEST_BRKVER(0,10,0,0)),
        _TEST(0053_stats_cb, TEST_F_LOCAL),
        _TEST(0054_offset_time, 0, TEST_BRKVER(0,10,1,0)),
        _TEST(0055_producer_latency, TEST_F_KNOWN_ISSUE_WIN32),
        _TEST(0056_balanced_group_mt, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0057_invalid_topic, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0058_log, TEST_F_LOCAL),
        _TEST(0059_bsearch, 0, TEST_BRKVER(0,10,0,0)),
        _TEST(0060_op_prio, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0061_consumer_lag, 0),
        _TEST(0062_stats_event, TEST_F_LOCAL),
        _TEST(0063_clusterid, 0, TEST_BRKVER(0,10,1,0)),
        _TEST(0064_interceptors, 0, TEST_BRKVER(0,9,0,0)),
        _TEST(0065_yield, 0),
        _TEST(0066_plugins,
              TEST_F_LOCAL|TEST_F_KNOWN_ISSUE_WIN32|TEST_F_KNOWN_ISSUE_OSX,
              .extra = "dynamic loading of tests might not be fixed for this platform"),
        _TEST(0067_empty_topic, 0),
#if WITH_SOCKEM
        _TEST(0068_produce_timeout, 0),
#endif
        _TEST(0069_consumer_add_parts, TEST_F_KNOWN_ISSUE_WIN32,
              TEST_BRKVER(0,9,0,0)),
        _TEST(0070_null_empty, 0),

        /* Manual tests */
        _TEST(8000_idle, TEST_F_MANUAL),

        { NULL }
};


RD_TLS struct test *test_curr = &tests[0];



#if WITH_SOCKEM
/**
 * Socket network emulation with sockem
 */
 
static void test_socket_add (struct test *test, sockem_t *skm) {
        TEST_LOCK();
        rd_list_add(&test->sockets, skm);
        TEST_UNLOCK();
}

static void test_socket_del (struct test *test, sockem_t *skm, int do_lock) {
        void *p;
        if (do_lock)
                TEST_LOCK();
        p = rd_list_remove(&test->sockets, skm);
        assert(p);
        if (do_lock)
                TEST_UNLOCK();
}

void test_socket_close_all (struct test *test, int reinit) {
        TEST_LOCK();
        rd_list_destroy(&test->sockets);
        if (reinit)
                rd_list_init(&test->sockets, 16, (void *)sockem_close);
        TEST_UNLOCK();
}


static int test_connect_cb (int s, const struct sockaddr *addr,
                            int addrlen, const char *id, void *opaque) {
        struct test *test = opaque;
        sockem_t *skm;
        int r;

        skm = sockem_connect(s, addr, addrlen, test_sockem_conf, 0, NULL);
        if (!skm)
                return errno;

        if (test->connect_cb) {
                r = test->connect_cb(test, skm, id);
                if (r)
                        return r;
        }

        test_socket_add(test, skm);

        return 0;
}

static int test_closesocket_cb (int s, void *opaque) {
        struct test *test = opaque;
        sockem_t *skm;

        TEST_LOCK();
        skm = sockem_find(s);
        if (skm) {
                sockem_close(skm);
                test_socket_del(test, skm, 0/*nolock*/);
        } else {
#ifdef _MSC_VER
                closesocket(s);
#else
                close(s);
#endif
        }
        TEST_UNLOCK();

        return 0;
}


void test_socket_enable (rd_kafka_conf_t *conf) {
        rd_kafka_conf_set_connect_cb(conf, test_connect_cb);
        rd_kafka_conf_set_closesocket_cb(conf, test_closesocket_cb);
	rd_kafka_conf_set_opaque(conf, test_curr);
}
#endif /* WITH_SOCKEM */


static void test_error_cb (rd_kafka_t *rk, int err,
			   const char *reason, void *opaque) {
        if (test_curr->is_fatal_cb && !test_curr->is_fatal_cb(rk, err, reason))
                TEST_SAY(_C_YEL "rdkafka error (non-fatal): %s: %s\n",
                         rd_kafka_err2str(err), reason);
        else
                TEST_FAIL("rdkafka error: %s: %s",
                          rd_kafka_err2str(err), reason);
}

static int test_stats_cb (rd_kafka_t *rk, char *json, size_t json_len,
                           void *opaque) {
        struct test *test = test_curr;
        if (test->stats_fp)
                fprintf(test->stats_fp,
                        "{\"test\": \"%s\", \"instance\":\"%s\", "
                        "\"stats\": %s}\n",
                        test->name, rd_kafka_name(rk), json);
        return 0;
}


/**
 * @brief Limit the test run time (in seconds)
 */
void test_timeout_set (int timeout) {
	TEST_LOCK();
        TEST_SAY("Setting test timeout to %ds * %.1f\n",
		 timeout, test_timeout_multiplier);
	timeout = (int)((double)timeout * test_timeout_multiplier);
	test_curr->timeout = test_clock() + (timeout * 1000000);
	TEST_UNLOCK();
}

int tmout_multip (int msecs) {
        int r;
        TEST_LOCK();
        r = (int)(((double)(msecs)) * test_timeout_multiplier);
        TEST_UNLOCK();
        return r;
}



#ifdef _MSC_VER
static void test_init_win32 (void) {
        /* Enable VT emulation to support colored output. */
        HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
        DWORD dwMode = 0;

        if (hOut == INVALID_HANDLE_VALUE ||
            !GetConsoleMode(hOut, &dwMode))
                return;

#ifndef ENABLE_VIRTUAL_TERMINAL_PROCESSING
#define ENABLE_VIRTUAL_TERMINAL_PROCESSING 0x4
#endif
        dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
        SetConsoleMode(hOut, dwMode);
}
#endif


static void test_init (void) {
        int seed;
        const char *tmp;


        if (test_seed)
                return;

        if ((tmp = test_getenv("TEST_LEVEL", NULL)))
                test_level = atoi(tmp);
        if ((tmp = test_getenv("TEST_MODE", NULL)))
                strncpy(test_mode, tmp, sizeof(test_mode)-1);
        if ((tmp = test_getenv("TEST_SOCKEM", NULL)))
                test_sockem_conf = tmp;
        if ((tmp = test_getenv("TEST_SEED", NULL)))
                seed = atoi(tmp);
        else
                seed = test_clock() & 0xffffffff;
#ifdef _MSC_VER
        test_init_win32();
	{
		LARGE_INTEGER cycl;
		QueryPerformanceCounter(&cycl);
		seed = (int)cycl.QuadPart;
	}
#endif
	srand(seed);
	test_seed = seed;
}


const char *test_mk_topic_name (const char *suffix, int randomized) {
        static RD_TLS char ret[512];

        if (test_topic_random || randomized)
                rd_snprintf(ret, sizeof(ret), "%s_rnd%"PRIx64"_%s",
                         test_topic_prefix, test_id_generate(), suffix);
        else
                rd_snprintf(ret, sizeof(ret), "%s_%s", test_topic_prefix, suffix);

        TEST_SAY("Using topic \"%s\"\n", ret);

        return ret;
}


/**
 * @brief Set special test config property
 * @returns 1 if property was known, else 0.
 */
int test_set_special_conf (const char *name, const char *val, int *timeoutp) {
        if (!strcmp(name, "test.timeout.multiplier")) {
                TEST_LOCK();
                test_timeout_multiplier = strtod(val, NULL);
                TEST_UNLOCK();
                *timeoutp = tmout_multip((*timeoutp)*1000) / 1000;
        } else if (!strcmp(name, "test.topic.prefix")) {
                rd_snprintf(test_topic_prefix, sizeof(test_topic_prefix),
                            "%s", val);
        } else if (!strcmp(name, "test.topic.random")) {
                if (!strcmp(val, "true") ||
                    !strcmp(val, "1"))
                        test_topic_random = 1;
                else
                        test_topic_random = 0;
        } else if (!strcmp(name, "test.concurrent.max")) {
                TEST_LOCK();
                test_concurrent_max = (int)strtod(val, NULL);
                TEST_UNLOCK();
        } else if (!strcmp(name, "test.sql.command")) {
                TEST_LOCK();
                if (test_sql_cmd)
                        rd_free(test_sql_cmd);
                test_sql_cmd = rd_strdup(val);
                TEST_UNLOCK();
        } else
                return 0;

        return 1;
}

static void test_read_conf_file (const char *conf_path,
                                 rd_kafka_conf_t *conf,
                                 rd_kafka_topic_conf_t *topic_conf,
                                 int *timeoutp) {
        FILE *fp;
	char buf[512];
	int line = 0;

#ifndef _MSC_VER
	fp = fopen(conf_path, "r");
#else
	fp = NULL;
	errno = fopen_s(&fp, conf_path, "r");
#endif
	if (!fp) {
		if (errno == ENOENT) {
			TEST_SAY("Test config file %s not found\n", conf_path);
                        return;
		} else
			TEST_FAIL("Failed to read %s: %s",
				  conf_path, strerror(errno));
	}

	while (fgets(buf, sizeof(buf)-1, fp)) {
		char *t;
		char *b = buf;
		rd_kafka_conf_res_t res = RD_KAFKA_CONF_UNKNOWN;
		char *name, *val;
                char errstr[512];

		line++;
		if ((t = strchr(b, '\n')))
			*t = '\0';

		if (*b == '#' || !*b)
			continue;

		if (!(t = strchr(b, '=')))
			TEST_FAIL("%s:%i: expected name=value format\n",
				  conf_path, line);

		name = b;
		*t = '\0';
		val = t+1;

                if (test_set_special_conf(name, val, timeoutp))
                        continue;

                if (!strncmp(name, "topic.", strlen("topic."))) {
			name += strlen("topic.");
                        if (topic_conf)
                                res = rd_kafka_topic_conf_set(topic_conf,
                                                              name, val,
                                                              errstr,
                                                              sizeof(errstr));
                        else
                                res = RD_KAFKA_CONF_OK;
                        name -= strlen("topic.");
                }

                if (res == RD_KAFKA_CONF_UNKNOWN) {
                        if (conf)
                                res = rd_kafka_conf_set(conf,
                                                        name, val,
                                                        errstr, sizeof(errstr));
                        else
                                res = RD_KAFKA_CONF_OK;
                }

		if (res != RD_KAFKA_CONF_OK)
			TEST_FAIL("%s:%i: %s\n",
				  conf_path, line, errstr);
	}

	fclose(fp);
}

/**
 * @brief Get path to test config file
 */
const char *test_conf_get_path (void) {
        return test_getenv("RDKAFKA_TEST_CONF", "test.conf");
}

const char *test_getenv (const char *env, const char *def) {
#ifndef _MSC_VER
        const char *tmp;
        tmp = getenv(env);
        if (tmp && *tmp)
                return tmp;
        return def;
#else
        static RD_TLS char tmp[512];
        DWORD r;
        r = GetEnvironmentVariableA(env, tmp, sizeof(tmp));
        if (r == 0 || r > sizeof(tmp))
                return def;
        return tmp;
#endif
}

void test_conf_common_init (rd_kafka_conf_t *conf, int timeout) {
        if (conf) {
                const char *tmp = test_getenv("TEST_DEBUG", NULL);
                if (tmp)
                        test_conf_set(conf, "debug", tmp);
        }

        if (timeout)
                test_timeout_set(timeout);
}


/**
 * Creates and sets up kafka configuration objects.
 * Will read "test.conf" file if it exists.
 */
void test_conf_init (rd_kafka_conf_t **conf, rd_kafka_topic_conf_t **topic_conf,
                     int timeout) {
        const char *test_conf = test_conf_get_path();

        if (conf) {
                *conf = rd_kafka_conf_new();
                rd_kafka_conf_set(*conf, "client.id", test_curr->name, NULL, 0);
                rd_kafka_conf_set_error_cb(*conf, test_error_cb);
                rd_kafka_conf_set_stats_cb(*conf, test_stats_cb);

#ifdef SIGIO
		{
			char buf[64];

			/* Quick termination */
			rd_snprintf(buf, sizeof(buf), "%i", SIGIO);
			rd_kafka_conf_set(*conf, "internal.termination.signal",
					  buf, NULL, 0);
			signal(SIGIO, SIG_IGN);
		}
#endif
        }

#if WITH_SOCKEM
        if (*test_sockem_conf && conf)
                test_socket_enable(*conf);
#endif

	if (topic_conf)
		*topic_conf = rd_kafka_topic_conf_new();

	/* Open and read optional local test configuration file, if any. */
        test_read_conf_file(test_conf,
                            conf ? *conf : NULL,
                            topic_conf ? *topic_conf : NULL, &timeout);

        test_conf_common_init(conf ? *conf : NULL, timeout);
}


/**
 * Wait 'timeout' seconds for rdkafka to kill all its threads and clean up.
 */
void test_wait_exit (int timeout) {
	int r;
        time_t start = time(NULL);

	while ((r = rd_kafka_thread_cnt()) && timeout-- >= 0) {
		TEST_SAY("%i thread(s) in use by librdkafka, waiting...\n", r);
		rd_sleep(1);
	}

	TEST_SAY("%i thread(s) in use by librdkafka\n", r);

        if (r > 0)
                TEST_FAIL("%i thread(s) still active in librdkafka", r);

        timeout -= (int)(time(NULL) - start);
        if (timeout > 0) {
		TEST_SAY("Waiting %d seconds for all librdkafka memory "
			 "to be released\n", timeout);
                if (rd_kafka_wait_destroyed(timeout * 1000) == -1)
                        TEST_FAIL("Not all internal librdkafka "
                                  "objects destroyed\n");
	}
}


static RD_INLINE unsigned int test_rand(void) {
	unsigned int r;
#if _MSC_VER
	rand_s(&r);
#else
	r = rand();
#endif
	return r;
}
/**
 * Generate a "unique" test id.
 */
uint64_t test_id_generate (void) {
	return (((uint64_t)test_rand()) << 32) | (uint64_t)test_rand();
}


/**
 * Generate a "unique" string id
 */
char *test_str_id_generate (char *dest, size_t dest_size) {
        rd_snprintf(dest, dest_size, "%"PRId64, test_id_generate());
	return dest;
}

/**
 * Same as test_str_id_generate but returns a temporary string.
 */
const char *test_str_id_generate_tmp (void) {
	static RD_TLS char ret[64];
	return test_str_id_generate(ret, sizeof(ret));
}

/**
 * Format a message token.
 * Pad's to dest_size.
 */
void test_msg_fmt (char *dest, size_t dest_size,
                   uint64_t testid, int32_t partition, int msgid) {
        size_t of;

        of = rd_snprintf(dest, dest_size,
                         "testid=%"PRIu64", partition=%"PRId32", msg=%i",
                         testid, partition, msgid);
        if (of < dest_size - 1) {
                memset(dest+of, '!', dest_size-of);
                dest[dest_size-1] = '\0';
        }
}

/**
 * @brief Prepare message value and key for test produce.
 */
void test_prepare_msg (uint64_t testid, int32_t partition, int msg_id,
                       char *val, size_t val_size,
                       char *key, size_t key_size) {
        size_t of = 0;

        test_msg_fmt(key, key_size, testid, partition, msg_id);

        while (of < val_size) {
                /* Copy-repeat key into val until val_size */
                size_t len = RD_MIN(val_size-of, key_size);
                memcpy(val+of, key, len);
                of += len;
        }
}



/**
 * Parse a message token
 */
void test_msg_parse0 (const char *func, int line,
		      uint64_t testid, rd_kafka_message_t *rkmessage,
		      int32_t exp_partition, int *msgidp) {
	char buf[128];
	uint64_t in_testid;
	int in_part;

	if (!rkmessage->key)
		TEST_FAIL("%s:%i: Message (%s [%"PRId32"] @ %"PRId64") "
			  "has empty key\n",
			  func, line,
			  rd_kafka_topic_name(rkmessage->rkt),
			  rkmessage->partition, rkmessage->offset);

	rd_snprintf(buf, sizeof(buf), "%.*s", (int)rkmessage->key_len,
		    (char *)rkmessage->key);

	if (sscanf(buf, "testid=%"SCNu64", partition=%i, msg=%i",
		   &in_testid, &in_part, msgidp) != 3)
		TEST_FAIL("%s:%i: Incorrect key format: %s", func, line, buf);


	if (testid != in_testid ||
	    (exp_partition != -1 && exp_partition != in_part))
		TEST_FAIL("%s:%i: Our testid %"PRIu64", part %i did "
			  "not match message: \"%s\"\n",
		  func, line, testid, (int)exp_partition, buf);
}


struct run_args {
        struct test *test;
        int argc;
        char **argv;
};

static int run_test0 (struct run_args *run_args) {
        struct test *test = run_args->test;
	test_timing_t t_run;
	int r;
        char stats_file[256];

        rd_snprintf(stats_file, sizeof(stats_file), "stats_%s_%"PRIu64".json",
                    test->name, test_id_generate());
        if (!(test->stats_fp = fopen(stats_file, "w+")))
                TEST_SAY("=== Failed to create stats file %s: %s ===\n",
                         stats_file, strerror(errno));

	test_curr = test;

#if WITH_SOCKEM
        rd_list_init(&test->sockets, 16, (void *)sockem_close);
#endif

	TEST_SAY("================= Running test %s =================\n",
		 test->name);
        if (test->stats_fp)
                TEST_SAY("==== Stats written to file %s ====\n", stats_file);
	TIMING_START(&t_run, "%s", test->name);
        test->start = t_run.ts_start;
	r = test->mainfunc(run_args->argc, run_args->argv);
	TIMING_STOP(&t_run);

        TEST_LOCK();
        test->duration = TIMING_DURATION(&t_run);

	if (test->state == TEST_SKIPPED) {
		TEST_SAY("================= Test %s SKIPPED "
			 "=================\n",
                         run_args->test->name);
	} else if (r) {
                test->state = TEST_FAILED;
		TEST_SAY("\033[31m"
			 "================= Test %s FAILED ================="
			 "\033[0m\n",
                         run_args->test->name);
        } else {
                test->state = TEST_PASSED;
		TEST_SAY("\033[32m"
			 "================= Test %s PASSED ================="
			 "\033[0m\n",
                         run_args->test->name);
        }
        TEST_UNLOCK();

#if WITH_SOCKEM
        test_socket_close_all(test, 0);
#endif

        if (test->stats_fp) {
                long pos = ftell(test->stats_fp);
                fclose(test->stats_fp);
                test->stats_fp = NULL;
                /* Delete file if nothing was written */
                if (pos == 0) {
#ifndef _MSC_VER
                        unlink(stats_file);
#else
                        _unlink(stats_file);
#endif
                }
        }

	return r;
}




static int run_test_from_thread (void *arg) {
        struct run_args *run_args = arg;

	thrd_detach(thrd_current());

	run_test0(run_args);

        TEST_LOCK();
        tests_running_cnt--;
        TEST_UNLOCK();

        free(run_args);

        return 0;
}



static int run_test (struct test *test, int argc, char **argv) {
        struct run_args *run_args = calloc(1, sizeof(*run_args));
        int wait_cnt = 0;

        run_args->test = test;
        run_args->argc = argc;
        run_args->argv = argv;

        TEST_LOCK();
        while (tests_running_cnt >= test_concurrent_max) {
                if (!(wait_cnt++ % 10))
                        TEST_SAY("Too many tests running (%d >= %d): "
                                 "postponing %s start...\n",
                                 tests_running_cnt, test_concurrent_max,
                                 test->name);
                TEST_UNLOCK();
                rd_sleep(1);
                TEST_LOCK();
        }
        tests_running_cnt++;
        test->timeout = test_clock() + (int64_t)(20.0 * 1000000.0 *
                                                 test_timeout_multiplier);
        test->state = TEST_RUNNING;
        TEST_UNLOCK();

        if (thrd_create(&test->thrd, run_test_from_thread, run_args) !=
            thrd_success) {
                TEST_LOCK();
                tests_running_cnt--;
                test->state = TEST_FAILED;
                TEST_UNLOCK();

                TEST_FAIL("Failed to start thread for test %s\n",
                          test->name);
        }

        return 0;
}

static void run_tests (const char *tests_to_run,
                       int argc, char **argv) {
        struct test *test;

        for (test = tests ; test->name ; test++) {
                char testnum[128];
                char *t;
                const char *skip_reason = NULL;
		char tmp[128];

                if (!test->mainfunc)
                        continue;

                /* Extract test number, as string */
                strncpy(testnum, test->name, sizeof(testnum)-1);
                testnum[sizeof(testnum)-1] = '\0';
                if ((t = strchr(testnum, '_')))
                        *t = '\0';

                if ((test_flags && (test_flags & test->flags) != test_flags))
                        skip_reason = "filtered due to test flags";
		if ((test_neg_flags & ~test_flags) & test->flags)
			skip_reason = "Filtered due to negative test flags";
		if (test_broker_version &&
		    (test->minver > test_broker_version ||
		     (test->maxver && test->maxver < test_broker_version))) {
			rd_snprintf(tmp, sizeof(tmp),
				    "not applicable for broker "
				    "version %d.%d.%d.%d",
				    TEST_BRKVER_X(test_broker_version, 0),
				    TEST_BRKVER_X(test_broker_version, 1),
				    TEST_BRKVER_X(test_broker_version, 2),
				    TEST_BRKVER_X(test_broker_version, 3));
			skip_reason = tmp;
		}

                if (tests_to_run && !strstr(tests_to_run, testnum))
                        skip_reason = "not included in TESTS list";
                else if (!tests_to_run && (test->flags & TEST_F_MANUAL))
                        skip_reason = "manual test";

                if (!skip_reason) {
                        run_test(test, argc, argv);
                } else {
                        TEST_SAYL(3,
                                  "================= Skipping test %s (%s)"
                                  "================\n",
                                  test->name, skip_reason);
                        TEST_LOCK();
                        test->state = TEST_SKIPPED;
                        TEST_UNLOCK();
                }
        }


}

/**
 * @brief Print summary for all tests.
 *
 * @returns the number of failed tests.
 */
static int test_summary (int do_lock) {
        struct test *test;
        FILE *report_fp;
        char report_path[128];
        time_t t;
        struct tm *tm;
        char datestr[64];
        int64_t total_duration = 0;
        int tests_run = 0;
        int tests_failed = 0;
	int tests_failed_known = 0;
        int tests_passed = 0;
	FILE *sql_fp = NULL;
        const char *tmp;

        t = time(NULL);
        tm = localtime(&t);
        strftime(datestr, sizeof(datestr), "%Y%m%d%H%M%S", tm);

        if ((tmp = test_getenv("TEST_REPORT", NULL)))
                rd_snprintf(report_path, sizeof(report_path), "%s", tmp);
        else
                rd_snprintf(report_path, sizeof(report_path),
                            "test_report_%s.json", datestr);

        report_fp = fopen(report_path, "w+");
        if (!report_fp)
                TEST_WARN("Failed to create report file %s: %s\n",
                          report_path, strerror(errno));
        else
                fprintf(report_fp,
                        "{ \"id\": \"%s_%s\", \"mode\": \"%s\", "
			"\"date\": \"%s\", "
			"\"git_version\": \"%s\", "
			"\"broker_version\": \"%s\", "
			"\"tests\": {",
			datestr, test_mode, test_mode, datestr,
			test_git_version,
			test_broker_version_str);

        if (do_lock)
                TEST_LOCK();

	if (test_sql_cmd) {
#ifdef _MSC_VER
		sql_fp = _popen(test_sql_cmd, "w");
#else
		sql_fp = popen(test_sql_cmd, "w");
#endif

		fprintf(sql_fp,
			"CREATE TABLE IF NOT EXISTS "
			"runs(runid text PRIMARY KEY, mode text, "
			"date datetime, cnt int, passed int, failed int, "
			"duration numeric);\n"
			"CREATE TABLE IF NOT EXISTS "
			"tests(runid text, mode text, name text, state text, "
			"extra text, duration numeric);\n");
	}

	if (show_summary)
		printf("TEST %s (%s) SUMMARY\n"
		       "#==================================================================#\n",
		       datestr, test_mode);

        for (test = tests ; test->name ; test++) {
                const char *color;
                int64_t duration;
		char extra[128] = "";
		int do_count = 1;

                if (!(duration = test->duration) && test->start > 0)
                        duration = test_clock() - test->start;

                if (test == tests) {
			/* <MAIN> test:
			 * test accounts for total runtime.
			 * dont include in passed/run/failed counts. */
                        total_duration = duration;
			do_count = 0;
		}

                switch (test->state)
                {
                case TEST_PASSED:
                        color = _C_GRN;
			if (do_count) {
				tests_passed++;
				tests_run++;
			}
                        break;
                case TEST_FAILED:
			if (test->flags & TEST_F_KNOWN_ISSUE) {
				rd_snprintf(extra, sizeof(extra),
					    " <-- known issue%s%s",
					    test->extra ? ": " : "",
					    test->extra ? test->extra : "");
				if (do_count)
					tests_failed_known++;
			}
                        color = _C_RED;
			if (do_count) {
				tests_failed++;
				tests_run++;
			}
                        break;
                case TEST_RUNNING:
                        color = _C_MAG;
			if (do_count) {
				tests_failed++; /* All tests should be finished */
				tests_run++;
			}
                        break;
                case TEST_NOT_STARTED:
                        color = _C_YEL;
                        break;
                default:
                        color = _C_CYA;
                        break;
                }

		if (show_summary && test->state != TEST_SKIPPED)
			printf("|%s %-40s | %10s | %7.3fs %s|%s\n",
			       color,
			       test->name, test_states[test->state],
			       (double)duration/1000000.0, _C_CLR, extra);

                if (report_fp) {
			int i;
                        fprintf(report_fp,
                                "%s\"%s\": {"
                                "\"name\": \"%s\", "
                                "\"state\": \"%s\", "
				"\"known_issue\": %s, "
				"\"extra\": \"%s\", "
                                "\"duration\": %.3f, "
				"\"report\": [ ",
                                test == tests ? "": ", ",
				test->name,
                                test->name, test_states[test->state],
				test->flags & TEST_F_KNOWN_ISSUE ? "true":"false",
				test->extra ? test->extra : "",
                                (double)duration/1000000.0);

			for (i = 0 ; i < test->report_cnt ; i++) {
				fprintf(report_fp, "%s%s ",
					i == 0 ? "":",",
					test->report_arr[i]);
			}

			fprintf(report_fp, "] }");
		}

		if (sql_fp)
			fprintf(sql_fp,
				"INSERT INTO tests VALUES("
				"'%s_%s', '%s', '%s', '%s', '%s', %f);\n",
				datestr, test_mode, test_mode,
                                test->name, test_states[test->state],
				test->extra ? test->extra : "",
				(double)duration/1000000.0);
        }
        if (do_lock)
                TEST_UNLOCK();

	if (show_summary)
		printf("#==================================================================#\n");

        if (report_fp) {
                fprintf(report_fp,
                        "}, "
                        "\"tests_run\": %d, "
                        "\"tests_passed\": %d, "
                        "\"tests_failed\": %d, "
                        "\"duration\": %.3f"
                        "}\n",
                        tests_run, tests_passed, tests_failed,
                        (double)total_duration/1000000.0);

                fclose(report_fp);
                TEST_SAY("# Test report written to %s\n", report_path);
        }

	if (sql_fp) {
		fprintf(sql_fp,
			"INSERT INTO runs VALUES('%s_%s', '%s', datetime(), "
			"%d, %d, %d, %f);\n",
			datestr, test_mode, test_mode,
			tests_run, tests_passed, tests_failed,
			(double)total_duration/1000000.0);
		fclose(sql_fp);
	}

        return tests_failed - tests_failed_known;
}

#ifndef _MSC_VER
static void test_sig_term (int sig) {
	if (test_exit)
		exit(1);
	fprintf(stderr, "Exiting tests, waiting for running tests to finish.\n");
	test_exit = 1;
}
#endif

/**
 * @brief Test framework cleanup before termination.
 */
static void test_cleanup (void) {
	struct test *test;

	/* Free report arrays */
	for (test = tests ; test->name ; test++) {
		int i;
		if (!test->report_arr)
			continue;
		for (i = 0 ; i < test->report_cnt ; i++)
			rd_free(test->report_arr[i]);
		rd_free(test->report_arr);
		test->report_arr = NULL;
	}

	if (test_sql_cmd)
		rd_free(test_sql_cmd);
}


int main(int argc, char **argv) {
        const char *tests_to_run = NULL; /* all */
        int i, r;
	test_timing_t t_all;
	int a,b,c,d;

	mtx_init(&test_mtx, mtx_plain);

        test_init();

#ifndef _MSC_VER
        signal(SIGINT, test_sig_term);
#endif
        tests_to_run = test_getenv("TESTS", NULL);
        test_broker_version_str = test_getenv("TEST_KAFKA_VERSION",
                                              test_broker_version_str);
        test_git_version = test_getenv("RDKAFKA_GITVER", "HEAD");

	test_conf_init(NULL, NULL, 10);

        for (i = 1 ; i < argc ; i++) {
                if (!strncmp(argv[i], "-p", 2) && strlen(argv[i]) > 2)
                        test_concurrent_max = (int)strtod(argv[i]+2, NULL);
                else if (!strcmp(argv[i], "-l"))
                        test_flags |= TEST_F_LOCAL;
		else if (!strcmp(argv[i], "-L"))
                        test_neg_flags |= TEST_F_LOCAL;
                else if (!strcmp(argv[i], "-a"))
                        test_assert_on_fail = 1;
		else if (!strcmp(argv[i], "-k"))
			test_flags |= TEST_F_KNOWN_ISSUE;
		else if (!strcmp(argv[i], "-K"))
			test_neg_flags |= TEST_F_KNOWN_ISSUE;
		else if (!strcmp(argv[i], "-V") && i+1 < argc)
 			test_broker_version_str = argv[++i];
		else if (!strcmp(argv[i], "-S"))
			show_summary = 0;
		else if (*argv[i] != '-')
                        tests_to_run = argv[i];
                else {
                        printf("Unknown option: %s\n"
                               "\n"
                               "Usage: %s [options] [<test-match-substr>]\n"
                               "Options:\n"
                               "  -p<N>  Run N tests in parallel\n"
                               "  -l/-L  Only/dont run local tests (no broker needed)\n"
			       "  -k/-K  Only/dont run tests with known issues\n"
                               "  -a     Assert on failures\n"
			       "  -S     Dont show test summary\n"
			       "  -V <N.N.N.N> Broker version.\n"
			       "\n"
			       "Environment variables:\n"
			       "  TESTS - substring matched test to run (e.g., 0033)\n"
			       "  TEST_KAFKA_VERSION - broker version (e.g., 0.9.0.1)\n"
			       "  TEST_LEVEL - Test verbosity level\n"
			       "  TEST_MODE - bare, helgrind, valgrind\n"
			       "  TEST_SEED - random seed\n"
			       "  RDKAFKA_TEST_CONF - test config file (test.conf)\n"
			       "  KAFKA_PATH - Path to kafka source dir\n"
			       "  ZK_ADDRESS - Zookeeper address\n"
                               "\n",
                               argv[0], argv[i]);
                        exit(1);
                }
        }

	TEST_SAY("Git version: %s\n", test_git_version);

	if (!strcmp(test_broker_version_str, "trunk"))
		test_broker_version_str = "0.10.0.0"; /* for now */

	if (sscanf(test_broker_version_str, "%d.%d.%d.%d",
		   &a, &b, &c, &d) != 4) {
		printf("%% Expected broker version to be in format "
		       "N.N.N.N (N=int), not %s\n",
		       test_broker_version_str);
		exit(1);
	}
	test_broker_version = TEST_BRKVER(a, b, c, d);
	TEST_SAY("Broker version: %s (%d.%d.%d.%d)\n",
		 test_broker_version_str,
		 TEST_BRKVER_X(test_broker_version, 0),
		 TEST_BRKVER_X(test_broker_version, 1),
		 TEST_BRKVER_X(test_broker_version, 2),
		 TEST_BRKVER_X(test_broker_version, 3));

	/* Set up fake "<MAIN>" test for all operations performed in
	 * the main thread rather than the per-test threads.
	 * Nice side effect is that we get timing and status for main as well.*/
        test_curr = &tests[0];
        test_curr->state = TEST_PASSED;
        test_curr->start = test_clock();

	if (!strcmp(test_mode, "helgrind") ||
	    !strcmp(test_mode, "drd")) {
		TEST_LOCK();
		test_timeout_multiplier += 5;
		TEST_UNLOCK();
	} else if (!strcmp(test_mode, "valgrind")) {
		TEST_LOCK();
		test_timeout_multiplier += 3;
		TEST_UNLOCK();
	}

        /* Broker version 0.9 and api.version.request=true (which is default)
         * will cause a 10s stall per connection. Instead of fixing
         * that for each affected API in every test we increase the timeout
         * multiplier accordingly instead. The typical consume timeout is 5
         * seconds, so a multiplier of 3 should be good. */
        if ((test_broker_version & 0xffff0000) == 0x00090000)
                test_timeout_multiplier += 3;

        test_timeout_multiplier += (double)test_concurrent_max / 3;

	TEST_SAY("Tests to run: %s\n", tests_to_run ? tests_to_run : "all");
	TEST_SAY("Test mode   : %s\n", test_mode);
        TEST_SAY("Test filter : %s\n",
                 (test_flags & TEST_F_LOCAL) ? "local tests only" : "no filter");
        TEST_SAY("Test timeout multiplier: %.1f\n", test_timeout_multiplier);
        TEST_SAY("Action on test failure: %s\n",
                 test_assert_on_fail ? "assert crash" : "continue other tests");

        test_timeout_set(20);

        TIMING_START(&t_all, "ALL-TESTS");

	/* Run tests */
        run_tests(tests_to_run, argc, argv);

        TEST_LOCK();
        while (tests_running_cnt > 0 && !test_exit) {
                struct test *test;
		int64_t now = test_clock();

                TEST_SAY("%d test(s) running:", tests_running_cnt);
                for (test = tests ; test->name ; test++) {
                        if (test->state != TEST_RUNNING)
				continue;

			if (test_level >= 2)
				TEST_SAY0(" %s", test->name);

			/* Timeout check */
			if (now > test->timeout) {
                                struct test *save_test = test_curr;
                                test_curr = test;
				test->state = TEST_FAILED;
				test_summary(0/*no-locks*/);
                                TEST_FAIL0(__FILE__,__LINE__,0/*nolock*/,
                                           0/*fail-later*/,
                                           "Test %s timed out "
                                           "(timeout set to %d seconds)\n",
                                           test->name,
                                           (int)(test->timeout-
                                                 test->start)/
                                           1000000);
                                test_curr = save_test;
                                tests_running_cnt--; /* fail-later misses this*/
#ifdef _MSC_VER
                                TerminateThread(test->thrd, -1);
#else
                                pthread_kill(test->thrd, SIGKILL);
#endif
                        }
		}
		if (test_level >= 2)
			TEST_SAY0("\n");
                TEST_UNLOCK();

                rd_sleep(1);
                TEST_LOCK();
        }

	TIMING_STOP(&t_all);

        test_curr = &tests[0];
        test_curr->duration = test_clock() - test_curr->start;

        TEST_UNLOCK();

        /* Wait for everything to be cleaned up since broker destroys are
	 * handled in its own thread. */
	test_wait_exit(0);

	r = test_summary(1/*lock*/) ? 1 : 0;

	/* If we havent failed at this point then
	 * there were no threads leaked */
        if (r == 0)
                TEST_SAY("\n============== ALL TESTS PASSED ==============\n");

	test_cleanup();

	if (r > 0)
		TEST_FAIL("%d test(s) failed, see previous errors", r);

	return r;
}





/******************************************************************************
 *
 * Helpers
 *
 ******************************************************************************/

void test_dr_cb (rd_kafka_t *rk, void *payload, size_t len,
                 rd_kafka_resp_err_t err, void *opaque, void *msg_opaque) {
	int *remainsp = msg_opaque;

	if (err != RD_KAFKA_RESP_ERR_NO_ERROR)
		TEST_FAIL("Message delivery failed: %s\n",
			  rd_kafka_err2str(err));

	if (*remainsp == 0)
		TEST_FAIL("Too many messages delivered (remains %i)",
			  *remainsp);

	(*remainsp)--;
}


rd_kafka_t *test_create_handle (int mode, rd_kafka_conf_t *conf) {
	rd_kafka_t *rk;
	char errstr[512];

        if (!conf) {
                test_conf_init(&conf, NULL, 0);
#if WITH_SOCKEM
                if (*test_sockem_conf)
                        test_socket_enable(conf);
#endif
        } else {
                test_conf_set(conf, "client.id", test_curr->name);
        }



	/* Creat kafka instance */
	rk = rd_kafka_new(mode, conf, errstr, sizeof(errstr));
	if (!rk)
		TEST_FAIL("Failed to create rdkafka instance: %s\n", errstr);

	TEST_SAY("Created    kafka instance %s\n", rd_kafka_name(rk));

	return rk;
}


rd_kafka_t *test_create_producer (void) {
	rd_kafka_conf_t *conf;

	test_conf_init(&conf, NULL, 0);
	rd_kafka_conf_set_dr_cb(conf, test_dr_cb);

	return test_create_handle(RD_KAFKA_PRODUCER, conf);
}


/**
 * Create topic_t object with va-arg list as key-value config pairs
 * terminated by NULL.
 */
rd_kafka_topic_t *test_create_topic_object (rd_kafka_t *rk,
					    const char *topic, ...) {
	rd_kafka_topic_t *rkt;
	rd_kafka_topic_conf_t *topic_conf;
	va_list ap;
	const char *name, *val;

	test_conf_init(NULL, &topic_conf, 0);

	va_start(ap, topic);
	while ((name = va_arg(ap, const char *)) &&
	       (val = va_arg(ap, const char *))) {
                test_topic_conf_set(topic_conf, name, val);
	}
	va_end(ap);

	rkt = rd_kafka_topic_new(rk, topic, topic_conf);
	if (!rkt)
		TEST_FAIL("Failed to create topic: %s\n",
                          rd_kafka_err2str(rd_kafka_last_error()));

	return rkt;

}


rd_kafka_topic_t *test_create_producer_topic (rd_kafka_t *rk,
	const char *topic, ...) {
	rd_kafka_topic_t *rkt;
	rd_kafka_topic_conf_t *topic_conf;
	char errstr[512];
	va_list ap;
	const char *name, *val;

	test_conf_init(NULL, &topic_conf, 0);

	va_start(ap, topic);
	while ((name = va_arg(ap, const char *)) &&
	       (val = va_arg(ap, const char *))) {
		if (rd_kafka_topic_conf_set(topic_conf, name, val,
			errstr, sizeof(errstr)) != RD_KAFKA_CONF_OK)
			TEST_FAIL("Conf failed: %s\n", errstr);
	}
	va_end(ap);

	/* Make sure all replicas are in-sync after producing
	 * so that consume test wont fail. */
        rd_kafka_topic_conf_set(topic_conf, "request.required.acks", "-1",
                                errstr, sizeof(errstr));


	rkt = rd_kafka_topic_new(rk, topic, topic_conf);
	if (!rkt)
		TEST_FAIL("Failed to create topic: %s\n",
                          rd_kafka_err2str(rd_kafka_last_error()));

	return rkt;

}



/**
 * Produces \p cnt messages and returns immediately.
 * Does not wait for delivery.
 * \p msgcounterp is incremented for each produced messages and passed
 * as \p msg_opaque which is later used in test_dr_cb to decrement
 * the counter on delivery.
 *
 * If \p payload is NULL the message key and payload will be formatted
 * according to standard test format, otherwise the key will be NULL and
 * payload send as message payload.
 *
 * Default message size is 128 bytes, if \p size is non-zero and \p payload
 * is NULL the message size of \p size will be used.
 */
void test_produce_msgs_nowait (rd_kafka_t *rk, rd_kafka_topic_t *rkt,
                               uint64_t testid, int32_t partition,
                               int msg_base, int cnt,
                               const char *payload, size_t size,
                               int *msgcounterp) {
	int msg_id;
	test_timing_t t_all;
	char key[128];
	void *buf;
	int64_t tot_bytes = 0;

	if (payload)
		buf = (void *)payload;
	else {
		if (size == 0)
			size = 128;
		buf = calloc(1, size);
	}

	TEST_SAY("Produce to %s [%"PRId32"]: messages #%d..%d\n",
		 rd_kafka_topic_name(rkt), partition, msg_base, msg_base+cnt);

	TIMING_START(&t_all, "PRODUCE");

	for (msg_id = msg_base ; msg_id < msg_base + cnt ; msg_id++) {
                if (!payload)
                        test_prepare_msg(testid, partition, msg_id,
                                         buf, size, key, sizeof(key));


		if (rd_kafka_produce(rkt, partition,
				     RD_KAFKA_MSG_F_COPY,
				     buf, size,
				     !payload ? key : NULL,
				     !payload ? strlen(key) : 0,
				     msgcounterp) == -1)
			TEST_FAIL("Failed to produce message %i "
				  "to partition %i: %s",
				  msg_id, (int)partition,
                                  rd_kafka_err2str(rd_kafka_last_error()));

                (*msgcounterp)++;
		tot_bytes += size;

		rd_kafka_poll(rk, 0);

		if (TIMING_EVERY(&t_all, 3*1000000))
			TEST_SAY("produced %3d%%: %d/%d messages "
				 "(%d msgs/s, %d bytes/s)\n",
				 ((msg_id - msg_base) * 100) / cnt,
				 msg_id - msg_base, cnt,
				 (int)((msg_id - msg_base) /
				       (TIMING_DURATION(&t_all) / 1000000)),
				 (int)((tot_bytes) /
				       (TIMING_DURATION(&t_all) / 1000000)));
        }

	if (!payload)
		free(buf);

	TIMING_STOP(&t_all);
}

/**
 * Waits for the messages tracked by counter \p msgcounterp to be delivered.
 */
void test_wait_delivery (rd_kafka_t *rk, int *msgcounterp) {
	test_timing_t t_all;
        int start_cnt = *msgcounterp;

        TIMING_START(&t_all, "PRODUCE.DELIVERY.WAIT");

	/* Wait for messages to be delivered */
	while (*msgcounterp > 0 && rd_kafka_outq_len(rk) > 0) {
		rd_kafka_poll(rk, 10);
                if (TIMING_EVERY(&t_all, 3*1000000)) {
                        int delivered = start_cnt - *msgcounterp;
                        TEST_SAY("wait_delivery: "
                                 "%d/%d messages delivered: %d msgs/s\n",
                                 delivered, start_cnt,
                                 (int)(delivered /
                                       (TIMING_DURATION(&t_all) / 1000000)));
                }
        }

	TIMING_STOP(&t_all);

}

/**
 * Produces \p cnt messages and waits for succesful delivery
 */
void test_produce_msgs (rd_kafka_t *rk, rd_kafka_topic_t *rkt,
                        uint64_t testid, int32_t partition,
                        int msg_base, int cnt,
			const char *payload, size_t size) {
	int remains = 0;

        test_produce_msgs_nowait(rk, rkt, testid, partition, msg_base, cnt,
                                 payload, size, &remains);

        test_wait_delivery(rk, &remains);
}



/**
 * Create producer, produce \p msgcnt messages to \p topic \p partition,
 * destroy consumer, and returns the used testid.
 */
uint64_t
test_produce_msgs_easy (const char *topic, uint64_t testid,
                        int32_t partition, int msgcnt) {
        rd_kafka_t *rk;
        rd_kafka_topic_t *rkt;
        test_timing_t t_produce;

        if (!testid)
                testid = test_id_generate();
        rk = test_create_producer();
        rkt = test_create_producer_topic(rk, topic, NULL);

        TIMING_START(&t_produce, "PRODUCE");
        test_produce_msgs(rk, rkt, testid, partition, 0, msgcnt, NULL, 0);
        TIMING_STOP(&t_produce);
        rd_kafka_topic_destroy(rkt);
        rd_kafka_destroy(rk);

        return testid;
}


rd_kafka_t *test_create_consumer (const char *group_id,
				  void (*rebalance_cb) (
					  rd_kafka_t *rk,
					  rd_kafka_resp_err_t err,
					  rd_kafka_topic_partition_list_t
					  *partitions,
					  void *opaque),
				  rd_kafka_conf_t *conf,
                                  rd_kafka_topic_conf_t *default_topic_conf) {
	rd_kafka_t *rk;
	char tmp[64];

	if (!conf)
		test_conf_init(&conf, NULL, 0);

        if (group_id) {
		test_conf_set(conf, "group.id", group_id);

		rd_snprintf(tmp, sizeof(tmp), "%d", test_session_timeout_ms);
		test_conf_set(conf, "session.timeout.ms", tmp);

		if (rebalance_cb)
			rd_kafka_conf_set_rebalance_cb(conf, rebalance_cb);
	} else {
		TEST_ASSERT(!rebalance_cb);
	}

        if (default_topic_conf)
                rd_kafka_conf_set_default_topic_conf(conf, default_topic_conf);

	/* Create kafka instance */
	rk = test_create_handle(RD_KAFKA_CONSUMER, conf);

	if (group_id)
		rd_kafka_poll_set_consumer(rk);

	return rk;
}

rd_kafka_topic_t *test_create_consumer_topic (rd_kafka_t *rk,
                                              const char *topic) {
	rd_kafka_topic_t *rkt;
	rd_kafka_topic_conf_t *topic_conf;

	test_conf_init(NULL, &topic_conf, 0);

	rkt = rd_kafka_topic_new(rk, topic, topic_conf);
	if (!rkt)
		TEST_FAIL("Failed to create topic: %s\n",
                          rd_kafka_err2str(rd_kafka_last_error()));

	return rkt;
}


void test_consumer_start (const char *what,
                          rd_kafka_topic_t *rkt, int32_t partition,
                          int64_t start_offset) {

	TEST_SAY("%s: consumer_start: %s [%"PRId32"] at offset %"PRId64"\n",
		 what, rd_kafka_topic_name(rkt), partition, start_offset);

	if (rd_kafka_consume_start(rkt, partition, start_offset) == -1)
		TEST_FAIL("%s: consume_start failed: %s\n",
			  what, rd_kafka_err2str(rd_kafka_last_error()));
}

void test_consumer_stop (const char *what,
                         rd_kafka_topic_t *rkt, int32_t partition) {

	TEST_SAY("%s: consumer_stop: %s [%"PRId32"]\n",
		 what, rd_kafka_topic_name(rkt), partition);

	if (rd_kafka_consume_stop(rkt, partition) == -1)
		TEST_FAIL("%s: consume_stop failed: %s\n",
			  what, rd_kafka_err2str(rd_kafka_last_error()));
}

void test_consumer_seek (const char *what, rd_kafka_topic_t *rkt,
                         int32_t partition, int64_t offset) {
	int err;

	TEST_SAY("%s: consumer_seek: %s [%"PRId32"] to offset %"PRId64"\n",
		 what, rd_kafka_topic_name(rkt), partition, offset);

	if ((err = rd_kafka_seek(rkt, partition, offset, 2000)))
		TEST_FAIL("%s: consume_seek(%s, %"PRId32", %"PRId64") "
			  "failed: %s\n",
			  what,
			  rd_kafka_topic_name(rkt), partition, offset,
			  rd_kafka_err2str(err));
}



/**
 * Returns offset of the last message consumed
 */
int64_t test_consume_msgs (const char *what, rd_kafka_topic_t *rkt,
                           uint64_t testid, int32_t partition, int64_t offset,
                           int exp_msg_base, int exp_cnt, int parse_fmt) {
	int cnt = 0;
	int msg_next = exp_msg_base;
	int fails = 0;
	int64_t offset_last = -1;
	int64_t tot_bytes = 0;
	test_timing_t t_first, t_all;

	TEST_SAY("%s: consume_msgs: %s [%"PRId32"]: expect msg #%d..%d "
		 "at offset %"PRId64"\n",
		 what, rd_kafka_topic_name(rkt), partition,
		 exp_msg_base, exp_msg_base+exp_cnt, offset);

	if (offset != TEST_NO_SEEK) {
		rd_kafka_resp_err_t err;
		test_timing_t t_seek;

		TIMING_START(&t_seek, "SEEK");
		if ((err = rd_kafka_seek(rkt, partition, offset, 5000)))
			TEST_FAIL("%s: consume_msgs: %s [%"PRId32"]: "
				  "seek to %"PRId64" failed: %s\n",
				  what, rd_kafka_topic_name(rkt), partition,
				  offset, rd_kafka_err2str(err));
		TIMING_STOP(&t_seek);
		TEST_SAY("%s: seeked to offset %"PRId64"\n", what, offset);
	}

	TIMING_START(&t_first, "FIRST MSG");
	TIMING_START(&t_all, "ALL MSGS");

	while (cnt < exp_cnt) {
		rd_kafka_message_t *rkmessage;
		int msg_id;

                rkmessage = rd_kafka_consume(rkt, partition,
                                             tmout_multip(5000));

		if (TIMING_EVERY(&t_all, 3*1000000))
			TEST_SAY("%s: "
				 "consumed %3d%%: %d/%d messages "
				 "(%d msgs/s, %d bytes/s)\n",
				 what, cnt * 100 / exp_cnt, cnt, exp_cnt,
				 (int)(cnt /
				       (TIMING_DURATION(&t_all) / 1000000)),
				 (int)(tot_bytes /
				       (TIMING_DURATION(&t_all) / 1000000)));

		if (!rkmessage)
			TEST_FAIL("%s: consume_msgs: %s [%"PRId32"]: "
				  "expected msg #%d (%d/%d): timed out\n",
				  what, rd_kafka_topic_name(rkt), partition,
				  msg_next, cnt, exp_cnt);

		if (rkmessage->err)
			TEST_FAIL("%s: consume_msgs: %s [%"PRId32"]: "
				  "expected msg #%d (%d/%d): got error: %s\n",
				  what, rd_kafka_topic_name(rkt), partition,
				  msg_next, cnt, exp_cnt,
				  rd_kafka_err2str(rkmessage->err));

		if (cnt == 0)
			TIMING_STOP(&t_first);

		if (parse_fmt)
			test_msg_parse(testid, rkmessage, partition, &msg_id);
		else
			msg_id = 0;

		if (test_level >= 3)
			TEST_SAY("%s: consume_msgs: %s [%"PRId32"]: "
				 "got msg #%d at offset %"PRId64
				 " (expect #%d at offset %"PRId64")\n",
				 what, rd_kafka_topic_name(rkt), partition,
				 msg_id, rkmessage->offset,
				 msg_next,
				 offset >= 0 ? offset + cnt : -1);

		if (parse_fmt && msg_id != msg_next) {
			TEST_SAY("%s: consume_msgs: %s [%"PRId32"]: "
				 "expected msg #%d (%d/%d): got msg #%d\n",
				 what, rd_kafka_topic_name(rkt), partition,
				 msg_next, cnt, exp_cnt, msg_id);
			fails++;
		}

		cnt++;
		tot_bytes += rkmessage->len;
		msg_next++;
		offset_last = rkmessage->offset;

		rd_kafka_message_destroy(rkmessage);
	}

	TIMING_STOP(&t_all);

	if (fails)
		TEST_FAIL("%s: consume_msgs: %s [%"PRId32"]: %d failures\n",
			  what, rd_kafka_topic_name(rkt), partition, fails);

	TEST_SAY("%s: consume_msgs: %s [%"PRId32"]: "
		 "%d/%d messages consumed succesfully\n",
		 what, rd_kafka_topic_name(rkt), partition,
		 cnt, exp_cnt);
	return offset_last;
}


/**
 * Create high-level consumer subscribing to \p topic from BEGINNING
 * and expects \d exp_msgcnt with matching \p testid
 * Destroys consumer when done.
 *
 * If \p group_id is NULL a new unique group is generated
 */
void
test_consume_msgs_easy_mv (const char *group_id, const char *topic,
                           uint64_t testid, int exp_eofcnt, int exp_msgcnt,
                           rd_kafka_topic_conf_t *tconf,
                           test_msgver_t *mv) {
        rd_kafka_t *rk;
        char grpid0[64];

        if (!tconf)
                test_conf_init(NULL, &tconf, 0);

        if (!group_id)
                group_id = test_str_id_generate(grpid0, sizeof(grpid0));

        test_topic_conf_set(tconf, "auto.offset.reset", "smallest");
        rk = test_create_consumer(group_id, NULL, NULL, tconf);

        rd_kafka_poll_set_consumer(rk);

        TEST_SAY("Subscribing to topic %s in group %s "
                 "(expecting %d msgs with testid %"PRIu64")\n",
                 topic, group_id, exp_msgcnt, testid);

        test_consumer_subscribe(rk, topic);

        /* Consume messages */
        test_consumer_poll("consume.easy", rk, testid, exp_eofcnt,
                           -1, exp_msgcnt, mv);

        test_consumer_close(rk);

        rd_kafka_destroy(rk);
}

void
test_consume_msgs_easy (const char *group_id, const char *topic,
                        uint64_t testid, int exp_eofcnt, int exp_msgcnt,
                        rd_kafka_topic_conf_t *tconf) {
        test_msgver_t mv;

        test_msgver_init(&mv, testid);

        test_consume_msgs_easy_mv(group_id, topic, testid, exp_eofcnt,
                                  exp_msgcnt, tconf, &mv);

        test_msgver_clear(&mv);
}


/**
 * @brief Start subscribing for 'topic'
 */
void test_consumer_subscribe (rd_kafka_t *rk, const char *topic) {
        rd_kafka_topic_partition_list_t *topics;
	rd_kafka_resp_err_t err;

	topics = rd_kafka_topic_partition_list_new(1);
        rd_kafka_topic_partition_list_add(topics, topic,
					  RD_KAFKA_PARTITION_UA);

        err = rd_kafka_subscribe(rk, topics);
        if (err)
                TEST_FAIL("Failed to subscribe to %s: %s\n",
                          topic, rd_kafka_err2str(err));

        rd_kafka_topic_partition_list_destroy(topics);
}


void test_consumer_assign (const char *what, rd_kafka_t *rk,
			   rd_kafka_topic_partition_list_t *partitions) {
        rd_kafka_resp_err_t err;
        test_timing_t timing;

        TIMING_START(&timing, "ASSIGN.PARTITIONS");
        err = rd_kafka_assign(rk, partitions);
        TIMING_STOP(&timing);
        if (err)
                TEST_FAIL("%s: failed to assign %d partition(s): %s\n",
			  what, partitions->cnt, rd_kafka_err2str(err));
        else
                TEST_SAY("%s: assigned %d partition(s)\n",
			 what, partitions->cnt);
}


void test_consumer_unassign (const char *what, rd_kafka_t *rk) {
        rd_kafka_resp_err_t err;
        test_timing_t timing;

        TIMING_START(&timing, "UNASSIGN.PARTITIONS");
        err = rd_kafka_assign(rk, NULL);
        TIMING_STOP(&timing);
        if (err)
                TEST_FAIL("%s: failed to unassign current partitions: %s\n",
                          what, rd_kafka_err2str(err));
        else
                TEST_SAY("%s: unassigned current partitions\n", what);
}




/**
 * Message verification services
 *
 */

void test_msgver_init (test_msgver_t *mv, uint64_t testid) {
	memset(mv, 0, sizeof(*mv));
	mv->testid = testid;
	/* Max warning logs before suppressing. */
	mv->log_max = (test_level + 1) * 100;
}

#define TEST_MV_WARN(mv,...) do {			\
		if ((mv)->log_cnt++ > (mv)->log_max)	\
			(mv)->log_suppr_cnt++;		\
		else					\
			TEST_WARN(__VA_ARGS__);		\
	} while (0)
			


static void test_mv_mvec_grow (struct test_mv_mvec *mvec, int tot_size) {
	if (tot_size <= mvec->size)
		return;
	mvec->size = tot_size;
	mvec->m = realloc(mvec->m, sizeof(*mvec->m) * mvec->size);
}

/**
 * Make sure there is room for at least \p cnt messages, else grow mvec.
 */
static void test_mv_mvec_reserve (struct test_mv_mvec *mvec, int cnt) {
	test_mv_mvec_grow(mvec, mvec->cnt + cnt);
}

void test_mv_mvec_init (struct test_mv_mvec *mvec, int exp_cnt) {
	TEST_ASSERT(mvec->m == NULL, "mvec not cleared");

	if (!exp_cnt)
		return;

	test_mv_mvec_grow(mvec, exp_cnt);
}


void test_mv_mvec_clear (struct test_mv_mvec *mvec) {
	if (mvec->m)
		free(mvec->m);
}

void test_msgver_clear (test_msgver_t *mv) {
	int i;
	for (i = 0 ; i < mv->p_cnt ; i++) {
		struct test_mv_p *p = mv->p[i];
		free(p->topic);
		test_mv_mvec_clear(&p->mvec);
		free(p);
	}

	free(mv->p);

	test_msgver_init(mv, mv->testid);
}

struct test_mv_p *test_msgver_p_get (test_msgver_t *mv, const char *topic,
				     int32_t partition, int do_create) {
	int i;
	struct test_mv_p *p;

	for (i = 0 ; i < mv->p_cnt ; i++) {
		p = mv->p[i];
		if (p->partition == partition && !strcmp(p->topic, topic))
			return p;
	}

	if (!do_create)
		TEST_FAIL("Topic %s [%d] not found in msgver", topic, partition);

	if (mv->p_cnt == mv->p_size) {
		mv->p_size = (mv->p_size + 4) * 2;
		mv->p = realloc(mv->p, sizeof(*mv->p) * mv->p_size);
	}

	mv->p[mv->p_cnt++] = p = calloc(1, sizeof(*p));

	p->topic = rd_strdup(topic);
	p->partition = partition;
	p->eof_offset = RD_KAFKA_OFFSET_INVALID;

	return p;
}


/**
 * Add (room for) message to message vector.
 * Resizes the vector as needed.
 */
static struct test_mv_m *test_mv_mvec_add (struct test_mv_mvec *mvec) {
	if (mvec->cnt == mvec->size) {
		test_mv_mvec_grow(mvec, (mvec->size ? mvec->size * 2 : 10000));
	}

	mvec->cnt++;

	return &mvec->m[mvec->cnt-1];
}

/**
 * Returns message at index \p mi
 */
static RD_INLINE struct test_mv_m *test_mv_mvec_get (struct test_mv_mvec *mvec,
						    int mi) {
	return &mvec->m[mi];
}

/**
 * Print message list to \p fp
 */
static RD_UNUSED
void test_mv_mvec_dump (FILE *fp, const struct test_mv_mvec *mvec) {
	int mi;

	fprintf(fp, "*** Dump mvec with %d messages (capacity %d): ***\n",
		mvec->cnt, mvec->size);
	for (mi = 0 ; mi < mvec->cnt ; mi++)
		fprintf(fp, "  msgid %d, offset %"PRId64"\n",
			mvec->m[mi].msgid, mvec->m[mi].offset);
	fprintf(fp, "*** Done ***\n");

}

static void test_mv_mvec_sort (struct test_mv_mvec *mvec,
			       int (*cmp) (const void *, const void *)) {
	qsort(mvec->m, mvec->cnt, sizeof(*mvec->m), cmp);
}


/**
 * Adds a message to the msgver service.
 *
 * Message must be a proper message or PARTITION_EOF.
 *
 * @returns 1 if message is from the expected testid, else 0 (not added).
 */
int test_msgver_add_msg0 (const char *func, int line,
			  test_msgver_t *mv, rd_kafka_message_t *rkmessage) {
	uint64_t in_testid;
	int in_part;
	int in_msgnum;
	char buf[128];
	struct test_mv_p *p;
	struct test_mv_m *m;

	if (rkmessage->err) {
		if (rkmessage->err != RD_KAFKA_RESP_ERR__PARTITION_EOF)
			return 0; /* Ignore error */

		in_testid = mv->testid;

	} else {
		rd_snprintf(buf, sizeof(buf), "%.*s",
			    (int)rkmessage->len, (char *)rkmessage->payload);

		if (sscanf(buf, "testid=%"SCNu64", partition=%i, msg=%i",
			   &in_testid, &in_part, &in_msgnum) != 3)
			TEST_FAIL("%s:%d: Incorrect format at offset %"PRId64
				  ": %s",
				  func, line, rkmessage->offset, buf);
	}

	if (mv->fwd)
		test_msgver_add_msg(mv->fwd, rkmessage);

	if (in_testid != mv->testid)
		return 0; /* Ignore message */

	p = test_msgver_p_get(mv, rd_kafka_topic_name(rkmessage->rkt),
			      rkmessage->partition, 1);

	if (rkmessage->err == RD_KAFKA_RESP_ERR__PARTITION_EOF) {
		p->eof_offset = rkmessage->offset;
		return 1;
	}

	m = test_mv_mvec_add(&p->mvec);

	m->offset = rkmessage->offset;
	m->msgid  = in_msgnum;
        m->timestamp = rd_kafka_message_timestamp(rkmessage, NULL);
	
	if (test_level > 2) {
		TEST_SAY("%s:%d: "
			 "Recv msg %s [%"PRId32"] offset %"PRId64" msgid %d "
                         "timestamp %"PRId64"\n",
			 func, line,
			 p->topic, p->partition, m->offset, m->msgid,
                         m->timestamp);
	}

	mv->msgcnt++;

        return 1;
}



/**
 * Verify that all messages were received in order.
 *
 * - Offsets need to occur without gaps
 * - msgids need to be increasing: but may have gaps, e.g., using partitioner)
 */
static int test_mv_mvec_verify_order (test_msgver_t *mv, int flags,
				      struct test_mv_p *p,
				      struct test_mv_mvec *mvec,
				      struct test_mv_vs *vs) {
	int mi;
	int fails = 0;

	for (mi = 1/*skip first*/ ; mi < mvec->cnt ; mi++) {
		struct test_mv_m *prev = test_mv_mvec_get(mvec, mi-1);
		struct test_mv_m *this = test_mv_mvec_get(mvec, mi);

		if (((flags & TEST_MSGVER_BY_OFFSET) &&
		     prev->offset + 1 != this->offset) ||
		    ((flags & TEST_MSGVER_BY_MSGID) &&
		     prev->msgid > this->msgid)) {
			TEST_MV_WARN(
				mv,
				" %s [%"PRId32"] msg rcvidx #%d/%d: "
				"out of order (prev vs this): "
				"offset %"PRId64" vs %"PRId64", "
				"msgid %d vs %d\n",
				p ? p->topic : "*",
				p ? p->partition : -1,
				mi, mvec->cnt,
				prev->offset, this->offset,
				prev->msgid, this->msgid);
			fails++;
		}
	}

	return fails;
}



static int test_mv_m_cmp_offset (const void *_a, const void *_b) {
	const struct test_mv_m *a = _a, *b = _b;

	return (int)(a->offset - b->offset);
}

static int test_mv_m_cmp_msgid (const void *_a, const void *_b) {
	const struct test_mv_m *a = _a, *b = _b;

	return a->msgid - b->msgid;
}


/**
 * Verify that there are no duplicate message.
 *
 * - Offsets are checked
 * - msgids are checked
 *
 * * NOTE: This sorts the message (.m) array, first by offset, then by msgid
 *         and leaves the message array sorted (by msgid)
 */
static int test_mv_mvec_verify_dup (test_msgver_t *mv, int flags,
				    struct test_mv_p *p,
				    struct test_mv_mvec *mvec,
				    struct test_mv_vs *vs) {
	int mi;
	int fails = 0;
	enum {
		_P_OFFSET,
		_P_MSGID
	} pass;

	for (pass = _P_OFFSET ; pass <= _P_MSGID ; pass++) {

		if (pass == _P_OFFSET) {
			if (!(flags & TEST_MSGVER_BY_OFFSET))
				continue;
			test_mv_mvec_sort(mvec, test_mv_m_cmp_offset);
		} else if (pass == _P_MSGID) {
			if (!(flags & TEST_MSGVER_BY_MSGID))
				continue;
			test_mv_mvec_sort(mvec, test_mv_m_cmp_msgid);
		}

		for (mi = 1/*skip first*/ ; mi < mvec->cnt ; mi++) {
			struct test_mv_m *prev = test_mv_mvec_get(mvec, mi-1);
			struct test_mv_m *this = test_mv_mvec_get(mvec, mi);
			int is_dup = 0;

			if (pass == _P_OFFSET)
				is_dup = prev->offset == this->offset;
			else if (pass == _P_MSGID)
				is_dup = prev->msgid == this->msgid;

			if (!is_dup)
				continue;

			TEST_MV_WARN(mv,
				     " %s [%"PRId32"] "
				     "duplicate msg (prev vs this): "
				     "offset %"PRId64" vs %"PRId64", "
				     "msgid %d vs %d\n",
				     p ? p->topic : "*",
				     p ? p->partition : -1,
				     prev->offset, this->offset,
				     prev->msgid,  this->msgid);
			fails++;
		}
	}

	return fails;
}



/**
 * Verify that \p mvec contains the expected range:
 *  - TEST_MSGVER_BY_MSGID: msgid within \p vs->msgid_min .. \p vs->msgid_max
 *  - TEST_MSGVER_BY_TIMESTAMP: timestamp with \p vs->timestamp_min .. _max
 *
 * * NOTE: TEST_MSGVER_BY_MSGID is required
 *
 * * NOTE: This sorts the message (.m) array by msgid
 *         and leaves the message array sorted (by msgid)
 */
static int test_mv_mvec_verify_range (test_msgver_t *mv, int flags,
                                      struct test_mv_p *p,
                                      struct test_mv_mvec *mvec,
                                      struct test_mv_vs *vs) {
        int mi;
        int fails = 0;
        int cnt = 0;
        int exp_cnt = vs->msgid_max - vs->msgid_min + 1;
        int skip_cnt = 0;

        if (!(flags & TEST_MSGVER_BY_MSGID))
                return 0;

        test_mv_mvec_sort(mvec, test_mv_m_cmp_msgid);

        //test_mv_mvec_dump(stdout, mvec);

        for (mi = 0 ; mi < mvec->cnt ; mi++) {
                struct test_mv_m *prev = mi ? test_mv_mvec_get(mvec, mi-1):NULL;
                struct test_mv_m *this = test_mv_mvec_get(mvec, mi);

                if (this->msgid < vs->msgid_min) {
                        skip_cnt++;
                        continue;
                } else if (this->msgid > vs->msgid_max)
                        break;

                if (flags & TEST_MSGVER_BY_TIMESTAMP) {
                        if (this->timestamp < vs->timestamp_min ||
                            this->timestamp > vs->timestamp_max) {
                                TEST_MV_WARN(
                                        mv,
                                        " %s [%"PRId32"] range check: "
                                        "msgid #%d (at mi %d): "
                                        "timestamp %"PRId64" outside "
                                        "expected range %"PRId64"..%"PRId64"\n",
                                        p ? p->topic : "*",
                                        p ? p->partition : -1,
                                        this->msgid, mi,
                                        this->timestamp,
                                        vs->timestamp_min, vs->timestamp_max);
                                fails++;
                        }
                }

                if (cnt++ == 0) {
                        if (this->msgid != vs->msgid_min) {
                                TEST_MV_WARN(mv,
                                             " %s [%"PRId32"] range check: "
                                             "first message #%d (at mi %d) "
                                             "is not first in "
                                             "expected range %d..%d\n",
                                             p ? p->topic : "*",
                                             p ? p->partition : -1,
                                             this->msgid, mi,
                                             vs->msgid_min, vs->msgid_max);
                                fails++;
                        }
                } else if (cnt > exp_cnt) {
                        TEST_MV_WARN(mv,
                                     " %s [%"PRId32"] range check: "
                                     "too many messages received (%d/%d) at "
                                     "msgid %d for expected range %d..%d\n",
                                     p ? p->topic : "*",
                                     p ? p->partition : -1,
                                     cnt, exp_cnt, this->msgid,
                                     vs->msgid_min, vs->msgid_max);
                        fails++;
                }

                if (!prev) {
                        skip_cnt++;
                        continue;
                }

                if (prev->msgid + 1 != this->msgid) {
                        TEST_MV_WARN(mv, " %s [%"PRId32"] range check: "
                                     " %d message(s) missing between "
                                     "msgid %d..%d in expected range %d..%d\n",
                                     p ? p->topic : "*",
                                     p ? p->partition : -1,
                                     this->msgid - prev->msgid - 1,
                                     prev->msgid+1, this->msgid-1,
                                     vs->msgid_min, vs->msgid_max);
                        fails++;
                }
        }

        if (cnt != exp_cnt) {
                TEST_MV_WARN(mv,
                             " %s [%"PRId32"] range check: "
                             " wrong number of messages seen, wanted %d got %d "
                             "in expected range %d..%d (%d messages skipped)\n",
                             p ? p->topic : "*",
                             p ? p->partition : -1,
                             exp_cnt, cnt, vs->msgid_min, vs->msgid_max,
                             skip_cnt);
                fails++;
        }

        return fails;
}



/**
 * Run verifier \p f for all partitions.
 */
#define test_mv_p_verify_f(mv,flags,f,vs)	\
	test_mv_p_verify_f0(mv,flags,f, # f, vs)
static int test_mv_p_verify_f0 (test_msgver_t *mv, int flags,
				int (*f) (test_msgver_t *mv,
					  int flags,
					  struct test_mv_p *p,
					  struct test_mv_mvec *mvec,
					  struct test_mv_vs *vs),
				const char *f_name,
				struct test_mv_vs *vs) {
	int i;
	int fails = 0;

	for (i = 0 ; i < mv->p_cnt ; i++) {
		TEST_SAY("Verifying %s [%"PRId32"] %d msgs with %s\n",
			 mv->p[i]->topic, mv->p[i]->partition,
			 mv->p[i]->mvec.cnt, f_name);
		fails += f(mv, flags, mv->p[i], &mv->p[i]->mvec, vs);
	}

	return fails;
}


/**
 * Collect all messages from all topics and partitions into vs->mvec
 */
static void test_mv_collect_all_msgs (test_msgver_t *mv,
				      struct test_mv_vs *vs) {
	int i;

	for (i = 0 ; i < mv->p_cnt ; i++) {
		struct test_mv_p *p = mv->p[i];
		int mi;

		test_mv_mvec_reserve(&vs->mvec, p->mvec.cnt);
		for (mi = 0 ; mi < p->mvec.cnt ; mi++) {
			struct test_mv_m *m = test_mv_mvec_get(&p->mvec, mi);
			struct test_mv_m *m_new = test_mv_mvec_add(&vs->mvec);
			*m_new = *m;
		}
	}
}


/**
 * Verify that all messages (by msgid) in range msg_base+exp_cnt were received
 * and received only once.
 * This works across all partitions.
 */
static int test_msgver_verify_range (test_msgver_t *mv, int flags,
				     struct test_mv_vs *vs) {
	int fails = 0;

	/**
	 * Create temporary array to hold expected message set,
	 * then traverse all topics and partitions and move matching messages
	 * to that set. Then verify the message set.
	 */

	test_mv_mvec_init(&vs->mvec, vs->exp_cnt);

	/* Collect all msgs into vs mvec */
	test_mv_collect_all_msgs(mv, vs);
	
	fails += test_mv_mvec_verify_range(mv, TEST_MSGVER_BY_MSGID|flags,
					   NULL, &vs->mvec, vs);
	fails += test_mv_mvec_verify_dup(mv, TEST_MSGVER_BY_MSGID|flags,
					 NULL, &vs->mvec, vs);

	test_mv_mvec_clear(&vs->mvec);

	return fails;
}


/**
 * Verify that \p exp_cnt messages were received for \p topic and \p partition
 * starting at msgid base \p msg_base.
 */
int test_msgver_verify_part0 (const char *func, int line, const char *what,
			      test_msgver_t *mv, int flags,
			      const char *topic, int partition,
			      int msg_base, int exp_cnt) {
	int fails = 0;
	struct test_mv_vs vs = { .msg_base = msg_base, .exp_cnt = exp_cnt };
	struct test_mv_p *p;

	TEST_SAY("%s:%d: %s: Verifying %d received messages (flags 0x%x) "
		 "in %s [%d]: expecting msgids %d..%d (%d)\n",
		 func, line, what, mv->msgcnt, flags, topic, partition,
		 msg_base, msg_base+exp_cnt, exp_cnt);

	p = test_msgver_p_get(mv, topic, partition, 0);

	/* Per-partition checks */
	if (flags & TEST_MSGVER_ORDER)
		fails += test_mv_mvec_verify_order(mv, flags, p, &p->mvec, &vs);
	if (flags & TEST_MSGVER_DUP)
		fails += test_mv_mvec_verify_dup(mv, flags, p, &p->mvec, &vs);

	if (mv->msgcnt < vs.exp_cnt) {
		TEST_MV_WARN(mv,
			     "%s:%d: "
			     "%s [%"PRId32"] expected %d messages but only "
			     "%d received\n",
			     func, line,
			     p ? p->topic : "*",
			     p ? p->partition : -1,
			     vs.exp_cnt, mv->msgcnt);
		fails++;
	}


	if (mv->log_suppr_cnt > 0)
		TEST_WARN("%s:%d: %s: %d message warning logs suppressed\n",
			  func, line, what, mv->log_suppr_cnt);

	if (fails)
		TEST_FAIL("%s:%d: %s: Verification of %d received messages "
			  "failed: "
			  "expected msgids %d..%d (%d): see previous errors\n",
			  func, line, what,
			  mv->msgcnt, msg_base, msg_base+exp_cnt, exp_cnt);
	else
		TEST_SAY("%s:%d: %s: Verification of %d received messages "
			 "succeeded: "
			 "expected msgids %d..%d (%d)\n",
			 func, line, what,
			 mv->msgcnt, msg_base, msg_base+exp_cnt, exp_cnt);

	return fails;

}

/**
 * Verify that \p exp_cnt messages were received starting at
 * msgid base \p msg_base.
 */
int test_msgver_verify0 (const char *func, int line, const char *what,
			 test_msgver_t *mv,
			 int flags, struct test_mv_vs vs) {
	int fails = 0;

	TEST_SAY("%s:%d: %s: Verifying %d received messages (flags 0x%x): "
		 "expecting msgids %d..%d (%d)\n",
		 func, line, what, mv->msgcnt, flags,
		 vs.msg_base, vs.msg_base+vs.exp_cnt, vs.exp_cnt);
        if (flags & TEST_MSGVER_BY_TIMESTAMP) {
                assert((flags & TEST_MSGVER_BY_MSGID)); /* Required */
                TEST_SAY("%s:%d: %s: "
                         " and expecting timestamps %"PRId64"..%"PRId64"\n",
                         func, line, what,
                         vs.timestamp_min, vs.timestamp_max);
        }

	/* Per-partition checks */
	if (flags & TEST_MSGVER_ORDER)
		fails += test_mv_p_verify_f(mv, flags,
					    test_mv_mvec_verify_order, &vs);
	if (flags & TEST_MSGVER_DUP)
		fails += test_mv_p_verify_f(mv, flags,
					    test_mv_mvec_verify_dup, &vs);

	/* Checks across all partitions */
	if ((flags & TEST_MSGVER_RANGE) && vs.exp_cnt > 0) {
		vs.msgid_min = vs.msg_base;
		vs.msgid_max = vs.msgid_min + vs.exp_cnt - 1;
		fails += test_msgver_verify_range(mv, flags, &vs);
	}

	if (mv->log_suppr_cnt > 0)
		TEST_WARN("%s:%d: %s: %d message warning logs suppressed\n",
			  func, line, what, mv->log_suppr_cnt);

	if (vs.exp_cnt != mv->msgcnt) {
		TEST_WARN("%s:%d: %s: expected %d messages, got %d\n",
			  func, line, what, vs.exp_cnt, mv->msgcnt);
		fails++;
	}

	if (fails)
		TEST_FAIL("%s:%d: %s: Verification of %d received messages "
			  "failed: "
			  "expected msgids %d..%d (%d): see previous errors\n",
			  func, line, what,
			  mv->msgcnt, vs.msg_base, vs.msg_base+vs.exp_cnt,
                          vs.exp_cnt);
	else
		TEST_SAY("%s:%d: %s: Verification of %d received messages "
			 "succeeded: "
			 "expected msgids %d..%d (%d)\n",
			 func, line, what,
			 mv->msgcnt, vs.msg_base, vs.msg_base+vs.exp_cnt,
                         vs.exp_cnt);

	return fails;
}




void test_verify_rkmessage0 (const char *func, int line,
                             rd_kafka_message_t *rkmessage, uint64_t testid,
                             int32_t partition, int msgnum) {
	uint64_t in_testid;
	int in_part;
	int in_msgnum;
	char buf[128];

	rd_snprintf(buf, sizeof(buf), "%.*s",
		 (int)rkmessage->len, (char *)rkmessage->payload);

	if (sscanf(buf, "testid=%"SCNu64", partition=%i, msg=%i",
		   &in_testid, &in_part, &in_msgnum) != 3)
		TEST_FAIL("Incorrect format: %s", buf);

	if (testid != in_testid ||
	    (partition != -1 && partition != in_part) ||
	    (msgnum != -1 && msgnum != in_msgnum) ||
	    in_msgnum < 0)
		goto fail_match;

	if (test_level > 2) {
		TEST_SAY("%s:%i: Our testid %"PRIu64", part %i (%i), msg %i\n",
			 func, line,
			 testid, (int)partition, (int)rkmessage->partition,
			 msgnum);
	}


        return;

fail_match:
	TEST_FAIL("%s:%i: Our testid %"PRIu64", part %i, msg %i did "
		  "not match message: \"%s\"\n",
		  func, line,
		  testid, (int)partition, msgnum, buf);
}


/**
 * Consumer poll but dont expect any proper messages for \p timeout_ms.
 */
void test_consumer_poll_no_msgs (const char *what, rd_kafka_t *rk,
				 uint64_t testid, int timeout_ms) {
	int64_t tmout = test_clock() + timeout_ms * 1000;
        int cnt = 0;
        test_timing_t t_cons;
	test_msgver_t mv;

	test_msgver_init(&mv, testid);

        TEST_SAY("%s: not expecting any messages for %dms\n",
		 what, timeout_ms);

        TIMING_START(&t_cons, "CONSUME");

	do {
                rd_kafka_message_t *rkmessage;

                rkmessage = rd_kafka_consumer_poll(rk, timeout_ms);
                if (!rkmessage)
			continue;

                if (rkmessage->err == RD_KAFKA_RESP_ERR__PARTITION_EOF) {
                        TEST_SAY("%s [%"PRId32"] reached EOF at "
                                 "offset %"PRId64"\n",
                                 rd_kafka_topic_name(rkmessage->rkt),
                                 rkmessage->partition,
                                 rkmessage->offset);
			test_msgver_add_msg(&mv, rkmessage);

                } else if (rkmessage->err) {
                        TEST_FAIL("%s [%"PRId32"] error (offset %"PRId64
				"): %s",
                                 rkmessage->rkt ?
                                 rd_kafka_topic_name(rkmessage->rkt) :
                                 "(no-topic)",
                                 rkmessage->partition,
                                 rkmessage->offset,
                                 rd_kafka_message_errstr(rkmessage));

                } else {
			if (test_msgver_add_msg(&mv, rkmessage)) {
				TEST_MV_WARN(&mv,
					     "Received unexpected message on "
					     "%s [%"PRId32"] at offset "
					     "%"PRId64"\n",
					     rd_kafka_topic_name(rkmessage->
								 rkt),
					     rkmessage->partition,
					     rkmessage->offset);
				cnt++;
			}
                }

                rd_kafka_message_destroy(rkmessage);
        } while (test_clock() <= tmout);

        TIMING_STOP(&t_cons);

	test_msgver_verify(what, &mv, TEST_MSGVER_ALL, 0, 0);
	test_msgver_clear(&mv);

	TEST_ASSERT(cnt == 0, "Expected 0 messages, got %d", cnt);
}



/**
 * Call consumer poll once and then return.
 * Messages are handled.
 *
 * \p mv is optional
 *
 * @returns 0 on timeout, 1 if a message was received or .._PARTITION_EOF
 *          if EOF was reached.
 *          TEST_FAIL()s on all errors.
 */
int test_consumer_poll_once (rd_kafka_t *rk, test_msgver_t *mv, int timeout_ms){
	rd_kafka_message_t *rkmessage;

	rkmessage = rd_kafka_consumer_poll(rk, timeout_ms);
	if (!rkmessage)
		return 0;

	if (rkmessage->err == RD_KAFKA_RESP_ERR__PARTITION_EOF) {
		TEST_SAY("%s [%"PRId32"] reached EOF at "
			 "offset %"PRId64"\n",
			 rd_kafka_topic_name(rkmessage->rkt),
			 rkmessage->partition,
			 rkmessage->offset);
		if (mv)
			test_msgver_add_msg(mv, rkmessage);
		rd_kafka_message_destroy(rkmessage);
		return RD_KAFKA_RESP_ERR__PARTITION_EOF;

	} else if (rkmessage->err) {
		TEST_FAIL("%s [%"PRId32"] error (offset %"PRId64
			  "): %s",
			  rkmessage->rkt ?
			  rd_kafka_topic_name(rkmessage->rkt) :
			  "(no-topic)",
			  rkmessage->partition,
			  rkmessage->offset,
			  rd_kafka_message_errstr(rkmessage));

	} else {
		if (mv)
			test_msgver_add_msg(mv, rkmessage);
	}

	rd_kafka_message_destroy(rkmessage);
	return 1;
}
	
int test_consumer_poll (const char *what, rd_kafka_t *rk, uint64_t testid,
                        int exp_eof_cnt, int exp_msg_base, int exp_cnt,
			test_msgver_t *mv) {
        int eof_cnt = 0;
        int cnt = 0;
        test_timing_t t_cons;

        TEST_SAY("%s: consume %d messages\n", what, exp_cnt);

        TIMING_START(&t_cons, "CONSUME");

        while ((exp_eof_cnt == -1 || eof_cnt < exp_eof_cnt) &&
               (exp_cnt == -1 || cnt < exp_cnt)) {
                rd_kafka_message_t *rkmessage;

                rkmessage = rd_kafka_consumer_poll(rk, tmout_multip(10*1000));
                if (!rkmessage) /* Shouldn't take this long to get a msg */
                        TEST_FAIL("%s: consumer_poll() timeout "
				  "(%d/%d eof, %d/%d msgs)\n", what,
				  eof_cnt, exp_eof_cnt, cnt, exp_cnt);


                if (rkmessage->err == RD_KAFKA_RESP_ERR__PARTITION_EOF) {
                        TEST_SAY("%s [%"PRId32"] reached EOF at "
                                 "offset %"PRId64"\n",
                                 rd_kafka_topic_name(rkmessage->rkt),
                                 rkmessage->partition,
                                 rkmessage->offset);
			if (mv)
				test_msgver_add_msg(mv, rkmessage);
                        eof_cnt++;

                } else if (rkmessage->err) {
                        TEST_FAIL("%s [%"PRId32"] error (offset %"PRId64
				  "): %s",
                                 rkmessage->rkt ?
                                 rd_kafka_topic_name(rkmessage->rkt) :
                                 "(no-topic)",
                                 rkmessage->partition,
                                 rkmessage->offset,
                                 rd_kafka_message_errstr(rkmessage));

                } else {
			if (!mv || test_msgver_add_msg(mv, rkmessage))
				cnt++;
                }

                rd_kafka_message_destroy(rkmessage);
        }

        TIMING_STOP(&t_cons);

        TEST_SAY("%s: consumed %d/%d messages (%d/%d EOFs)\n",
                 what, cnt, exp_cnt, eof_cnt, exp_eof_cnt);
        return cnt;
}

void test_consumer_close (rd_kafka_t *rk) {
        rd_kafka_resp_err_t err;
        test_timing_t timing;

        TEST_SAY("Closing consumer\n");

        TIMING_START(&timing, "CONSUMER.CLOSE");
        err = rd_kafka_consumer_close(rk);
        TIMING_STOP(&timing);
        if (err)
                TEST_FAIL("Failed to close consumer: %s\n",
                          rd_kafka_err2str(err));
}


void test_flush (rd_kafka_t *rk, int timeout_ms) {
	test_timing_t timing;
	rd_kafka_resp_err_t err;

	TEST_SAY("%s: Flushing %d messages\n",
		 rd_kafka_name(rk), rd_kafka_outq_len(rk));
	TIMING_START(&timing, "FLUSH");
	err = rd_kafka_flush(rk, timeout_ms);
	TIMING_STOP(&timing);
	if (err)
		TEST_FAIL("Failed to flush(%s, %d): %s\n",
			  rd_kafka_name(rk), timeout_ms,
			  rd_kafka_err2str(err));
}


void test_conf_set (rd_kafka_conf_t *conf, const char *name, const char *val) {
        char errstr[512];
        if (rd_kafka_conf_set(conf, name, val, errstr, sizeof(errstr)) !=
            RD_KAFKA_CONF_OK)
                TEST_FAIL("Failed to set config \"%s\"=\"%s\": %s\n",
                          name, val, errstr);
}

char *test_conf_get (const rd_kafka_conf_t *conf, const char *name) {
	static RD_TLS char ret[256];
	size_t ret_sz = sizeof(ret);
	if (rd_kafka_conf_get(conf, name, ret, &ret_sz) != RD_KAFKA_CONF_OK)
		TEST_FAIL("Failed to get config \"%s\": %s\n", name,
			  "unknown property");
	return ret;
}


/**
 * @brief Check if property \name matches \p val in \p conf.
 *        If \p conf is NULL the test config will be used. */
int test_conf_match (rd_kafka_conf_t *conf, const char *name, const char *val) {
        char *real;
        int free_conf = 0;

        if (!conf) {
                test_conf_init(&conf, NULL, 0);
                free_conf = 1;
        }

        real = test_conf_get(conf, name);

        if (free_conf)
                rd_kafka_conf_destroy(conf);

        return !strcmp(real, val);
}


void test_topic_conf_set (rd_kafka_topic_conf_t *tconf,
                          const char *name, const char *val) {
        char errstr[512];
        if (rd_kafka_topic_conf_set(tconf, name, val, errstr, sizeof(errstr)) !=
            RD_KAFKA_CONF_OK)
                TEST_FAIL("Failed to set topic config \"%s\"=\"%s\": %s\n",
                          name, val, errstr);
}

/**
 * @brief First attempt to set topic level property, then global.
 */
void test_any_conf_set (rd_kafka_conf_t *conf,
                        rd_kafka_topic_conf_t *tconf,
                        const char *name, const char *val) {
        rd_kafka_conf_res_t res = RD_KAFKA_CONF_UNKNOWN;
        char errstr[512] = {"Missing conf_t"};

        if (tconf)
                res = rd_kafka_topic_conf_set(tconf, name, val,
                                              errstr, sizeof(errstr));
        if (res == RD_KAFKA_CONF_UNKNOWN && conf)
                res = rd_kafka_conf_set(conf, name, val,
                                        errstr, sizeof(errstr));

        if (res != RD_KAFKA_CONF_OK)
                TEST_FAIL("Failed to set any config \"%s\"=\"%s\": %s\n",
                          name, val, errstr);
}

void test_print_partition_list (const rd_kafka_topic_partition_list_t
				*partitions) {
        int i;
        for (i = 0 ; i < partitions->cnt ; i++) {
		TEST_SAY(" %s [%"PRId32"] offset %"PRId64"%s%s\n",
			 partitions->elems[i].topic,
			 partitions->elems[i].partition,
			 partitions->elems[i].offset,
			 partitions->elems[i].err ? ": " : "",
			 partitions->elems[i].err ?
			 rd_kafka_err2str(partitions->elems[i].err) : "");
        }
}

/**
 * @brief Execute kafka-topics.sh from the Kafka distribution.
 */
void test_kafka_topics (const char *fmt, ...) {
#ifdef _MSC_VER
	TEST_FAIL("%s not supported on Windows, yet", __FUNCTION__);
#else
	char cmd[512];
	int r;
	va_list ap;
	test_timing_t t_cmd;
	const char *kpath, *zk;

	kpath = test_getenv("KAFKA_PATH", NULL);
	zk = test_getenv("ZK_ADDRESS", NULL);

	if (!kpath || !zk)
		TEST_FAIL("%s: KAFKA_PATH and ZK_ADDRESS must be set",
			  __FUNCTION__);

	r = rd_snprintf(cmd, sizeof(cmd),
			"%s/bin/kafka-topics.sh --zookeeper %s ", kpath, zk);
	TEST_ASSERT(r < (int)sizeof(cmd));

	va_start(ap, fmt);
	rd_vsnprintf(cmd+r, sizeof(cmd)-r, fmt, ap);
	va_end(ap);

	TEST_SAY("Executing: %s\n", cmd);
	TIMING_START(&t_cmd, "exec");
	r = system(cmd);
	TIMING_STOP(&t_cmd);

	if (r == -1)
		TEST_FAIL("system(\"%s\") failed: %s", cmd, strerror(errno));
	else if (WIFSIGNALED(r))
		TEST_FAIL("system(\"%s\") terminated by signal %d\n", cmd,
			  WTERMSIG(r));
	else if (WEXITSTATUS(r))
		TEST_FAIL("system(\"%s\") failed with exit status %d\n",
			  cmd, WEXITSTATUS(r));
#endif
}


/**
 * @brief Create topic using kafka-topics.sh --create
 */
void test_create_topic (const char *topicname, int partition_cnt,
			int replication_factor) {
	test_kafka_topics("--create --topic \"%s\" "
			  "--replication-factor %d --partitions %d",
			  topicname, replication_factor, partition_cnt);
}


/**
 * @brief Let the broker auto-create the topic for us.
 */
rd_kafka_resp_err_t test_auto_create_topic_rkt (rd_kafka_t *rk,
                                                rd_kafka_topic_t *rkt) {
	const struct rd_kafka_metadata *metadata;
	rd_kafka_resp_err_t err;
	test_timing_t t;

	TIMING_START(&t, "auto_create_topic");
	err = rd_kafka_metadata(rk, 0, rkt, &metadata, tmout_multip(15000));
	TIMING_STOP(&t);
	if (err)
                TEST_WARN("metadata() for %s failed: %s",
                          rkt ? rd_kafka_topic_name(rkt) : "(all-local)",
                          rd_kafka_err2str(err));
        else
                rd_kafka_metadata_destroy(metadata);

        return err;
}

rd_kafka_resp_err_t test_auto_create_topic (rd_kafka_t *rk, const char *name) {
        rd_kafka_topic_t *rkt = rd_kafka_topic_new(rk, name, NULL);
        rd_kafka_resp_err_t err;
        if (!rkt)
                return rd_kafka_last_error();
        err = test_auto_create_topic_rkt(rk, rkt);
        rd_kafka_topic_destroy(rkt);
        return err;
}


/**
 * @brief Check if topic auto creation works.
 * @returns 1 if it does, else 0.
 */
int test_check_auto_create_topic (void) {
        rd_kafka_t *rk;
        rd_kafka_conf_t *conf;
        rd_kafka_resp_err_t err;
        const char *topic = test_mk_topic_name("autocreatetest", 1);

        test_conf_init(&conf, NULL, 0);
        rk = test_create_handle(RD_KAFKA_PRODUCER, conf);
        err = test_auto_create_topic(rk, topic);
        if (err)
                TEST_SAY("Auto topic creation of \"%s\" failed: %s\n",
                         topic, rd_kafka_err2str(err));
        rd_kafka_destroy(rk);

        return err ? 0 : 1;
}

/**
 * @brief Check if \p feature is builtin to librdkafka.
 * @returns returns 1 if feature is built in, else 0.
 */
int test_check_builtin (const char *feature) {
	rd_kafka_conf_t *conf;
	char errstr[128];
	int r;

	conf = rd_kafka_conf_new();
	if (rd_kafka_conf_set(conf, "builtin.features", feature,
			      errstr, sizeof(errstr)) != RD_KAFKA_CONF_OK) {
		TEST_SAY("Feature \"%s\" not built-in: %s\n",
			 feature, errstr);
		r = 0;
	} else {
		TEST_SAY("Feature \"%s\" is built-in\n", feature);
		r = 1;
	}

	rd_kafka_conf_destroy(conf);
	return r;
}


char *tsprintf (const char *fmt, ...) {
	static RD_TLS char ret[8][512];
	static RD_TLS int i;
	va_list ap;


	i = (i + 1) % 8;

	va_start(ap, fmt);
	rd_vsnprintf(ret[i], sizeof(ret[i]), fmt, ap);
	va_end(ap);

	return ret[i];
}


/**
 * @brief Add a test report JSON object.
 * These will be written as a JSON array to the test report file.
 */
void test_report_add (struct test *test, const char *fmt, ...) {
	va_list ap;
	char buf[512];

	va_start(ap, fmt);
	vsnprintf(buf, sizeof(buf), fmt, ap);
	va_end(ap);

	if (test->report_cnt == test->report_size) {
		if (test->report_size == 0)
			test->report_size = 8;
		else
			test->report_size *= 2;

		test->report_arr = realloc(test->report_arr,
					   sizeof(*test->report_arr) *
					   test->report_size);
	}

	test->report_arr[test->report_cnt++] = rd_strdup(buf);

	TEST_SAYL(1, "Report #%d: %s\n", test->report_cnt-1, buf);
}

/**
 * Returns 1 if KAFKA_PATH and ZK_ADDRESS is set to se we can use the
 * kafka-topics.sh script to manually create topics.
 *
 * If \p skip is set TEST_SKIP() will be called with a helpful message.
 */
int test_can_create_topics (int skip) {
#ifdef _MSC_VER
	if (skip)
		TEST_SKIP("Cannot create topics on Win32");
	return 0;
#else

	if (!test_getenv("KAFKA_PATH", NULL) ||
	    !test_getenv("ZK_ADDRESS", NULL)) {
		if (skip)
			TEST_SKIP("Cannot create topics "
				  "(set KAFKA_PATH and ZK_ADDRESS)\n");
		return 0;
	}


	return 1;
#endif
}


/**
 * Wait for \p event_type, discarding all other events prior to it.
 */
rd_kafka_event_t *test_wait_event (rd_kafka_queue_t *eventq,
				   rd_kafka_event_type_t event_type,
				   int timeout_ms) {
	test_timing_t t_w;
	int64_t abs_timeout = test_clock() + (timeout_ms * 1000);

	TIMING_START(&t_w, "wait_event");
	while (test_clock() < abs_timeout) {
		rd_kafka_event_t *rkev;

		rkev = rd_kafka_queue_poll(eventq,
					   (int)(abs_timeout - test_clock())/
					   1000);

		if (rd_kafka_event_type(rkev) == event_type) {
			TIMING_STOP(&t_w);
			return rkev;
		}

		if (!rkev)
			continue;

		if (rd_kafka_event_error(rkev))
			TEST_SAY("discarding ignored event %s: %s\n",
				 rd_kafka_event_name(rkev),
				 rd_kafka_event_error_string(rkev));
		else
			TEST_SAY("discarding ignored event %s\n",
				 rd_kafka_event_name(rkev));
		rd_kafka_event_destroy(rkev);

	}
	TIMING_STOP(&t_w);

	return NULL;
}


void test_FAIL (const char *file, int line, int fail_now, const char *str) {
        TEST_FAIL0(file, line, 1/*lock*/, fail_now, "%s", str);
}

void test_SAY (const char *file, int line, int level, const char *str) {
        TEST_SAYL(level, "%s", str);
}


const char *test_curr_name (void) {
        return test_curr->name;
}
