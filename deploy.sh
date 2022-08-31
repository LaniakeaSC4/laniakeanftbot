#!/bin/sh
#stop
forever stopall
#sync repo
gh repo sync
#restart
forever start bot.js