#!/bin/bash

cd 06-static-page-single-spa/mfs
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
cd ../..


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
