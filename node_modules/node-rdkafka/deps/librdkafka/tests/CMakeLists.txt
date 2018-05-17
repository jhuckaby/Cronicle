set(
    sources
    0000-unittests.c
    0001-multiobj.c
    0002-unkpart.c
    0003-msgmaxsize.c
    0004-conf.c
    0005-order.c
    0006-symbols.c
    0007-autotopic.c
    0008-reqacks.c
    0011-produce_batch.c
    0012-produce_consume.c
    0013-null-msgs.c
    0014-reconsume-191.c
    0015-offset_seeks.c
    0017-compression.c
    0018-cgrp_term.c
    0019-list_groups.c
    0020-destroy_hang.c
    0021-rkt_destroy.c
    0022-consume_batch.c
    0025-timers.c
    0026-consume_pause.c
    0028-long_topicnames.c
    0029-assign_offset.c
    0030-offset_commit.c
    0031-get_offsets.c
    0033-regex_subscribe.c
    0034-offset_reset.c
    0035-api_version.c
    0036-partial_fetch.c
    0037-destroy_hang_local.c
    0038-performance.c
    0039-event.c
    0040-io_event.c
    0041-fetch_max_bytes.c
    0042-many_topics.c
    0043-no_connection.c
    0044-partition_cnt.c
    0045-subscribe_update.c
    0046-rkt_cache.c
    0047-partial_buf_tmout.c
    0048-partitioner.c
    0049-consume_conn_close.c
    0050-subscribe_adds.c
    0051-assign_adds.c
    0052-msg_timestamps.c
    0053-stats_cb.cpp
    0054-offset_time.cpp
    0055-producer_latency.c
    0056-balanced_group_mt.c
    0057-invalid_topic.cpp
    0058-log.cpp
    0059-bsearch.cpp
    0060-op_prio.cpp
    0061-consumer_lag.cpp
    0062-stats_event.c
    0063-clusterid.cpp
    0064-interceptors.c
    0065-yield.cpp
    0066-plugins.cpp
    0067-empty_topic.cpp
    0068-produce_timeout.c
    0069-consumer_add_parts.c
    0070-null_empty.cpp
    8000-idle.cpp
    test.c
    testcpp.cpp
    sockem.c
)

add_executable(rdkafka_test ${sources})
target_link_libraries(rdkafka_test PUBLIC rdkafka++)

add_test(NAME RdKafkaTestInParallel COMMAND rdkafka_test -p5)
add_test(NAME RdKafkaTestSequentially COMMAND rdkafka_test -p1)
add_test(NAME RdKafkaTestBrokerLess COMMAND rdkafka_test -p5 -l)
