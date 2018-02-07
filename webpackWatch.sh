#!/bin/bash

if [[ $1 = "-dev" ]]; then

./node_modules/webpack/bin/webpack.js --config ./webpack.dev.config.js --watch

else

./node_modules/webpack/bin/webpack.js --config ./webpack.min.config.js

fi
