FROM node:8-alpine
# Create app directory
WORKDIR /opt/cronicle

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Bundle app source
COPY . .


# Install perl
RUN apk add --update perl && rm -rf /var/cache/apk/*

# Needed to build node-rdkafka , see https://github.com/Blizzard/node-rdkafka/blob/master/examples/docker-alpine.md
RUN apk --no-cache add \
      bash \
      g++ \
      ca-certificates \
      lz4-dev \
      musl-dev \
      cyrus-sasl-dev \
      openssl-dev \
      make \
      python

# Needed to build node-rdkafka , see https://github.com/Blizzard/node-rdkafka/blob/master/examples/docker-alpine.md
RUN apk add --no-cache --virtual .build-deps gcc zlib-dev libc-dev bsd-compat-headers py-setuptools bash

#RUN npm install node-rdkafka
#RUN npm config ls -l | grep config


RUN npm install
RUN node bin/build.js dev
# If you are building your code for production
# RUN npm install --only=production


EXPOSE 80 443 3012 3013 3014
ENTRYPOINT [ "./entrypoint.sh" ]
# To build docker image build -t pioardi/dev-cronicle .
# TO run docker container run -p 3012:3012  pioardi/dev-cronicle --master
# TO run as service docker service create --name cronicle-cluster --replicas 3 --network bridge --hostname walgreens.com -p 3012:3012 dev-cronicle
