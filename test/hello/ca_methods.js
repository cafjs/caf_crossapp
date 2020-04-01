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
"use strict";

exports.methods = {
    async __ca_init__() {
        this.$.log.debug("++++++++++++++++Calling init");
        this.state.pulses = 0;
        this.state.nCalls = 0;
        this.state.lastResponse = {};
        this.$.crossapp.setHandleReplyMethod('handler');
        return [];
    },
    async __ca_pulse__() {
        this.state.pulses = this.state.pulses + 1;
        this.$.log.debug('<<< Calling Pulse>>>' + this.state.pulses);
        if (this.state.lastResponse) {
            this.$.log.debug('Last response: ' +
                             JSON.stringify(this.state.lastResponse));
        }
        return [];
    },
    async dirtyCall(fqn, from, method, args, tokenStr) {
        var resp =  await this.$.crossapp.dirtyCall(fqn, from, method, args,
                                                    tokenStr);
        console.log('Dirty call response:' + JSON.stringify(resp));
        return resp;
    },
    async call(fqn, from, method, args, tokenStr) {
        var id = this.$.crossapp.call(fqn, from, method, args, tokenStr);
        this.state.pendingId = id;
        return this.getState();
    },
    async handler(id, response) {
        this.state.lastResponse = {id: id, response: response};
        if (!response[0]) {
            this.state.nCalls = response[1].nCalls;
        }
        return [];
    },
    async getState() {
        return [null, this.state];
    },
    async hello() {
        this.state.nCalls = this.state.nCalls + 1;
        return this.getState();
    },
    async helloError() {
        return [new Error('oops')];
    },
    async helloException() {
        throw new Error('really oops');
    }

};
