#!/bin/bash

if [ $1 = "--master" ]; then
    echo "Running as master"
    npm start
else
   echo "Running as slave"
   npm run server
fi

echo "tail logs"
cd logs/
tail -f /dev/null
