#!/bin/bash

cd 06-static-page-single-spa/mfs
./prepare-mfs.sh
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

cd 10-dependencies-sharing/mfs
./prepare-mfs.sh
cd ../..

cd 11-ssr-native-tractor
npm i
npm run build
cd ..

cd 13-spa-tractor-v2-full/mfs
./prepare-mfs.sh
cd ../..
