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
 *  Properties:
 *
 *          {appProtocol: string, appSuffix: string, strictArgs: boolean}
 *
 * where:
 *
 * * `appProtocol`: protocol to contact the CA, e.g., `https`.
 * * `appSuffix`: the URL suffix, e.g., `cafjs.com`.
 * * `strictArgs`: whether the number of arguments should match, or extra
 * arguments provided can be ignored.
 *
 * @module caf_crossapp/plug_crossapp
 * @augments external:caf_components/gen_plug
 */
// @ts-ignore: augments not attached to a class
var assert = require('assert');
var caf_comp = require('caf_components');
var genPlug = caf_comp.gen_plug;
var json_rpc = require('caf_transport').json_rpc;
var cli = require('caf_cli');


exports.newInstance = async function($, spec) {
    try {
        var that = genPlug.constructor($, spec);
        $._.$.log && $._.$.log.debug('New CrossApp plug');

        assert.equal(typeof spec.env.appProtocol, 'string',
                     "'spec.env.appProtocol' not a string");

        assert.equal(typeof spec.env.appSuffix, 'string',
                     "'spec.env.appSuffix' not a string");

        assert.equal(typeof spec.env.strictArgs, 'boolean',
                     "'spec.env.strictArgs' not a boolean");


        var callImpl = async function(session, method, args) {
            try {
                var f = session[method];
                var data = await f.apply(session, args).getPromise();
                return [null, data];
            } catch (err) {
                if ((!spec.env.strictArgs) &&
                    Array.isArray(err['expectedArgs']) &&
                    (err['expectedArgs'].length < args.length)) {
                    var newArgs = args.slice(0, err['expectedArgs'].length);
                    return callImpl(session, method, newArgs);
                } else {
                    return [err];
                }
            }
        };

        /*
         * Calls a CA method of an external application.
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
         * ignored (if `strictArgs` is false).
         * @param {string=} tokenStr An optional serialized token for the
         * request that authenticates the client described in `from`.
         *
         * @return {Promise<Array.<Object>>}  A promise that we can `await` to
         * block further message processing. This array is a tuple using the
         * standard  `[Error, jsonType]` CAF.js convention. The `Error` has
         * a boolean field `isSystemError` set to `true` when the session was
         * closed with an error, and `false` when it was an application error.
         */
        that.call = async function(fqn, from, method, args, tokenStr) {
            return new Promise((resolve, reject) => {
                try {
                    var split = json_rpc.splitName(fqn, json_rpc.APP_SEPARATOR);
                    var appName = split[0];
                    var caId = split[1];
                    from = (from ? from : caId);
                    var appFullName = appName + '.' + spec.env.appSuffix;
                    var caURL = spec.env.appProtocol + '://' + appFullName;

                    var session = new cli.Session(caURL, caId, {
                        from: from,
                        token: tokenStr,
                        disableBackchannel: true,
                        log: function(msg) {
                            $._.$.log && $._.$.log.debug(msg);
                        }
                    });

                    session.onopen = async function() {
                        try {
                            resolve(await callImpl(session, method, args));
                            session.close();
                        } catch (err) {
                            session.close(err);
                        }
                    };

                    session.onclose = function(err) {
                        if (err) {
                            err['isSystemError'] = true;
                            resolve([err]);
                        }
                    };
                } catch (err) {
                    reject([err]);
                }
            });
        };

        return [null, that];
    } catch (err) {
        return [err];
    }
};
