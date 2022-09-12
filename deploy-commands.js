/* deploys application commands to supported servers in our SQL database
* this should mean there is no way to run a command on a non-supported server
*but should put additional checked in place with any server setup commands
*/

require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv
const fs = require('node:fs')//to read command files
const path = require('node:path')//to read command files
const { REST } = require('@discordjs/rest')//discord API stuff
const { Routes } = require('discord.js')//discord API stuff
const w = require('./tools/winston.js')//for logging
const sql = require('./tools/commonSQL.js')//to get supported servers

/*
//get servers from our SQL
const getservers = async () => {
  const servers = await sql.getRowsForColumn('servers', 'serverid')
  return servers
}//end getservers
*/

var activeServers = []//to store active servers
async function getActiveServers() {
activeServers = await sql.getBotActiveStatus()
return activeServers
 } 

const clientId = '996170261353222219'//our bot ID - this is what we will be registering commands for
const commands = []//start empty
const commandsPath = path.join(__dirname, 'commands')//find path to folder
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))//join all .js files in that folder

function commandfiles() {
for (const file of commandFiles) {//for each file
  const filePath = path.join(commandsPath, file)//join all the filepaths
  const command = require(filePath)//require them as command
  commands.push(command.data.toJSON())//push all commands into commands arrary
}//end for
}//end function commandfiles

const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN)//login to REST API

async function start() {
getActiveServers().then(async servers => {//get supported servers
commandfiles()//build commands from paths
  for (var i = 0; i < servers.length; i++) {//for each server, register commands
  try {
    rest.put(Routes.applicationGuildCommands(clientId, servers[i].serverid), { body: commands })
      .then(() => w.log.info('Successfully registered application commands'))
     .catch(console.error)
  } catch (err) {
   w.log.error('Error adding: ' + servers[i].serverid+ '. Code: ' + err.error.code)
  } 
  }//end for
})//end then
}//end start
start()//run function when npm starts script
module.exports.start = start()
