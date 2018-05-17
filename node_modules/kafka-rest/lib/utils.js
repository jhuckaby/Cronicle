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

exports.shallowCopy = function(base) {
    var res = {};
    for(var f in base)
        res[f] = base[f];
    return res;
}

exports.mixin = function(base, override) {
    for(var f in override)
        base[f] = override[f];
}

exports.urlJoin = function() {
    var path = arguments[0];

    for(var i = 1; i < arguments.length; i++) {
        var append = arguments[i];
        var trailing_path = (path[path.length - 1] == '/');
        var prefix_append = (append[0] == '/');
        if (trailing_path && prefix_append)
            path = path + append.substr(1);
        else if (!trailing_path && !prefix_append)
            path = path + '/' + append;
        else
            path = path + append;
    }

    return path;
}

exports.urlQueryString = function(query) {
    query = query || {};
    var queryString = '?';
    var params = [];

    for (var key in query) {
        params.push(key + '=' + encodeURIComponent(query[key]));
    }

    return params.length > 0
        ? '?' + params.join('&')
        : '';
}

exports.toBase64 = function(val) {
    if (val === null || val == undefined)
        return null;
    else if (typeof(val) == "string") // Assumed to be unencoded UTF8
        return new Buffer(val).toString('base64');
    else if (Buffer.isBuffer(val))
        return val.toString('base64');
    else
        throw Error("Unknown type passed to toBase64");
}

exports.fromBase64 = function(val) {
    return (val ? new Buffer(val, 'base64') : null);
}
