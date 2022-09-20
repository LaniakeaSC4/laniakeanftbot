# Laniakea Bot Version 2.1 - 01/09/2022

## Ideas and Features

* Setup a dev environment
* Roll a new VM using instructions below to split sql databse onto another drive
* allow servers to set a low/high limit of what snipes they would like to see.
* trait specific snipe channels
* Single feed module
* Collection vote 

### Crypto Coral Tribe Ideas

* Master filter for all collections in a server only allow added collections through to the main channels
* Multiple 'home channels' - then users can do reaction roles to get access to them
* allow other admins or all users to add collections (other admins at first?)
* server specific controls on the snipelimits
* allow particular server to use howrare.is ranking for a particular collection

## done

* can only add collections which have #123 nft id in the name. Need a better way to get the nft ids. Need to check what data comes back from metaplex. If there is a nft id in there, then I can pull from my databse with that as a reference? Could test with `https://magiceden.io/marketplace/adagio_tvs` as the name format dosent have #
* need to be able to restart bot or update collections after new one is added. For that, need to be able to break the interval loops which are running and initialise again. SetInterval should give back an id to break it, but my current setintetval setup is weird in a Promise.all loop. Can that be simplified?
* delete trait rarity from database. Don't think we need them

## npm packages (package.json)

After migrating to GCP these are the installed npm packages:

* engines
    * "node": "18.8.0"
      * latest version at the time. Not doing anyting too crazy with node so latest version should generally work. Should be safe enough to apply updates. 
    * "npm": "8.18.0"
      *  Again, latest npm version at setup time. Shouldn't be much issue updating this.

 * dependencies
    * "@google-cloud/logging-winston": "^5.1.4"
      * For cloud logging to Google cloud logs. Could possibly look to change this to papertrail or something else
    * "@metaplex-foundation/js": "0.15.0"
      * Javascript library for getting NFT details from blockchain by RPC. Needs private node for some of the functions we need (e.g getting metadata).
      * https://github.com/metaplex-foundation/js
      * Creates a Metaplex client which accepts a Connection instance from `@solana/web3.js` that will be used to communicate with the cluster.
    * "@solana/web3.js": "*"
      * Used by metaplex (`@metaplex-foundation/js`) to create connections to the solana blockchain.
      * Current working version at time of writing is 1.56.2, but I am installing latest as I don't anticipate chnages with this package.
      * Is this package large? Can I import/install only a small part of it?
      * https://www.npmjs.com/package/@solana/web3.js
    * "discord.js": "14.2.0",
      * latest version of discord. Upgraded my code from v13 in August 2022.
      * https://discord.js.org/
    * "dotenv": "*"
      * npm module to import javascript environment variables.
      * Using this in very basic way, so always installing latest version. Working version at time of writing was 16.0.1
      * https://www.npmjs.com/package/dotenv
    * "pg": "8.7.3"
      * npm postgres connection module.
      * https://www.npmjs.com/package/pg
    * "request": "2.81.0"
      * This isn't needed? Removed it from package.json 03/09/22
    * "winston": "^3.8.1"
      * Core winston client for cloud logging. Currently logging to Google cloud with `@google-cloud/logging-winston`
      * ^ before version number means 'compatible with this version number'
      * https://www.npmjs.com/package/winston


## Linux setup

### VM

Google Cloud Compute Engine e2-micro (0.25 vcpu, 1GB ram)

### Installed packages

#### node

`sudo apt update`
`sudo apt install nodejs`

#### npm

should come with node, check version

#### postgresql

Had some problems with this as I was originaly on a debian 10 VM. Changed to ubuntu VM and followed this guide 

`https://computingforgeeks.com/how-to-install-postgresql-14-on-debian/`

* `sudo apt update && sudo apt upgrade`
* `sudo apt -y install gnupg2 wget vim`
* `sudo apt-cache search postgresql | grep postgresql`
* `sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'`
* `wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -`
* `sudo apt -y update`
* `sudo apt install postgresql-14`

postgresql is on same disk as boot. Would have been better to store databse on seperate disk and attach to VM so I can take snapshots of the host VM without needing to snapshot the postgres data. Can't shrink a gcp VM though (at least not easily) so gave up on this for now.

if I can ever seperate disks, then this might be useful.

https://www.digitalocean.com/community/tutorials/how-to-move-a-postgresql-data-directory-to-a-new-location-on-ubuntu-16-04

#### forever

`https://www.npmjs.com/package/forever`

as global npm package: install: `sudo npm install forever -g`

I'm starting/restarting in my bot start bash script with `forever restart -f bot.js|| forever start -a -f --uid "discord" bot.js`

#### logrotate

Installed version 3.19.0

`sudo apt update`
`sudo apt install logrotate`

made a new file `discord` in `/etc/logrotate.d` with contents

```
/home/abwglv/.forever/discord.log {
  daily
  missingok
  rotate 7
  compress
  notifempty
  #create 664 abwglv
  copytruncate
}
```

forever log will always be discord.log as we specified uid discord in our forever start script

`forever start -a -f --uid "discord" bot.js`

Logrotate automatically runs daily once installed and will pick up config added to `/etc/logrotate.d`
