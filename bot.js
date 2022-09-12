require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv
var discord = require('./clients/discordclient.js')
const client = discord.getClient()
const { Collection, PermissionsBitField } = require('discord.js')

const fs = require('node:fs')
const path = require('node:path')
const w = require('./tools/winston.js')
const sql = require('./tools/commonSQL.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const sniper = require('./sniper/sniper-main.js')

//start services
client.on('ready', async () => {

  w.log.info('Warp drive activated');
  sniper.initialise()

})//end client.on Ready

//joined a server
client.on("guildCreate", guild => {
    w.log.info("Joined a new guild: " + guild.id)
})

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

const setup = require('./tools/serversetup.js')
//server setup
client.on('interactionCreate', async interaction => {
  const permissionerror = { content: 'Sorry, you do not have permissions to run this command (Manage Channels/Admin required)', ephemeral: true }

  if (interaction.customId === 'beginsetup-button') {
    var setupstatus = await setup.start(interaction)//creates category and 4 sniper channels if the ones in database dont already exist.
    if (setupstatus) { 
      w.log.info('setup status was sucessful') 
      interaction.reply({content: 'Setup complete. Your snipe channels will now start receiving snipes!', ephemeral: true })
    } else { 
      w.log.info('there was an error during a setup attempt') 
      interaction.reply({ content : 'There was a setup error', ephemeral: true})
    }
  }//end if button is 'beginsetup-button'

  if (interaction.customId === 'homechannelsetup1-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
    //if server is premium
    var serverconfig = await sql.getServerRow(interaction.message.guildId)
    if (serverconfig[0].premium === true) {
    setup.homechannelsetup1(interaction)
    } else {interaction.reply({content : 'Home Channel is a premium feature. This server is not premium. For more details on premium please contact @Laniakea#3683', ephemeral: true})}
    } else { await interaction.reply({content : permissionerror, ephemeral: true} ) }
  }//end if button is 'homechannelsetup1-button'

  if (interaction.customId === 'homechannelsetup2-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      setup.homechannelsetup2(interaction)
    } else {  await interaction.reply({content : permissionerror, ephemeral: true} ) }
  }//end if button is 'homechannelsetup2-button'

  if (interaction.customId === 'homechannelsetup-modal') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      setup.homechannelsetup3(interaction)
    } else {  await interaction.reply({content : permissionerror, ephemeral: true} ) }
  }//end if button is 'homechannelsetup-modal'
  
  if (interaction.customId === 'done-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      setup.homechanneldone(interaction)
    } else {  await interaction.reply({content : permissionerror, ephemeral: true} ) }
  }//end if button is 'homechannelsetup2-button'
  
})//end on interactionCreate 
