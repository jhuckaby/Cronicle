#!/bin/bash

COMPOSE_VERSION=$(docker-compose --version)
DOCKER_VERSION=$(docker --version)

# Start the docker compose file
echo "Running docker compose up. Docker version $DOCKER_VERSION. Compose version $COMPOSE_VERSION. "

docker-compose up -d

if [ "$?" == "1" ]; then
  echo "Failed to start docker images."
  exit 1
fi

# List of topics to create in container
topics=(
  "test"
  "test2"
  "test3"
  "test4"
  "test5"
  "test6"
)

# Run docker-compose exec to make them
for topic in "${topics[@]}"
do
  echo "Making topic $topic"
  until docker-compose exec kafka \
    kafka-topics --create --topic $topic --partitions 1 --replication-factor 1 --if-not-exists --zookeeper zookeeper:2181
  do
    topic_result="$?"
    if [ "$topic_result" == "1" ]; then
      echo "Bad status code: $topic_result. Trying again."
    else
      # If it is some unknown status code, die.
      exit 1
    fi
  done

done
