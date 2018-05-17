/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 *
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

module.exports = LibrdKafkaError;

var util = require('util');
var librdkafka = require('../librdkafka');

util.inherits(LibrdKafkaError, Error);

LibrdKafkaError.create = createLibrdkafkaError;

/**
 * Enum for identifying errors reported by the library
 *
 * You can find this list in the C++ code at
 * https://github.com/edenhill/librdkafka/blob/master/src-cpp/rdkafkacpp.h#L148
 *
 * @readonly
 * @enum {number}
 * @constant
 */
LibrdKafkaError.codes = {

  /** Begin internal error codes */
  ERR__BEGIN: -200,
  /** Received message is incorrect */
  ERR__BAD_MSG: -199,
  /** Bad/unknown compression */
  ERR__BAD_COMPRESSION: -198,
  /** Broker is going away */
  ERR__DESTROY: -197,
  /** Generic failure */
  ERR__FAIL: -196,
  /** Broker transport failure */
  ERR__TRANSPORT: -195,
  /** Critical system resource */
  ERR__CRIT_SYS_RESOURCE: -194,
  /** Failed to resolve broker */
  ERR__RESOLVE: -193,
  /** Produced message timed out */
  ERR__MSG_TIMED_OUT: -192,
  /** Reached the end of the topic+partition queue on the broker. Not really an error. */
  ERR__PARTITION_EOF: -191,
  /** Permanent: Partition does not exist in cluster. */
  ERR__UNKNOWN_PARTITION: -190,
  /** File or filesystem error */
  ERR__FS: -189,
  /** Permanent: Topic does not exist in cluster. */
  ERR__UNKNOWN_TOPIC: -188,
  /** All broker connections are down. */
  ERR__ALL_BROKERS_DOWN: -187,
  /** Invalid argument, or invalid configuration */
  ERR__INVALID_ARG: -186,
  /** Operation timed out */
  ERR__TIMED_OUT: -185,
  /** Queue is full */
  ERR__QUEUE_FULL: -184,
  /** ISR count < required.acks */
  ERR__ISR_INSUFF: -183,
  /** Broker node update */
  ERR__NODE_UPDATE: -182,
  /** SSL error */
  ERR__SSL: -181,
  /** Waiting for coordinator to become available. */
  ERR__WAIT_COORD: -180,
  /** Unknown client group */
  ERR__UNKNOWN_GROUP: -179,
  /** Operation in progress */
  ERR__IN_PROGRESS: -178,
  /** Previous operation in progress, wait for it to finish. */
  ERR__PREV_IN_PROGRESS: -177,
  /** This operation would interfere with an existing subscription */
  ERR__EXISTING_SUBSCRIPTION: -176,
  /** Assigned partitions (rebalance_cb) */
  ERR__ASSIGN_PARTITIONS: -175,
  /** Revoked partitions (rebalance_cb) */
  ERR__REVOKE_PARTITIONS: -174,
  /** Conflicting use */
  ERR__CONFLICT: -173,
  /** Wrong state */
  ERR__STATE: -172,
  /** Unknown protocol */
  ERR__UNKNOWN_PROTOCOL: -171,
  /** Not implemented */
  ERR__NOT_IMPLEMENTED: -170,
  /** Authentication failure */
  ERR__AUTHENTICATION: -169,
  /** No stored offset */
  ERR__NO_OFFSET: -168,
  /** Outdated */
  ERR__OUTDATED: -167,
  /** Timed out in queue */
  ERR__TIMED_OUT_QUEUE: -166,
  /** Feature not supported by broker */
  ERR__UNSUPPORTED_FEATURE: -165,
  /** Awaiting cache update */
  ERR__WAIT_CACHE: -164,
  /** End internal error codes */
  ERR__END: -100,

  /** Unknown broker error */
  ERR_UNKNOWN: -1,
  /** Success */
  ERR_NO_ERROR: 0,
  /** Offset out of range */
  ERR_OFFSET_OUT_OF_RANGE: 1,
  /** Invalid message */
  ERR_INVALID_MSG: 2,
  /** Unknown topic or partition */
  ERR_UNKNOWN_TOPIC_OR_PART: 3,
  /** Invalid message size */
  ERR_INVALID_MSG_SIZE: 4,
  /** Leader not available */
  ERR_LEADER_NOT_AVAILABLE: 5,
  /** Not leader for partition */
  ERR_NOT_LEADER_FOR_PARTITION: 6,
  /** Request timed out */
  ERR_REQUEST_TIMED_OUT: 7,
  /** Broker not available */
  ERR_BROKER_NOT_AVAILABLE: 8,
  /** Replica not available */
  ERR_REPLICA_NOT_AVAILABLE: 9,
  /** Message size too large */
  ERR_MSG_SIZE_TOO_LARGE: 10,
  /** StaleControllerEpochCode */
  ERR_STALE_CTRL_EPOCH: 11,
  /** Offset metadata string too large */
  ERR_OFFSET_METADATA_TOO_LARGE: 12,
  /** Broker disconnected before response received */
  ERR_NETWORK_EXCEPTION: 13,
  /** Group coordinator load in progress */
  ERR_GROUP_LOAD_IN_PROGRESS: 14,
  /** Group coordinator not available */
  ERR_GROUP_COORDINATOR_NOT_AVAILABLE: 15,
  /** Not coordinator for group */
  ERR_NOT_COORDINATOR_FOR_GROUP: 16,
  /** Invalid topic */
  ERR_TOPIC_EXCEPTION: 17,
  /** Message batch larger than configured server segment size */
  ERR_RECORD_LIST_TOO_LARGE: 18,
  /** Not enough in-sync replicas */
  ERR_NOT_ENOUGH_REPLICAS: 19,
  /** Message(s) written to insufficient number of in-sync replicas */
  ERR_NOT_ENOUGH_REPLICAS_AFTER_APPEND: 20,
  /** Invalid required acks value */
  ERR_INVALID_REQUIRED_ACKS: 21,
  /** Specified group generation id is not valid */
  ERR_ILLEGAL_GENERATION: 22,
  /** Inconsistent group protocol */
  ERR_INCONSISTENT_GROUP_PROTOCOL: 23,
  /** Invalid group.id */
  ERR_INVALID_GROUP_ID: 24,
  /** Unknown member */
  ERR_UNKNOWN_MEMBER_ID: 25,
  /** Invalid session timeout */
  ERR_INVALID_SESSION_TIMEOUT: 26,
  /** Group rebalance in progress */
  ERR_REBALANCE_IN_PROGRESS: 27,
  /** Commit offset data size is not valid */
  ERR_INVALID_COMMIT_OFFSET_SIZE: 28,
  /** Topic authorization failed */
  ERR_TOPIC_AUTHORIZATION_FAILED: 29,
  /** Group authorization failed */
  ERR_GROUP_AUTHORIZATION_FAILED: 30,
  /** Cluster authorization failed */
  ERR_CLUSTER_AUTHORIZATION_FAILED: 31
};

