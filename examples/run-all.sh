#!/bin/bash

trap 'kill 0' SIGINT

cd 01-static-page
npx http-server --port 8081 &
cd ..

cd 02-static-page-feed
npx http-server --port 8082 &
cd ..

cd 03-static-page-slots
npx http-server --port 8083 &
cd ..

cd 04-static-page-initial-state
npx http-server --port 8084 &
cd ..

cd 05-static-page-with-routing
npx http-server --port 8085 &
cd ..

cd 07-spa-tractor
npm i
npm start &
cd ..

cd 08-ssr-tractor
npm i && npm run build
npm start &
cd ..
