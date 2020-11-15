// Modifications copyright 2020 Caf.js Labs and contributors
/*!
 Copyright 2013 Hewlett-Packard Development Company, L.P.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

/**
 *  Proxy that allows a CA to call an external app.
 *
 * @module caf_crossapp/proxy_crossapp
 * @augments external:caf_components/gen_proxy
 */
// @ts-ignore: augments not attached to a class
const caf_comp = require('caf_components');
const genProxy = caf_comp.gen_proxy;

exports.newInstance = async function($, spec) {
    try {
        const that = genProxy.create($, spec);

        /**
         * Calls in a non-transactional way a CA method of an external
         * application.
         *
         * There is no checkpointing for this action, and this call may never
         * be executed if, e.g., the server fails.
         *
         * Using `await` on the returned promise we can stop processing new
         * messages for this CA until the response arrives.
         *
         * @param {string} fqn A fully qualified CA name for the target, e.g.,
         * `root-helloworld#antonio-x1`.
         * @param {string=} from A client CA name for the request, e.g.,
         * `antonio-x2`. When missing, the name of the target CA in `fqn` is
         * used.
         * @param {string} method The CA's method to invoke.
         * @param {Array.<jsonType>} args Arguments for the method invocation.
         * When the method requires fewer arguments, the extra arguments are
         * ignored (if the `strictArgs` option is false).
         * @param {string=} tokenStr An optional serialized token for the
         * request that authenticates the client described in `from`.
         * @param {number=} maxRetries Number of retries before giving up.
         * The default is to retry forever.
         *
         * @return {Promise<Array.<Object>>}  A promise that we can `await` to
         * block further message processing. This array is a tuple using the
         * standard  `[Error, jsonType]` CAF.js convention. The `Error` has
         * a boolean field `isSystemError` set to `true` when the session was
         * closed with an error, and `false` when it was an application error.
         *
         * @throws {Error} When arguments are invalid.
         *
         * @memberof! module:caf_crossapp/proxy_crossapp#
         * @alias dirtyCall
         */
        that.dirtyCall = function(fqn, from, method, args, tokenStr,
                                  maxRetries) {
            return $._.dirtyCall(fqn, from, method, args, tokenStr, maxRetries);
        };

        /**
         * Calls in a transactional way a CA method of an external
         * application.
         *
         * The action is checkpointed first, executing at least once. Calls do
         * not block message processing for this CA, and responses can be
         * arbitrarily interleaved with new requests.
         *
         *
         * @param {string} fqn A fully qualified CA name for the target, e.g.,
         * `root-helloworld#antonio-x1`.
         * @param {string=} from A client CA name for the request, e.g.,
         * `antonio-x2`. When missing, the name of the target CA in `fqn` is
         * used.
         * @param {string} method The CA's method to invoke.
         * @param {Array.<jsonType>} args Arguments for the method invocation.
         * When the method requires fewer arguments, the extra arguments are
         * ignored (if the `strictArgs` option is false).
         * @param {string=} tokenStr An optional serialized token for the
         * request that authenticates the client described in `from`.
         * @param {number=} maxRetries Number of retries before giving up.
         * The default is to retry forever.
         *
         * @return {string} A unique identifier to match
         * replies for this request.
         *
         * @throws {Error} When arguments are invalid.
         *
         * @memberof! module:caf_crossapp/proxy_crossapp#
         * @alias call
         */
        that.call = function(fqn, from, method, args, tokenStr, maxRetries) {
            return $._.call(fqn, from, method, args, tokenStr, maxRetries);
        };


        /**
         * Checks whether an app is running.
         *
         * The check is non-transactional and blocks the processing of the
         * current message by using `await` on the returned promise.
         *
         * @param {string} app An app name, e.g., `root-helloworld`.
         *
         * @return {Promise<boolean>}  A promise that resolves to `true` if
         * the app is running, `false` otherwise.
         *
         * @memberof! module:caf_crossapp/proxy_crossapp#
         * @alias dirtyIsAppRunning
         */
        that.dirtyIsAppRunning = function(app) {
            return $._.dirtyIsAppRunning(app);
        };

        /**
         * Sets the name of the method in this CA that will process
         * reply call messages.
         *
         * To ignore replies, just set it to `null`.
         *
         * The type of the method is `async function(requestId, response)`
         *
         * where:
         *
         *  *  `requestId`: is an unique identifier to match the request.
         *  *  `response` is a tuple using the standard  `[Error, jsonType]`
         * CAF.js convention. The `Error` has a boolean field `isSystemError`
         * set to `true` when the session was closed with an error, and `false`
         * when it was an application error.
         *
         * @param {string| null} methodName The name of this CA's method that
         *  process replies.
         *
         * @memberof! module:caf_crossapp/proxy_crossapp#
         * @alias setHandleReplyMethod
         *
         */
        that.setHandleReplyMethod = function(methodName) {
            $._.setHandleReplyMethod(methodName);
        };

        Object.freeze(that);

        return [null, that];
    } catch (err) {
        return [err];
    }
};
