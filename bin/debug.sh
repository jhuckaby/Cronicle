#!/bin/sh

# Start Cronicle in debug mode
# No daemon fork, and all logs emitted to stdout
# Add --master to force instant master on startup

SCRIPT=`perl -MCwd -le 'print Cwd::abs_path(shift)' "$0"`
DIR=`dirname $SCRIPT`
HOMEDIR=`dirname $DIR`

cd $HOMEDIR
node --expose_gc --always_compact $HOMEDIR/lib/main.js --debug --echo "$@"
