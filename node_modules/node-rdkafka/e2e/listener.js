/*
 * node-rdkafka - Node.js wrapper for RdKafka C/C++ library
 * Copyright (c) 2016 Blizzard Entertainment
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE.txt file for details.
 */

module.exports = eventListener;

function eventListener(client) {
  if (!process.env.DEBUG) {
    return;
  }

  client
    .on('event.error', function (err) {
      console.error(err);
    })
    .on('event.log', function(event) {
      var info = {
        severity: event.severity,
        fac: event.fac,
      };
      if (event.severity >= 7) {
        console.error(info, event.message);
      } else if (event.severity === 6 || event.severity === 5) {
        console.error(info, event.message);
      } else if (event.severity === 4) {
        console.error(info, event.message);
      } else if (event.severity > 0) {
        console.error(info, event.message);
      } else {
        console.error(info, event.message);
      }
    })
    .on('event.stats', function(event) {
      console.log(event, event.message);
    })
    .on('event.throttle', function(event) {
      console.log(event, '%s#%d throttled.', event.brokerName, event.brokerId);
      // event.throttleTime;
    })
    .on('event.event', function(event) {
      console.log(event, event.message);
    })
    .on('ready', function(info) {
      console.log('%s connected to kafka server', info.name);
    });

}
