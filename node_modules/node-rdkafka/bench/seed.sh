#!/bin/bash
kafka_root=${KAFKA_ROOT:-/opt/kafka}
# Generate and insert some messages

OS=$(uname -s)

function initializeTopic {
  topic=$1
  host=$2
  msg_size=$3
  batch_size=$4
  batch_count=$5

  if [ $host == "localhost:9092" ]; then
    ${kafka_root}/bin/kafka-topics.sh --create --zookeeper localhost:2181 \
      --replication-factor 1 --partitions 1 --topic ${topic}
  fi

  echo "Generating messages (size: ${msg_size})"
  : > /tmp/msgs  # Truncate /tmp/msgs
  for i in $(seq 1 ${batch_size}); do
    if [ $OS == 'Darwin' ]; then
      printf %s\\n "$(head -c${msg_size} /dev/urandom | base64)" >> /tmp/msgs
    else
      printf %s\\n "$(head --bytes=${msg_size} /dev/urandom | base64 --wrap=0)" >> /tmp/msgs
    fi
  done

  echo "Done generating messages"

  for i in $(seq 1 ${batch_count}); do
    echo "Adding $(wc -l /tmp/msgs) messages to topic ${topic}"
    "${kafka_root}/bin/kafka-console-producer.sh" \
      --broker-list ${host} --topic ${topic} < /tmp/msgs
  done
}

initializeTopic "librdtesting-01" "localhost:9092" "4096" "5000" "2000"
