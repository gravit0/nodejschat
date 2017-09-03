#!/bin/bash
if [[ -f /run/user/1000/node.pid ]]; then
 read PID < /run/user/1000/node.pid;
 echo "Kill $PID"
 kill $PID
fi
node app.js &>> node.log &
#read PID < /run/user/1000/node.pid;
#echo "Start witch $PID"
