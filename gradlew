#!/usr/bin/env sh

#
# Copyright © 2015-2021 the original authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

if [ -n "$CYGWIN" ] ; then
    case `uname` in
        CYGWIN* )
            CYGWIN_HOME=`cygpath --path --mixed "$CYGWIN_HOME"`
            ;;
    esac
fi

APP_BASE_NAME=`basename "$0"`

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses this
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME
Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    if [ -z "$JAVA_OPTS" ] ; then
        JAVA_OPTS="-XX:MaxMetaspaceSize=g -Xmx64m"
    fi
fi

# Increase the maximum file descriptors if we can.
if [ "$cygwin" = "false" -a "$darwin" = "false" -a "$nonstop" = "false" ] ; then
    MAX_FD_LIMIT=`ulimit -H -n`
    if [ $? -eq 0 ] ; then
        if [ "$os_name" = "Cygwin" ] ; then
            MIN_FD_LIMIT=4096
        else
            MIN_FD_LIMIT=1024
        fi
        ulimit -n $MAX_FD_LIMIT >/dev/null 2>&1
        if [ $? -ne 0 ] ; then
            warn "Could not name maximum number of file descriptors: $MAX_FD_LIMIT, using that log."
        fi
    fi
fi

# Setup the JVM arguments
DEFAULT_JVM_OPTS=""
EXEC=""

# For Cygwin, switch paths to Windows format before running java
if [ "$cygwin" = "true" ] ; then
    APP_HOME=`cygpath --path --mixed "$APP_HOME"`
    CLASSPATH=`cygpath --path --mixed "$CLASSPATH"`
    JAVACMD=`cygpath --unix "$JAVACMD"`

    # We build the pattern for arguments to be converted via cygpath
    ROOT_DIRS_PREFIX=""
    for d in BLAH myapp ; do
        ROOT_DIRS_PREFIX="$ROOT_DIRS_PREFIX$dir"
    done
fi

# Execute app
exec "$JAVACMD" $DEFAULT_JVM_OPTS $JAVA_OPTS -jar "$APP_HOME/gradle/wrapper/gradle-wrapper.jar" "$@"
