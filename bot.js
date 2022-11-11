require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv

//import discord
var discord = require('./clients/discordclient.js');
const client = discord.getClient()
const { Collection, PermissionsBitField } = require('discord.js');

const snipersender = require('./sniper/snipe-sender.js')
const w = require('./tools/winston.js');
const deploy = require('./tools/deployonecommand.js');
const sql = require('./tools/commonSQL.js');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

//when bot restarts it "joins" all its guilds. I want to watch for new server guild joins and exectue functions on join (deploy commands). Set restarted to true, then set to false 5 seconds after client us ready.
var restarted = true

//start services
client.on('ready', async () => {
  w.log.info('Warp drive activated')

  //start sniper functions
  const sniper = require('./sniper/sniper-main.js')
  sniper.initialise()

  //update server reference object used by sniper functions preiodically.
  setInterval(snipersender.initaliseServers, 350000)

  //after 5s,set restarted to false so guildcreate event functions will fire
  await wait(5000).then(result => {
    w.log.info('done waiting 5 on startup. Setting restarted to false')
    restarted = false
  })

  //schedule cron job on startup to check if any premium servers have expired. Runs every 4h.
  var CronJob = require('cron').CronJob
  var premium = require('./tools/premium.js')
  var job_validatePremium = new CronJob('0 */4 * * *', function () {
    w.log.info('Cron: Running Premium Check')
    premium.validateServers()
  }, null, true)

  var collection_stats = require('./tools/collectionStats.js')
  var job_updateStats = new CronJob('0 */12 * * *', function () {
    w.log.info('Cron: Updating collection stats')
    collection_stats.updateStats()
  }, null, true)
  
})//end client.on Ready

//=========================
//==== Guild Join/Leave ===
//=========================

//bot joined a server
client.on("guildCreate", async guild => {
  if (restarted != true) {//if not in the first 5 seconds after a restart
    w.log.info("Bot joined a new guild: " + guild.id)
    var serverlist = await sql.getBotActiveStatus()//serverid and inserver
    var serverfound = false
    //check through existing servers to see if we've seen this one before
    for (var i = 0; i < serverlist.length; i++) {
      if (serverlist[i].serverid === guild.id) {
        w.log.info('This server was already in database. Reactivating: setting inserver to true')
        serverfound = true
        await sql.updateTableColumn("servers", "serverid", guild.id, "inserver", true)
        break
      }//end if match guild id to database
    }//end for

    //if server wasn't found, create database entry for it
    if (!serverfound) {
      w.log.info('We have not seen this server before. Creating new database entry')
      //set create new row and set inserver true, then store guild name
      await sql.createTableRow("servers", "serverid", guild.id, "inserver", true)
      await sql.updateTableColumn("servers", "serverid", guild.id, "servername", guild.name)
    }//end if server not found
    //try deploy commands to this server
    try {
      await deploy.setupOne(guild.id)//setup one server
    } catch (err) { w.log.error(err) }
  } else { w.log.info('not adding commands. Within 5 seconds of restart') }
})//end on GuildCreate

//bot left a server
client.on("guildDelete", async guild => {
  w.log.info("Bot left guild: " + guild.id)
  //set inserver to false
  await sql.updateTableColumn("servers", "serverid", guild.id, "inserver", false)
  //set an updated guild name on exit
  await sql.updateTableColumn("servers", "serverid", guild.id, "servername", guild.name)
  //re-initalise the servers object the sniper sender uses now that servers have changed
  snipersender.initaliseServers()
})//end on guildDelete

//======================
//==== Command Setup ===
//======================

//import fs and path to build commands 
const fs = require('node:fs')
const path = require('node:path')

//setup commands - this adds them to the client at client.commands
client.commands = new Collection()//collection is discord fancy arrary with extended functionality
const commandsPath = path.join(__dirname, 'commands')//all commands are at ./commands/
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))//only .js files

for (const file of commandFiles) {//for each command file
  const filePath = path.join(commandsPath, file)//join all the files
  const command = require(filePath)//import each one with requrie
  // Set a new item in the Collection with the key as the command name and the value as the exported module
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
    w.log.info('There was an error processing a command in ' + interaction?.message?.guildId + ': ' + error)
    //await interaction.reply({ content: 'There was an error (' + error + ' while executing this command!', ephemeral: true });
  }//end catch
})//end on interactionCreate

//=============================
//==== setup interactions  ====
//=============================
const permissionerror = { content: 'Sorry, you do not have permissions to run this command (Manage Channels/Admin required)', ephemeral: true }

