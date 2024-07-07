#!/bin/bash

cd blue
npm i
npm run build
cd ..
cd green
npm i
npm run build
cd ..
cd red
npm i
npm run build
cd ..