for (var key in librdkafka.codes) {
  // Skip it if it doesn't start with ErrorCode
  if (key.indexOf('ErrorCode::') !== 0) {
    continue;
  }

  // Replace/add it if there are any discrepancies
  var newKey = key.replace('ErrorCode::', '');
  LibrdKafkaError.codes[newKey] = librdkafka.codes[key];
}

/**
 * Representation of a librdkafka error
 *
 * This can be created by giving either another error
 * to piggy-back on. In this situation it tries to parse
 * the error string to figure out the intent. However, more usually,
 * it is constructed by an error object created by a C++ Baton.
 *
 * @param {object|error} e - An object or error to wrap
 * @property {string} message - The error message
 * @property {number} code - The error code.
 * @property {string} origin - The origin, whether it is local or remote
 * @constructor
 */
function LibrdKafkaError(e) {
  if (!(this instanceof LibrdKafkaError)) {
    return new LibrdKafkaError(e);
  }

  if (typeof e === 'number') {
    this.message = librdkafka.err2str(e);
    this.code = e;
    this.errno = e;
    if (e >= LibrdKafkaError.codes.ERR__END) {
      this.origin = 'local';
    } else {
      this.origin = 'kafka';
    }
    Error.captureStackTrace(this, this.constructor);
  } else if (!util.isError(e)) {
    // This is the better way
    this.message = e.message;
    this.code = e.code;
    this.errno = e.code;
    if (e.code >= LibrdKafkaError.codes.ERR__END) {
      this.origin = 'local';
    } else {
      this.origin = 'kafka';
    }
    Error.captureStackTrace(this, this.constructor);
  } else {
    var message = e.message;
    var parsedMessage = message.split(': ');

    var origin, msg;

    if (parsedMessage.length > 1) {
      origin = parsedMessage[0].toLowerCase();
      msg = parsedMessage[1].toLowerCase();
    } else {
      origin = 'unknown';
      msg = message.toLowerCase();
    }

    // special cases
    if (msg === 'consumer is disconnected' || msg === 'producer is disconnected') {
      this.origin = 'local';
      this.code = LibrdKafkaError.codes.ERR__STATE;
      this.errno = this.code;
      this.message = msg;
    } else {
      this.origin = origin;
      this.message = msg;
      this.code = -1;
      this.errno = this.code;
      this.stack = e.stack;
    }

  }

}

function createLibrdkafkaError(e) {
  return new LibrdKafkaError(e);
}
