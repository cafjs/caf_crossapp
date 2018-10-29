"use strict"


var hello = require('./hello/main.js');
var app = hello;

var caf_core= require('caf_core');
var caf_comp = caf_core.caf_components;
var myUtils = caf_comp.myUtils;
var async = caf_comp.async;
var cli = caf_core.caf_cli;

var crypto = require('crypto');

var APP_FULL_NAME = 'root-test';

var CA_OWNER_1='me'+ crypto.randomBytes(8).toString('hex');
var CA_LOCAL_NAME_1='ca1';
var FROM_1 =  CA_OWNER_1 + '-' + CA_LOCAL_NAME_1;
var FQN_1 = APP_FULL_NAME + '#' + FROM_1;

var CA_OWNER_2=CA_OWNER_1;
var CA_LOCAL_NAME_2='ca2';
var FROM_2 =  CA_OWNER_2 + '-' + CA_LOCAL_NAME_2;
var FQN_2 = APP_FULL_NAME + '#' + FROM_2;

process.on('uncaughtException', function (err) {
               console.log("Uncaught Exception: " + err);
               console.log(myUtils.errToPrettyStr(err));
               process.exit(1);

});

module.exports = {
    setUp: function (cb) {
       var self = this;
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
        var self = this;
        if (!this.$) {
            cb(null);
        } else {
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },

    call: function(test) {
        var self = this;
        var s1, s2, s3;
        var from1 = FROM_1;
        var from2 = FROM_2;
        test.expect(15);
        var lastId;
        async.series(
            [
                function(cb) {
                    s1 = new cli.Session('ws://root-test.vcap.me:3000', from1, {
                        from : from1
                    });
                    s1.onopen = async function() {
                        try {
                            var d = await s1.dirtyCall(FQN_2, from2, 'hello',
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
                        var d = await s1.dirtyCall(FQN_2, from2, 'helloError',
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
                        var d = await s1.dirtyCall(FQN_2, from2,
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
                        var d = await s1.dirtyCall(FQN_2, from2, 'hello',
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
                        var d = await s1.call(FQN_2, from2,
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
                        var d = await s1.getState().getPromise();
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
                        var d = await s1.call(FQN_2, from2,
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
                        var d = await s1.getState().getPromise();
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
                        var d = await s1.call(FQN_2, from2,
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
                        var d = await s1.getState().getPromise();
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