//Main Snipe feed setup interactions
const feedsetup = require('./setup/feedsetup.js')
client.on('interactionCreate', async interaction => {

  //Main feed setup pressed from main setup dialogue 
  if (interaction.customId === 'feedsetup-button') {
    await feedsetup.whichMode(interaction)
  }//end if button is 'feedsetup-button'

  if (interaction.customId === 'standardfeed-button') {
    interaction.deferReply({ ephemeral: true })
    var setupstatus = await feedsetup.start(interaction, "multichannel")//creates category and 4 sniper channels if the ones in database dont already exist.
    if (setupstatus) {
      w.log.info('setup status was sucessful')
      await wait(5000)//give time for channels to be created
      snipersender.initaliseServers()//rebuild snipe sender object so it includes the new channels
      interaction.editReply({ content: 'Setup complete. Your Snipe Feed channels will now start receiving snipes! Default permissions are deny @\'everyone, please now configure access to the Snipe Feed channels for your users. Please also confirm the bot has send permissions on the Snipe Feed channels.', ephemeral: true })
    } else {
      w.log.info('there was an error during a setup attempt')
      interaction.reply({ content: 'There was a setup error. If your seeing this please contact Laniakea#3683 with the time the error occurred.', ephemeral: true })
    }//end else there is an error
  }//end if button is 'standardfeed-button'

  if (interaction.customId === 'singlefeed-button') {
    interaction.deferReply({ ephemeral: true })
    var setupstatus = await feedsetup.start(interaction, "singlechannel")//creates category and 4 sniper channels if the ones in database dont already exist.
    if (setupstatus) {
      w.log.info('setup status was sucessful')
      await wait(5000)//give time for channels to be created
      snipersender.initaliseServers()//rebuild the snipe sender object so it has the new channel
      interaction.editReply({ content: 'Setup complete. Your Snipe Feed channel will now start receiving snipes! Default permissions are deny @\'everyone, please now configure access to the Snipe Feed channels for your users. Please also confirm the bot has send permissions on the Snipe Feed channels.', ephemeral: true })
    } else {
      w.log.info('there was an error during a setup attempt')
      interaction.reply({ content: 'There was a setup error. If your seeing this please contact Laniakea#3683 with the time the error occurred.', ephemeral: true })
    }//end else there was an error
  }//end if button is 'singlefeed-button'

})//end on interactionCreate

