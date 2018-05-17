/**
 * Copyright 2014 Confluent Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var Brokers = module.exports = function(client) {
    this.client = client;
}

Brokers.prototype.list = function(res) {
    this.client.request("/brokers", function(err, brokers_response) {
        if (err)
            return res(err);

        var brokers = [];
        for(var i = 0; i < brokers_response.brokers.length; i++)
            brokers.push(new Broker(this.client, brokers_response.brokers[i], brokers_response.brokers[i]));

        res(null, brokers);
    }.bind(this));
}

var Broker = Brokers.Broker = function(client, id, raw) {
    this.client = client;
    this.id = id;
    this.raw = raw;
}

Broker.prototype.toString = function() {
    return "Broker{id=" + this.id + "}";
}