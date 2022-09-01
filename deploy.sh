#!/bin/sh
# stopall
echo stopping processes
forever stopall &
wait
#sync repo
echo syncing github
gh repo sync &
wait
#go to directory
echo changing directory
cd /home/abwglv/nftbot/ &
wait
#start bot
echo starting bot
forever start bot.js &
wait
#delete the logs from last instance of process
echo deleting logs
forever cleanlogs