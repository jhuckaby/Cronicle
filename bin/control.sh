#!/bin/sh
#
# Control script designed to allow an easy command line interface
# to controlling any binary.  Written by Marc Slemko, 1997/08/23
# Modified for Cronicle, Joe Huckaby, 2015/08/11
# 
# The exit codes returned are:
#	0 - operation completed successfully
#	2 - usage error
#	3 - binary could not be started
#	4 - binary could not be stopped
#	8 - configuration syntax error
#
# When multiple arguments are given, only the error from the _last_
# one is reported.  Run "*ctl help" for usage info
#
#
# |||||||||||||||||||| START CONFIGURATION SECTION  ||||||||||||||||||||
# --------------------                              --------------------
# 
# the name of your binary
NAME="Cronicle Daemon"
#
# home directory
HOMEDIR="$(dirname "$(cd -- "$(dirname "$0")" && (pwd -P 2>/dev/null || pwd))")"
cd $HOMEDIR
#
# the path to your binary, including options if necessary
BINARY="node --expose_gc --always_compact $HOMEDIR/lib/main.js"
#
# the path to your PID file
PIDFILE=$HOMEDIR/logs/cronicled.pid
#
# --------------------                              --------------------
# ||||||||||||||||||||   END CONFIGURATION SECTION  ||||||||||||||||||||

ERROR=0
ARGV="$@"
if [ "x$ARGV" = "x" ] ; then 
    ARGS="help"
fi

for ARG in $@ $ARGS
do
    # check for pidfile
    if [ -f $PIDFILE ] ; then
		PID=`cat $PIDFILE`
	if [ "x$PID" != "x" ] && kill -0 $PID 2>/dev/null ; then
	    STATUS="$NAME running (pid $PID)"
	    RUNNING=1
	else
	    STATUS="$NAME not running (pid $PID?)"
	    RUNNING=0
	fi
    else
		STATUS="$NAME not running (no pid file)"
		RUNNING=0
    fi

    case $ARG in
    start)
		if [ $RUNNING -eq 1 ]; then
		    echo "$ARG: $NAME already running (pid $PID)"
		    continue
		fi
		echo "$0 $ARG: Starting up $NAME..."
		if $BINARY ; then
		    echo "$0 $ARG: $NAME started"
		else
		    echo "$0 $ARG: $NAME could not be started"
		    ERROR=3
		fi
	;;
    stop)
		if [ $RUNNING -eq 0 ]; then
		    echo "$ARG: $STATUS"
		    continue
		fi
		if kill $PID ; then
	            while [ "x$PID" != "x" ] && kill -0 $PID 2>/dev/null ; do
	                sleep 1;
	            done
		    echo "$0 $ARG: $NAME stopped"
		else
		    echo "$0 $ARG: $NAME could not be stopped"
		    ERROR=4
		fi
	;;
    restart)
        $0 stop start
	;;
    cycle)
        $0 stop start
	;;
	status)
		echo "$ARG: $STATUS"
	;;
	setup)
		node $HOMEDIR/bin/storage-cli.js setup
		exit
	;;
	setup_and_start)
		# Only run setup when setup needs to be done
		if [ ! -f $HOMEDIR/data/.setup_done ]; then
			$HOMEDIR/bin/control.sh setup

			mv $HOMEDIR/conf/config.json $HOMEDIR/conf/config.json.origin

			if [ -f $HOMEDIR/data/config.json.import ]; then
				# Move in custom configuration
				cp $HOMEDIR/data/config.json.import $HOMEDIR/conf/config.json
			else
				# Use default configuration with changes through ENV variables
				_WEBSERVER_HTTP_PORT=${WEBSERVER_HTTP_PORT:-3012}

				cat $HOMEDIR/conf/config.json.origin | \
					jq ".web_socket_use_hostnames = ${WEB_SOCKET_USE_HOSTNAMES:-1}" | \
					jq ".server_comm_use_hostnames = ${SERVER_COMM_USE_HOSTNAMES:-1}" | \
					jq ".WebServer.http_port = ${_WEBSERVER_HTTP_PORT}" | \
					jq ".WebServer.https_port = ${WEBSERVER_HTTPS_PORT:-443}" | \
					jq ".base_app_url = \"${BASE_APP_URL:-http://${HOSTNAME}:${WEBSERVER_HTTP_PORT}}\"" \
					> $HOMEDIR/conf/config.json
			fi

			# Marking setup done
			touch $HOMEDIR/data/.setup_done
		fi
		exec $HOMEDIR/bin/debug.sh start
	;;
	maint)
		node $HOMEDIR/bin/storage-cli.js maint $2
		exit
	;;
	admin)
		node $HOMEDIR/bin/storage-cli.js admin $2 $3
		exit
	;;
	export)
		node $HOMEDIR/bin/storage-cli.js export $2 $3 $4
		exit
	;;
	import)
		if [ $RUNNING -eq 1 ]; then
		    $0 stop
		fi
		node $HOMEDIR/bin/storage-cli.js import $2 $3 $4
		exit
	;;
	upgrade)
		node $HOMEDIR/bin/install.js $2 || exit 1
		exit
	;;
	migrate)
		node $HOMEDIR/bin/storage-migrate.js $2 $3 $4
		exit
	;;
	version)
		PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
		echo "$PACKAGE_VERSION"
		exit
	;;
    *)
	echo "usage: $0 (start|stop|cycle|status|setup|maint|admin|export|import|upgrade|help)"
	cat <<EOF