//home channel setup
const homesetup = require('./setup/homesetup.js')
client.on('interactionCreate', async interaction => {
  //home setup on main /setup dialogue is pressed
  //replies to main dialogue button press with home setup dialogue asking which collections to add. Had Add and Done buttons
  if (interaction.customId === 'starthomesetup-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      //if server is premium
      var serverconfig = await sql.getServerRow(interaction.message.guildId)
      if (serverconfig[0].premium === true) {
        homesetup.whichCollections(interaction)
      } else { interaction.reply({ content: 'Home Channel is a premium feature. This server is not premium. For more details on premium please contact @Laniakea#3683.', ephemeral: true }) }
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'starthomesetup-button'

  //when add collection is pressed. Send a modal for collection input
  if (interaction.customId === 'addHomeCollection-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      homesetup.sendModal(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'addHomeCollection-button'

  //when modal is submitted, validate input
  if (interaction.customId === 'submithome-modal') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      homesetup.validateCollection(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'submithome-modal'

  //when user is finished add home collections
  if (interaction.customId === 'donehome-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      homesetup.done(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'donehome-button'
})//end on interactionCreate for home setup

//alpha setup
const alphasetup = require('./setup/alphasetup.js')
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
})//end on interactionCreate for alpha setup

//=============================
//==== Other interactions  ====
//=============================

//vote - user voting for collections
const vote = require('./tools/vote.js')
client.on('interactionCreate', async interaction => {
  //send input modals when main up/down vote buttons are pressed
  if (interaction.customId === 'voteUp-button') { vote.sendVoteUpModal(interaction) }
  if (interaction.customId === 'voteDown-button') { vote.sendVoteDownModal(interaction) }
  //validate collection once modal is submitted
  if (interaction.customId === 'voteUp-modal') { vote.validateCollection(interaction, "up") }
  if (interaction.customId === 'voteDown-modal') { vote.validateCollection(interaction, "down") }
})//end on interactionCreate 

//a guild role was deleted - do we care?
client.on('roleDelete', async role => {
  w.log.info('A role has been deleted in')

  var serverdetails = await sql.getServerRow(role.guild)//get this server's details

  if (serverdetails[0].pingrole == role.id) {
    w.log.info('the pingrole has been deleted. Nulling it and disabling server alerts')
    await sql.updateTableColumn("servers", "serverid", role.guild, "enable_ping", false)
    await sql.updateTableColumn("servers", "serverid", role.guild, "pingrole", null)
  }
})

//channel in bot server was deleted - do we care?
client.on('channelDelete', async channel => {
  w.log.info('Channel deleted in guild ' + channel.guildId + ' checking to see if its one of ours')
  var serverdetails = await sql.getServerRow(channel.guildId)//get this server's details

  //check if it was an alpha channel
  var alphafound = false//we are going to check if it was an alpha channel. Start as false.
  if (serverdetails[0].alpha_channels) {//if there is an alpha config
    for (var i = 0; i < serverdetails[0].alpha_channels.enabled.length; i++) {//for each config
      if (serverdetails[0].alpha_channels.enabled[i]['channelid'] === channel.id) {//if it matches the deleted channel
        w.log.info('matched the deleted channel to an alpha channel. Deleting that from the config')
        alphafound = true
        //splice out the deleted channel from the config
        serverdetails[0].alpha_channels.enabled.splice(i, 1)
        //save updates config in sql
        await sql.updateTableColumn('servers', 'serverid', channel.guildId, "alpha_channels", serverdetails[0].alpha_channels)
        break//dont need to loop through further alpha configs
      }//end if we have found a setup matching the current collectionkey
    }//end for each alpha channel config object
  }//end if there is an exisiting config

  if (alphafound === false) { w.log.info('deleted channel didn\'t match an alpha channel') }

  //check if it was any of the main snipe channels. Null it in database. Snipe sender checks for null
  if (channel.id === serverdetails[0].raresnipes) {
    w.log.info('Raresnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "raresnipes", null)
    snipersender.initaliseServers()
  }//end if rare
  if (channel.id === serverdetails[0].epicsnipes) {
    w.log.info('Epicsnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "epicsnipes", null)
    snipersender.initaliseServers()
  }//end if epic
  if (channel.id === serverdetails[0].legendarysnipes) {
    w.log.info('legendarysnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "legendarysnipes", null)
    snipersender.initaliseServers()
  }//end if legendary
  if (channel.id === serverdetails[0].mythicsnipes) {
    w.log.info('mythicsnipes channel was deleted from server ' + serverdetails[0].servername + '. Nulling it in our database')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "mythicsnipes", null)
    snipersender.initaliseServers()
  }//end if mythic

  //check if it was the home channel
  if (channel.id === serverdetails[0].homechannel_id) {
    w.log.info('homechannel was deleted from server ' + serverdetails[0].servername + '. Nulling id in our database, deleting config and disabling')
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "homechannel_id", null)
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "homechannel_collections", null)
    await sql.updateTableColumn('servers', 'serverid', channel.guildId, "homechannel_enabled", false)
    snipersender.initaliseServers()
  }//end if home channel
})//end on channelDelete event

//Global config
const globalconfig = require('./setup/globalconfig.js')
client.on('interactionCreate', async interaction => {
  //main globalconfig button on main setup dialogue. Replied with global config panel
  if (interaction.customId === 'globalconfig-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      globalconfig.configPanel(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'globalconfig-button'

  //config rarity - when config rarities is pressed, respond with choice of rarities to enable/disable
  if (interaction.customId === 'configrarity-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      globalconfig.configRarities(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'configrarity-button'

  //lots of buttons we might want to send to this buttonHandler. Send to buttonHandler if it's any of these
  var rarityConfigButtons = ['rareyes-button', 'epicyes-button', 'legendaryyes-button', 'mythicyes-button', 'rareno-button', 'epicno-button', 'legendaryno-button', 'mythicno-button']
  if (rarityConfigButtons.includes(interaction.customId)) {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      globalconfig.buttonHandler(interaction)
    }//end if has manage channels
  }//end if it's one of those buttons

  //config price - when config prices is pessed on global config panel
  if (interaction.customId === 'configPrice-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      globalconfig.configPrices(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'configrarity-button'

  //send set min price modal
  if (interaction.customId === 'setMinPrice-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      globalconfig.sendMinModal(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'setMinPrice-button'

  //send set max price modal
  if (interaction.customId === 'setMaxPrice-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      globalconfig.sendMaxModal(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }//end if button is 'setMaxPrice-button'

  //validate modal input and store it
  if (interaction.customId === 'setMin-modal') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { //only if you have manage channels
      globalconfig.validateModalInput(interaction, 'min_price')
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }//if not laniakea
  }//end if button is 'setMin-modal'

  if (interaction.customId === 'setMax-modal') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { //only if you have manage channels
      globalconfig.validateModalInput(interaction, 'max_price')
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }//if not laniakea
  }//end if button is 'setMax-modal' 
})//end on interactionCreate 

//Configure alerts
const alerts = require('./setup/alerts.js')
client.on('interactionCreate', async interaction => {

  if (interaction.customId === 'setupalerts-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      alerts.configPanel(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }

  if (interaction.customId === 'enable_alerts-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      alerts.enableAlerts(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }

  if (interaction.customId === 'disable_alerts-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      alerts.disableAlerts(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }

  if (interaction.customId === 'alert-yes-button') {
    alerts.addRole(interaction)
  }

  if (interaction.customId === 'alert-no-button') {
    alerts.removeRole(interaction)
  }

})//end on interactionCreate 

//New alpha config
const alpha = require('../setup/alpha2setup.js')
client.on('interactionCreate', async interaction => {

  if (interaction.customId === 'addAlphaCh-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      alpha.newChannel(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }

  if (interaction.customId === 'addAlphaCol-button') {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
      alpha.sendModal(interaction)
    } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
  }

    //when modal is submitted, validate input
    if (interaction.customId === 'submitAlpha-modal') {
      if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels
        alpha.validateCollection(interaction)
      } else { await interaction.reply({ content: permissionerror, ephemeral: true }) }
    }//end if button is 'submithome-modal'

})//end on interactionCreate 
