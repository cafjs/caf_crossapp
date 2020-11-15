"use strict"


const hello = require('./hello/main.js');
const app = hello;

const caf_core= require('caf_core');
const caf_comp = caf_core.caf_components;
const myUtils = caf_comp.myUtils;
const async = caf_comp.async;
const cli = caf_core.caf_cli;

const crypto = require('crypto');

const APP_FULL_NAME = 'root-test';

const CA_OWNER_1='me'+ crypto.randomBytes(8).toString('hex');
const CA_LOCAL_NAME_1='ca1';
const FROM_1 =  CA_OWNER_1 + '-' + CA_LOCAL_NAME_1;
const FQN_1 = APP_FULL_NAME + '#' + FROM_1;

const CA_OWNER_2=CA_OWNER_1;
const CA_LOCAL_NAME_2='ca2';
const FROM_2 =  CA_OWNER_2 + '-' + CA_LOCAL_NAME_2;
const FQN_2 = APP_FULL_NAME + '#' + FROM_2;

process.on('uncaughtException', function (err) {
               console.log("Uncaught Exception: " + err);
               console.log(myUtils.errToPrettyStr(err));
               process.exit(1);

});

module.exports = {
    setUp: function (cb) {
       const self = this;
        app.init( {name: 'top'}, 'framework.json', null,
                      function(err, $) {
                          if (err) {
                              console.log('setUP Error' + err);
                              console.log('setUP Error $' + $);
                              // ignore errors here, check in method
                              cb(null);
                          } else {
                              self.$ = $;
                              cb(err, $);
                          }
                      });
    },
    tearDown: function (cb) {
        const self = this;
        if (!this.$) {
            cb(null);
        } else {
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },

    call: function(test) {
        const self = this;
        var s1, s2, s3;
        const from1 = FROM_1;
        const from2 = FROM_2;
        test.expect(16);
        var lastId;
        async.series(
            [
                function(cb) {
                    s1 = new cli.Session('ws://root-test.vcap.me:3000', from1, {
                        from : from1
                    });
                    s1.onopen = async function() {
                        try {
                            const d = await s1.dirtyCall(FQN_2, from2, 'hello',
                                                         [], null).getPromise();
                            test.equals(d.nCalls, 1);
                            cb(null, d);
                        } catch (err) {
                            test.ok(false, 'Got exception ' + err);
                            cb(err);
                        }
                    };
                },
                // application error propagation
                async function(cb) {
                    try {
                        const d = await s1.dirtyCall(FQN_2, from2, 'helloError',
                                                     [], null).getPromise();
                        test.ok(false, 'Should get  exception ');
                        cb(null, d);
                    } catch (err) {
                        test.ok(err && (!err.isSystemError),
                                'Got invalid exception ' + err);
                        cb(null);
                    }
                },
                // system error propagation
                async function(cb) {
                    try {
                        const d = await s1.dirtyCall(FQN_2, from2,
                                                     'helloException',
                                                     [], null).getPromise();
                        test.ok(false, 'Should get  exception ');
                        cb(null, d);
                    } catch (err) {
                        test.ok(err && (err.isSystemError),
                                'Got invalid exception ' + err);
                        cb(null);
                    }
                },
                // extra arguments ok
                async function(cb) {
                    try {
                        const d = await s1.dirtyCall(FQN_2, from2, 'hello',
                                                     [1,2], null).getPromise();
                        test.equals(d.nCalls, 2);
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },

                // transactional call
                async function(cb) {
                    try {
                        const d = await s1.call(FQN_2, from2,
                                                'hello',
                                                [], null).getPromise();
                        test.ok(d.pendingId, 'should get an id');
                        lastId = d.pendingId;
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                async function(cb) {
                    try {
                        const d = await s1.getState().getPromise();
                        test.equal(d.pendingId, lastId, 'should get same id');
                        test.equals(d.nCalls, 3);
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                // transactional call with error
                async function(cb) {
                    try {
                        const d = await s1.call(FQN_2, from2,
                                                'helloError',
                                                [], null).getPromise();
                        test.ok(d.pendingId, 'should get an id');
                        lastId = d.pendingId;
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                async function(cb) {
                    try {
                        const d = await s1.getState().getPromise();
                        test.equal(d.pendingId, lastId, 'should get same id');
                        test.ok(d.lastResponse.response[0], 'No error');
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                // transactional call with exception
                async function(cb) {
                    try {
                        const d = await s1.call(FQN_2, from2,
                                                'helloException',
                                                [], null).getPromise();
                        test.ok(d.pendingId, 'should get an id');
                        lastId = d.pendingId;
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                async function(cb) {
                    try {
                        const d = await s1.getState().getPromise();
                        test.equal(d.pendingId, lastId, 'should get same id');
                        test.ok(d.lastResponse.response[0] &&
                                d.lastResponse.response[0].isSystemError,
                                'No error');
                        cb(null, d);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                async function(cb) {
                    try {
                        const isRunning =  await s1.isAppRunning(APP_FULL_NAME)
                              .getPromise();
                        test.ok(isRunning);
                        cb(null, isRunning);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        cb(err);
                    }
                },
                function(cb) {
                    s1.onclose = function(err) {
                        test.ifError(err);
                        cb(null, null);
                    };
                    s1.close();
                }
            ], function(err, res) {
                test.ifError(err);
                test.done();
            });
    }


};
