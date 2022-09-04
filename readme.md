# npm packages

## Version 2.1 - 01/09/2022

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


# Linux setup

## VM

Google Cloud Compute Engine e2-micro (0.25 vcpu, 1GB ram)

## Installed packages

### node

`sudo apt update`
`sudo apt install nodejs`

### npm

should come with node, check version

### postgresql

had some problems with this as I was originaly on a debian 10 VM. Changed to ubuntu VM and followed this guide 

`https://computingforgeeks.com/how-to-install-postgresql-14-on-debian/`

> `sudo apt update && sudo apt upgrade`
> `sudo apt -y install gnupg2 wget vim`
> `sudo apt-cache search postgresql | grep postgresql`
> `sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'``
> `wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -`
> `sudo apt -y update`
> `sudo apt install postgresql-14`

*forever
*logrotate
