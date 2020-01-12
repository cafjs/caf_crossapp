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
var assert = require('assert');
var caf_comp = require('caf_components');
var myUtils = caf_comp.myUtils;
var genPlugCA = caf_comp.gen_plug_ca;
var json_rpc = require('caf_transport').json_rpc;

exports.newInstance = async function($, spec) {
    try {

        var that = genPlugCA.constructor($, spec);

        /*
         * The contents of this variable are always checkpointed before
         * any state externalization (see `gen_transactional`).
         */
        that.state = {};

        // transactional ops
        var target = {
            async callImpl(id, fqn, from, method, args, tokenStr) {
                try {
                    var data = await $._.$.crossapp.call(fqn, from, method,
                                                         args, tokenStr);
                    if (that.state.handleMethod) {
                        /* Response processed in a separate transaction, i.e.,
                         using a fresh message */
                        var m = json_rpc.systemRequest($.ca.__ca_getName__(),
                                                       that.state.handleMethod,
                                                       id, data);
                        $.ca.__ca_process__(m, function(err) {
                            err && $.ca.$.log &&
                                $.ca.$.log.error('Got handler exception ' +
                                                 myUtils.errToPrettyStr(err));
                        });
                    } else {
                        var logMsg = 'Ignoring reply ' + JSON.stringify(data);
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

        var checkArgs = function(fqn, from, method, args, tokenStr) {
            var c = json_rpc.splitName(fqn, json_rpc.APP_SEPARATOR);
            assert.equal(c.length, 2, 'Invalid fqn');
            var app = json_rpc.splitName(c[0]);
            assert.equal(app.length, 2, 'Invalid fqn/app');
            var ca = json_rpc.splitName(c[1]);
            assert.equal(ca.length, 2, 'Invalid fqn/ca');
            from && assert.equal(json_rpc.splitName(from).length, 2,
                                 'Invalid from');
            assert.equal(typeof method, 'string', 'Invalid method');
            assert(Array.isArray(args), 'Invalid args');
            tokenStr && assert.equal(typeof tokenStr, 'string',
                                     'Invalid tokenStr');
        };

        that.call = function(fqn, from, method, args, tokenStr) {
            checkArgs(fqn, from, method, args, tokenStr);
            var id = myUtils.uniqueId();
            var allArgs = [id, fqn, from, method, args, tokenStr];
            that.__ca_lazyApply__('callImpl', allArgs);
            return id;
        };

        that.setHandleReplyMethod = function(methodName) {
            that.__ca_lazyApply__('setHandleReplyMethodImpl', [methodName]);
        };

        that.dirtyCall = function(fqn, from, method, args, tokenStr) {
            checkArgs(fqn, from, method, args, tokenStr);
            return $._.$.crossapp.call(fqn, from, method, args, tokenStr);
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
