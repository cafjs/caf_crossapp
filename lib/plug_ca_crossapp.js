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
 * Calls an external app CA method.
 *
 *
 * @module caf_crossapp/plug_ca_crossapp
 * @augments external:caf_components/gen_plug_ca
 */
// @ts-ignore: augments not attached to a class
const assert = /**@ignore @type {typeof import('assert')} */(require('assert'));
const caf_comp = require('caf_components');
const myUtils = caf_comp.myUtils;
const genPlugCA = caf_comp.gen_plug_ca;
const json_rpc = require('caf_transport').json_rpc;

exports.newInstance = async function($, spec) {
    try {

        const that = genPlugCA.create($, spec);

        /*
         * The contents of this variable are always checkpointed before
         * any state externalization (see `gen_transactional`).
         */
        that.state = {};

        // transactional ops
        const target = {
            async callImpl(id, fqn, from, method, args, tokenStr, maxRetries,
                           options) {
                try {
                    const data = await $._.$.crossapp.call(
                        fqn, from, method, args, tokenStr, maxRetries, options
                    );
                    if (that.state.handleMethod) {
                        /* Response processed in a separate transaction, i.e.,
                         using a fresh message */
                        const m = json_rpc.systemRequest(
                            $.ca.__ca_getName__(), that.state.handleMethod,
                            id, data
                        );
                        $.ca.__ca_process__(m, function(err) {
                            err && $.ca.$.log &&
                                $.ca.$.log.error('Got handler exception ' +
                                                 myUtils.errToPrettyStr(err));
                        });
                    } else {
                        const logMsg = 'Ignoring reply ' + JSON.stringify(data);
                        $.ca.$.log && $.ca.$.log.trace(logMsg);
                    }
                    return [];
                } catch (err) {
                    /* If we are here, there was a programming error.
                     `crossapp.call` should never throw, always returning
                     errors in the first entry of a tuple.*/
                    return [err];
                }
            },
            async setHandleReplyMethodImpl(methodName) {
                that.state.handleMethod = methodName;
                return [];
            }
        };

        that.__ca_setLogActionsTarget__(target);

        const checkArgs = function(fqn, from, method, args, tokenStr,
                                   maxRetries, options) {
            const c = json_rpc.splitName(fqn, json_rpc.APP_SEPARATOR);
            assert.equal(c.length, 2, 'Invalid fqn');
            const app = json_rpc.splitName(c[0]);
            assert.equal(app.length, 2, 'Invalid fqn/app');
            const ca = json_rpc.splitName(c[1]);
            assert.equal(ca.length, 2, 'Invalid fqn/ca');
            from && assert.equal(json_rpc.splitName(from).length, 2,
                                 'Invalid from');
            assert.equal(typeof method, 'string', 'Invalid method');
            assert(Array.isArray(args), 'Invalid args');
            tokenStr && assert.equal(typeof tokenStr, 'string',
                                     'Invalid tokenStr');
            maxRetries && assert.equal(typeof maxRetries, 'number',
                                       'Invalid maxRetries');
            options && assert.equal(typeof options, 'object',
                                    'Invalid options');
        };

        that.call = function(fqn, from, method, args, tokenStr, maxRetries,
                             options) {
            checkArgs(fqn, from, method, args, tokenStr, maxRetries, options);
            const id = myUtils.uniqueId();
            const allArgs = [id, fqn, from, method, args, tokenStr, maxRetries,
                             options];
            that.__ca_lazyApply__('callImpl', allArgs);
            return id;
        };

        that.setHandleReplyMethod = function(methodName) {
            that.__ca_lazyApply__('setHandleReplyMethodImpl', [methodName]);
        };

        that.dirtyIsAppRunning = function(app, options) {
            const appArray = json_rpc.splitName(app);
            assert.equal(appArray.length, 2, 'Invalid app name');
            return $._.$.crossapp.isAppRunning(app, options);
        };

        that.dirtyCall = function(fqn, from, method, args, tokenStr,
                                  maxRetries, options) {
            checkArgs(fqn, from, method, args, tokenStr, maxRetries, options);
            return $._.$.crossapp.call(fqn, from, method, args, tokenStr,
                                       maxRetries, options);
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
