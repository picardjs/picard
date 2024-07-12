#!/bin/bash

cd checkout
node build.js
cd ..
cd decide
node build.js
cd ..
cd explore
node build.js
cd ..
