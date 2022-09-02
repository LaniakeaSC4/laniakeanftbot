require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv
var discord = require('./clients/discordclient.js')
const client = discord.getClient()
const { Collection } = require('discord.js')

const fs = require('node:fs')
const path = require('node:path')
const w = require('./tools/winston.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const sniperv2 = require('./sniper/v2/sniper-v2.js')

//start services
client.on('ready', async () => {

  w.log.info('Warp drive activated');
  sniperv2.initialise()

})//end client.on Ready

//======================
//==== Command Setup  ===
//======================

//setup commands - this adds them to the client at client.commands
client.commands = new Collection()//collection is discord fancy arrary with extended functionality
const commandsPath = path.join(__dirname, 'commands')//all commands are at ./commands/
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))//only .js files

for (const file of commandFiles) {//for each command file
  const filePath = path.join(commandsPath, file)//join all the files
  const command = require(filePath)//import each one with requrie
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command)
}//end for each command file

//=======================
//==== Command reply  ===
//=======================

//send slash interactions back to thier respective command file
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return//if this interaction isnt a slash command
  const command = client.commands.get(interaction.commandName)//get name
  if (!command) return//if no name stop

  try {
    await command.execute(interaction)//execute in command file
  } catch (error) {
    w.log.info(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }//end catch
})//end on interactionCreate

//button interactions
const setup = require('./tools/serversetup.js')
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'beginsetup') {
    var setupstatus = await setup.start(interaction)
    if (setupstatus) { w.log.info('setup status was sucessful') }
  }//end if button is 'beginsetup'
})//end on interactionCreate 
