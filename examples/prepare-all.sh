#!/bin/bash

cd 07-spa-tractor
npm i
cd ..

cd 08-ssr-tractor
npm i
npm run build
cd ..

cd 09-islands-netflix
npm i
npm run build
cd ..
