#!/bin/bash
read PID < node.pid;
kill $PID
node app.js >> node.log &
