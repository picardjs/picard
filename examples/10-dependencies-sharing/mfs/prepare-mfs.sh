#!/bin/bash

cd nat-fed-1
npm i
npm run build
cd ..
cd nat-fed-2
npm i
npm run build
cd ..
cd pilet
npm i
npm run build
cd ..
cd rp-mod-fed
npm i
npm run build
cd ..
cd wp-mod-fed
npm i
npm run build
cd ..
