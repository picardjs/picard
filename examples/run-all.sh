#!/bin/bash

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

cd 06-static-page-single-spa
npx http-server --port 8086 &
cd ..

cd 07-spa-tractor
npm start & # port is 8087
cd ..

cd 08-ssr-tractor
npm start & # port is 8088
cd ..

cd 09-islands-netflix
npm start & # port is 8089
cd ..

trap 'kill $(jobs -pr)' INT
wait
