#!/bin/sh

mkdir -p target
cat log.js busfactor.js > target/out.js
jshint target/out.js