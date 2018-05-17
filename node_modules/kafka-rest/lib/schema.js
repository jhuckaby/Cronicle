/**
 * Copyright 2015 Confluent Inc.
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

var utils = require('./utils');

/**
 * Schema is an abstract base class for all Schema implementations.
 */
var Schema = module.exports = function() {
    this.id = null;
};

Schema.prototype.toSchemaString = function() {
    throw new Error("Not implemented: toSchemaString");
};

Schema.prototype.toSchemaID = function() {
    return this.id;
};

Schema.prototype.setSchemaID = function(id) {
    this.id = id;
};

/**
 *  Get the content type to use for REST proxy requests/responses that use this
 *  schema type. This may be used for the Content-Type of a request entity or an
 *  Accept header that controls the response format.
 */
Schema.prototype.getContentType = function(client) {
    throw new Error("Not implemented: getContentType");
};

Schema.getContentType = Schema.prototype.getContentType;

/**
 * Decode a message returned by a consume request.
 */
Schema.decodeMessage = function(msg) {
    throw new Error("Not implemented: decodeMessage");
};