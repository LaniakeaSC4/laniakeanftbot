var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
  ModalBuilder, ActionRowBuilder, TextInputBuilder,
  TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')

const w = require('../tools/winston.js')
const sql = require('../tools/commonSQL.js')//common sql related commands are in here

//respond to alerts config button press
async function configPanel(interaction) {
  //build a new button row for the command reply
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('enable_alerts-button')
        .setLabel('Enable Alerts')
        .setStyle(ButtonStyle.Primary),
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId('disable_alerts-button')
        .setLabel('Disable Alerts')
        .setStyle(ButtonStyle.Primary),
    )
  //send the reply (including button row)

  //get current config for this server
  var pingrole = await sql.getData("servers", "serverid", interaction.message.guildId, "pingrole")
  var ping_enabled = await sql.getData("servers", "serverid", interaction.message.guildId, "enable_ping")

  var replytext = ""
  if (ping_enabled === true) {
    if (pingrole) {//enabled and existing. Check if role still exists and confirm back to the user that all is good

      //check guild roles to see if it's still there
      await interaction.message.guild.roles.fetch()
      let oldrole = await interaction.message.guild.roles.cache.get(pingrole)
      w.log.info('oldrole is: ' + oldrole)
      if (oldrole != pingrole) {
        // Role doesn't exist, safe to create
        w.log.info('Didnt find the DB role in guild')
        replytext = "Alerts are already enabled for this server. There was a saved role in our database, but it must have been deleted. Please press [Enable alerts] again to make a new alerts role"
      } else {
        // Role exists
        w.log.info('Found the DB role in guild')
        replytext = "Alerts are already enabled for this server. The Role is: <@" + pingrole + ">"
      }


      

    } else {//make a new pingrole. Somehow DB is blank?

      replytext = "Athough alerts are enabled, there was no saved role in our database. Please press [Enable Alerts] again"

    }//end else pingrole was enabled but no role existed.

  } else {//if pingrole not enabled
    if (pingrole) {//wasn't enabled, but there was a previous pingrole. Check if that role still exists, renable pings and respond to the user confirming the role

      replytext = "Alerts is not currently enabled. There was a previous Alert Role <@" + pingrole + ">"

    } else {//there wasn't an exisiting pingrole. Make one and enable pingrolez

      replytext = "Alerts are disabled and there is no exisitng config. Press [Enable Alerts] to get started."

    }//end else pingrole wasn't enabled and role didn't exist
  }//end else pingrole not enabled

  await interaction.reply({ content: replytext + "\n\nEnable or disable alerts?", components: [row], ephemeral: true })
} module.exports.configPanel = configPanel

async function enableAlerts(interaction) {
  //let's get the fresh data again
  var pingrole = await sql.getData("servers", "serverid", interaction.message.guildId, "pingrole")
  var ping_enabled = await sql.getData("servers", "serverid", interaction.message.guildId, "enable_ping")

  if (ping_enabled === true) {
    if (pingrole) {//enabled and existing. Check if role still exists and confirm back to the user that all is good

    } else {//make a new pingrole. Somehow DB is blank?
      w.log.info('Creating Role')
      var newrole = await createRole(interaction.message.guildId)
      w.log.info('EnableAlerts1: New role ID is: ' + newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)

    }//end else pingrole was enabled but no role existed.

  } else {//if pingrole not enabled

    if (pingrole) {//wasn't enabled, but there was a previous pingrole. Check if that role still exists, renable pings and respond to the user confirming the role

    } else {//there wasn't an exisiting pingrole. Make one and enable pingrolez

      w.log.info('Creating Role')
      var newrole = await createRole(interaction.message.guildId)
      w.log.info('EnableAlerts2: New role ID is: ' + newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)



    }//end else pingrole wasn't enabled and role didn't exist
  }//end else pingrole not enabled
}//end function
module.exports.enableAlerts = enableAlerts

async function createRole(guildid) {
  const thisGuild = await client.guilds.cache.get(guildid)
  const role = await thisGuild.roles.create({ name: 'Snipe Alerts' })
  w.log.info('CreateRole: New role ID is: ' + role.id)
  return role;

}
