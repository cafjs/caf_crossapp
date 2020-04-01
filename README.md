# Caf.js

Co-design permanent, active, stateful, reliable cloud proxies with your web app and gadgets.

See https://www.cafjs.com

## Library for cross-application interaction

[![Build Status](https://travis-ci.org/cafjs/caf_crossapp.svg?branch=master)](https://travis-ci.org/cafjs/caf_crossapp)

This repository contains a `Caf.js` library that enables interactions between applications.

Applications, even from the same owner, never trust each other. Cross-app interactions are similar to an external client accessing the target application, i.e., security tokens are needed to authenticate the interaction.

To enable methods to be called by anybody, we can enable the user `nobody` (see property `allowNobodyUser` in `caf_security`), and this bypasses the authentication checks for that user. Security can then rely on, for example, signed tokens explicitly passed as arguments to the method. The application `caf_gadget` follows this approach.

## API

See {@link module:caf_crossapp/proxy_crossapp}

## Configuration

### framework.json

See {@link module:caf_crossapp/plug_crossapp}

### ca.json

See {@link module:caf_crossapp/plug_ca_crossapp}
