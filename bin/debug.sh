#!/bin/sh

# Start Cronicle in debug mode
# No daemon fork, and all logs emitted to stdout
# Add --master to force instant master on startup

DIR=`dirname $0`
PDIR=`dirname $DIR`

node --expose_gc --always_compact $PDIR/lib/main.js --debug --echo --color "$@"
