require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv
var discord = require('./clients/discordclient.js');
const client = discord.getClient()
const { Collection, PermissionsBitField } = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
const w = require('./tools/winston.js');
const deploy = require('./tools/deployonecommand.js');
const sql = require('./tools/commonSQL.js');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const sniper = require('./sniper/sniper-main.js')
var restarted = true

//start services
client.on('ready', async () => {

  w.log.info('Warp drive activated');
  sniper.initialise()

  await wait(5000).then(result => {
    w.log.info('done waiting 5 on startup. Setting restarted to false')
    restarted = false
  })

  //update server reference object used by sniper functions preiodically.
  setInterval(snipersender.initaliseServers, 240000)

})//end client.on Ready

const snipersender = require('./sniper/snipe-sender.js')
//joined a server
client.on("guildCreate", async guild => {
  if (restarted != true) {
    w.log.info("Bot joined a new guild: " + guild.id)
    var serverlist = await sql.getBotActiveStatus()
    var serverfound = false
    for (var i = 0; i < serverlist.length; i++) {
      if (serverlist[i].serverid === guild.id) {
        w.log.info('This server was already in database. Reactivating')
        serverfound = true
        await sql.updateTableColumn("servers", "serverid", guild.id, "inserver", true)
        break
      }
    }

    //if server wasn't found, create it
    if (!serverfound) {
      w.log.info('We have not seen this server before. Creating new database entry')
      await sql.createTableRow("servers", "serverid", guild.id, "inserver", true)
      await sql.updateTableColumn("servers", "serverid", guild.id, "servername", guild.name)
    }
    try {
      await deploy.setupOne(guild.id)
    } catch (err) { w.log.error(err) }
  } else { w.log.info('not adding commands. Within 5 seconds of restart') }
})

//left a server
client.on("guildDelete", async guild => {
  w.log.info("Bot left guild: " + guild.id)
  await sql.updateTableColumn("servers", "serverid", guild.id, "inserver", false)
  await sql.updateTableColumn("servers", "serverid", guild.id, "servername", guild.name)
  snipersender.initaliseServers()
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

const permissionerror = { content: 'Sorry, you do not have permissions to run this command (Manage Channels/Admin required)', ephemeral: true }

//feed setup
const feedsetup = require('./tools/feedsetup.js')
client.on('interactionCreate', async interaction => {

  if (interaction.customId === 'feedsetup-button') {
    interaction.deferReply({ ephemeral: true })
    var setupstatus = await feedsetup.start(interaction)//creates category and 4 sniper channels if the ones in database dont already exist.
    if (setupstatus) {
      w.log.info('setup status was sucessful')
      await wait(5000)//give time for channels to be created
      snipersender.initaliseServers()
      interaction.editReply({ content: 'Setup complete. Your Snipe Feed channels will now start receiving snipes! Default permissions are deny @\'everyone, please now configure access to the Snipe Feed channels for your users. Please also confirm the bot has send permissions on the Snipe Feed channels.', ephemeral: true })
    } else {
      w.log.info('there was an error during a setup attempt')
      interaction.reply({ content: 'There was a setup error. If your seeing this please contact Laniakea#3683 with the time the error occurred.', ephemeral: true })
    }
  }//end if button is 'beginsetup-button'
})//end on interactionCreate

//home setup
const homesetup = require('./tools/homesetup.js')
client.on('interactionCreate', async interaction => {

  if (interaction.customId === 'starthomesetup-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      //if server is premium
      var serverconfig = await sql.getServerRow(interaction.message.guildId)
      if (serverconfig[0].premium === true) {
        homesetup.whichCollections(interaction)
      } else { interaction.reply({ content: 'Home Channel is a premium feature. This server is not premium. For more details on premium please contact @Laniakea#3683.', ephemeral: true }) }
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'starthomesetup-button'

  if (interaction.customId === 'addHomeCollection-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      homesetup.sendModal(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'addHomeCollection-button'

  if (interaction.customId === 'submithome-modal') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      homesetup.validateCollection(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'submithome-modal'

  if (interaction.customId === 'donehome-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      homesetup.done(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'donehome-button'
})//end on interactionCreate 

//alpha setup
const alphasetup = require('./tools/alphasetup.js')
client.on('interactionCreate', async interaction => {

  //show the main setup dialogue for alpha setup
  if (interaction.customId === 'startalphasetup-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { //only if you have manage channels
      //if server is premium
      var serverconfig = await sql.getServerRow(interaction.message.guildId)
      if (serverconfig[0].premium === true) {
        alphasetup.replyMainSetup(interaction)
      } else { interaction.reply({ content: 'Alpha Channels are a premium feature. This server is not premium. For more details on premium please contact @Laniakea#3683.', ephemeral: true }) }
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }//if not laniakea
  }//end if startalphasetup-button

  //show add alpha modal
  if (interaction.customId === 'addAlpha-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { //only if you have manage channels
      alphasetup.sendAddModal(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }//if not laniakea
  }//end show add alpha modal

  //show add alpha modal
  if (interaction.customId === 'removeAlpha-modal') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { //only if you have manage channels
      alphasetup.sendRemoveModal(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }//if not laniakea
  }//end show add alpha modal

  //validate and if valid create alpha channel
  if (interaction.customId === 'addAlpha-modal') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { //only if you have manage channels
      alphasetup.validateCollection(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }//if not laniakea
  }//end if button is 'submitAddAlpha-modal'

})//end on interactionCreate

client.on('channelDelete', async channel => {
  w.log.info('Channel deleted in guild ' + channel.guildId + ' checking to see if its one of ours')
  var serverdetails = await sql.getServerRow(channel.guildId)

  //check if it was an alpha channel
  var alphafound = false
  if (serverdetails[0].alpha_channels) {
    for (var i = 0; i < serverdetails[0].alpha_channels.enabled.length; i++) {
      if (serverdetails[0].alpha_channels.enabled[i]['channelid'] === channel.id) {
        w.log.info('matched the deleted channel to an alpha channel. Deleting that from the config')
        alphafound = true
        //splice out the deleted channel from the config
        serverdetails[0].alpha_channels.enabled.splice(i, 1)
        //save updates config in sql
        await sql.updateTableColumn('servers', 'serverid', channel.guildId, "alpha_channels", serverdetails[0].alpha_channels)
        break
      }//end if we have found a setup matching the current collectionkey
    }//end for each alpha channel config object
  }//end if there is an exisiting config

  if (alphafound === false) { w.log.info('deleted channel didn\'t match an alpha channel') }

  //check if it was any of the main snipe channels
  if (channel.id === serverdetails[0].raresnipes) {
    w.log.info('Raresnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "raresnipes", null)
    snipersender.initaliseServers()
  }
  if (channel.id === serverdetails[0].epicsnipes) {
    w.log.info('Epicsnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "epicsnipes", null)
    snipersender.initaliseServers()
  }
  if (channel.id === serverdetails[0].legendarysnipes) {
    w.log.info('legendarysnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "legendarysnipes", null)
    snipersender.initaliseServers()
  }
  if (channel.id === serverdetails[0].mythicsnipes) {
    w.log.info('mythicsnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "mythicsnipes", null)
    snipersender.initaliseServers()
  }

  //check if it was the home channel
  if (channel.id === serverdetails[0].homechannel_id) {
    w.log.info('homechannel was deleted from server ' + serverdetails[0].servername + '. Nulling id in our database, deleting config and disabling')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "homechannel_id", null)
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "homechannel_collections", null)
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "homechannel_enabled", false)
    snipersender.initaliseServers()
  }
})//end on channelDelete event
