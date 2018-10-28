# CAF.js (Cloud Assistant Framework)

Co-design permanent, active, stateful, reliable cloud proxies with your web app and gadgets.

See http://www.cafjs.com

## CAF lib cross-application interaction

[![Build Status](https://travis-ci.org/cafjs/caf_crossapp.svg?branch=master)](https://travis-ci.org/cafjs/caf_crossapp)

This repository contains a CAF library that implements interactions between applications.

Applications, even from the same owner, never trust each other. Therefore, cross-app interactions are similar to an external client accessing the target application, i.e., explicit tokens are needed to secure the interaction.

When we want a method open to anybody, e.g., when the arguments to that method are signed tokens that can be validated, we can enable the user `nobody` (see property `allowNobodyUser` in `caf_security`). This bypasses the authentication checks.

## API

See {@link module:caf_crossapp/proxy_crossapp}

## Configuration

### framework.json

See {@link module:caf_crossapp/plug_crossapp}

### ca.json

See {@link module:caf_crossapp/plug_ca_crossapp}
