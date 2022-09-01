#!/bin/sh
#sync repo
echo syncing github
gh repo sync &
wait
#go to directory
echo changing directory
cd /home/abwglv/nftbot/ &
wait
#start bot
echo starting/restarting bot
forever restart -f bot.js|| forever start -f --uid "discord" bot.js &
wait
#delete the logs from last instance of process
echo deleting logs
forever cleanlogs