start      - Starts $NAME.
stop       - Stops $NAME and wait until it actually exits.
restart    - Calls stop, then start (hard restart).
status     - Checks whether $NAME is currently running.
setup      - Runs initial storage setup.
maint      - Runs daily maintenance routine.
admin      - Creates new emergency admin account (specify user / pass).
export     - Exports data to specified file.
import     - Imports data from specified file.
upgrade    - Upgrades $NAME to the latest stable (or specify version).
migrate    - Migrate storage data to another location.
version    - Outputs the current $NAME package version.
help       - Displays this screen.

EOF
	ERROR=2
    ;;

    esac

done

exit $ERROR

## ====================================================================
## The Apache Software License, Version 1.1
##
## Copyright (c) 2000 The Apache Software Foundation.  All rights
## reserved.
##
## Redistribution and use in source and binary forms, with or without
## modification, are permitted provided that the following conditions
## are met:
##
## 1. Redistributions of source code must retain the above copyright
##    notice, this list of conditions and the following disclaimer.
##
## 2. Redistributions in binary form must reproduce the above copyright
##    notice, this list of conditions and the following disclaimer in
##    the documentation and/or other materials provided with the
##    distribution.
##
## 3. The end-user documentation included with the redistribution,
##    if any, must include the following acknowledgment:
##       "This product includes software developed by the
##        Apache Software Foundation (http://www.apache.org/)."
##    Alternately, this acknowledgment may appear in the software itself,
##    if and wherever such third-party acknowledgments normally appear.
##
## 4. The names "Apache" and "Apache Software Foundation" must
##    not be used to endorse or promote products derived from this
##    software without prior written permission. For written
##    permission, please contact apache@apache.org.
##
## 5. Products derived from this software may not be called "Apache",
##    nor may "Apache" appear in their name, without prior written
##    permission of the Apache Software Foundation.
##
## THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
## WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
## OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
## DISCLAIMED.  IN NO EVENT SHALL THE APACHE SOFTWARE FOUNDATION OR
## ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
## SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
## LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF
## USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
## ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
## OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
## OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
## SUCH DAMAGE.
## ====================================================================
##
## This software consists of voluntary contributions made by many
## individuals on behalf of the Apache Software Foundation.  For more
## information on the Apache Software Foundation, please see
## <http://www.apache.org/>.
##
## Portions of this software are based upon public domain software
## originally written at the National Center for Supercomputing Applications,
## University of Illinois, Urbana-Champaign.
##
# 
