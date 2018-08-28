#!/bin/sh

# Start Cronicle in debug mode
# No daemon fork, and all logs emitted to stdout
# Add --master to force instant master on startup

HOMEDIR="$(dirname "$(cd -- "$(dirname "$0")" && (pwd -P 2>/dev/null || pwd))")"

cd $HOMEDIR
node --trace-warnings $HOMEDIR/lib/main.js --debug --echo "$@"
