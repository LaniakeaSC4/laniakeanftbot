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
  
  //check if the bot had manage roles
  var manageroles = ''
  if (interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    manageroles = 'Note: Laniakea Sniper Bot will require Manage Roles permission. Currently it **does** have this permission.'
} else {
  manageroles = '\n\nNote: Laniakea Sniper Bot will require Manage Roles permission. Currently it **does not** have this permission.'
}

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
        replytext = "Snipe Alerts allow your users to opt-in using `/alert yes` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for: Mythic rarity NFTs within 20% of floor price.\n\nAlerts are already enabled for this server. There was a saved role in our database, but it must have been deleted. Please press [Enable alerts] again to make a new alerts role which users can opt in to receive alerts" + manageroles
      } else {
        // Role exists
        w.log.info('Found the DB role in guild')
        replytext = "Snipe Alerts allow your users to opt-in using `/alert yes` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for: Mythic rarity NFTs within 20% of floor price.\n\nAlerts are already enabled for this server. The Role is: <@&" + pingrole + ">" + manageroles
      }




    } else {//make a new pingrole. Somehow DB is blank? this should not happen

      replytext = "Snipe Alerts allow your users to opt-in using `/alert yes` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for: Mythic rarity NFTs within 20% of floor price.\n\nAthough alerts are enabled, there was no saved role in our database. Please press [Enable Alerts] again to create a new alert role which users can opt in to receive alerts" + manageroles

    }//end else pingrole was enabled but no role existed.

  } else {//if pingrole not enabled
    if (pingrole) {//wasn't enabled, but there was a previous pingrole. Check if that role still exists, renable pings and respond to the user confirming the role

      //check guild roles to see if it's still there
      await interaction.message.guild.roles.fetch()
      let oldrole = await interaction.message.guild.roles.cache.get(pingrole)
      w.log.info('oldrole is: ' + oldrole)
      if (oldrole != pingrole) {
        // Role doesn't exist, safe to create
        w.log.info('Didnt find the DB role in guild')
        replytext = "Snipe Alerts allow your users to opt-in using `/alert yes` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for: Mythic rarity NFTs within 20% of floor price.\n\nAlerts not already enabled for this server. There was a saved role in our database, but it must have been deleted. Please press [Enable alerts] again to make a new alerts role which users can opt in to receive alerts" + manageroles
      } else {
        // Role exists
        w.log.info('Found the DB role in guild')
        replytext = "Snipe Alerts allow your users to opt-in using `/alert yes` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for: Mythic rarity NFTs within 20% of floor price.\n\nAlerts are not already enabled for this server. However, a role was found: <@&" + pingrole + ">. To reenable use of this role press [Enable alerts]" + manageroles
      }

    } else {//there wasn't an exisiting pingrole. Make one and enable pingrole

      replytext = "Snipe Alerts allow your users to opt-in using `/alert yes` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for: Mythic rarity NFTs within 20% of floor price.\n\nAlerts are disabled and there is no exisitng config. Press [Enable Alerts] to get started. The bot will create a new role which users can then opt in to receiveing alerts." + manageroles

    }//end else pingrole wasn't enabled and role didn't exist
  }//end else pingrole not enabled

  await interaction.reply({ content: replytext, components: [row], ephemeral: true })
} module.exports.configPanel = configPanel

async function enableAlerts(interaction) {
  //let's get the fresh data again
  var pingrole = await sql.getData("servers", "serverid", interaction.message.guildId, "pingrole")
  var ping_enabled = await sql.getData("servers", "serverid", interaction.message.guildId, "enable_ping")
  
   //check if the bot had manage roles
  var managerolepermission = false
  if (interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    managerolepermission = true
}

if (managerolepermission === true ) {
  if (ping_enabled === true) {
    if (pingrole) {//enabled and existing. Check if role still exists and confirm back to the user that all is good

      //check guild roles to see if it's still there
      await interaction.message.guild.roles.fetch()
      let oldrole = await interaction.message.guild.roles.cache.get(pingrole)
      w.log.info('oldrole is: ' + oldrole)
      if (oldrole != pingrole) {
        // Role doesn't exist, safe to create
        w.log.info('Didnt find the DB role in guild')
        w.log.info('Creating Role')
        var newrole = await createRole(interaction.message.guildId)
        w.log.info('EnableAlerts1: New role ID is: ' + newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
        interaction.reply({ content: "Created a new alert role to replace the deleted one: <@&" + newrole.id + ">", ephemeral: true })

      } else {
        // Role exists
        w.log.info('Found the DB role in guild')
        interaction.reply({ content: "No action taken. Alerts are already enabled for this server. The Role is: <@&" + pingrole + ">", ephemeral: true })
      }

    } else {//make a new pingrole. Somehow DB is blank? this should not happen

      w.log.info('Creating Role')
      var newrole = await createRole(interaction.message.guildId)
      w.log.info('EnableAlerts1: New role ID is: ' + newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
      interaction.reply({ content: "Alerts were enabled for this server, but there was no saved role. Created a new alert role: <@&" + newrole.id + ">", ephemeral: true })

    }//end else pingrole was enabled but no role existed.

  } else {//if pingrole not enabled
    if (pingrole) {//wasn't enabled, but there was a previous pingrole. Check if that role still exists, renable pings and respond to the user confirming the role

      //check guild roles to see if it's still there
      await interaction.message.guild.roles.fetch()
      let oldrole = await interaction.message.guild.roles.cache.get(pingrole)
      w.log.info('oldrole is: ' + oldrole)
      if (oldrole != pingrole) {

        // Role doesn't exist, safe to create
        w.log.info('Didnt find the DB role in guild')
        w.log.info('Creating Role')
        var newrole = await createRole(interaction.message.guildId)
        w.log.info('EnableAlerts1: New role ID is: ' + newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
        interaction.reply({ content: "Now enabled Alerts for this server. There was an exisitng saved role, but it must have been deleted. Created a new alert role: <@&" + newrole.id + ">", ephemeral: true })

      } else {
        // Role exists
        w.log.info('Found the DB role in guild. Lets just re-enable it')
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
        interaction.reply({ content: "Now enabled Alerts for this server. There was an exisitng role, so it has been reused: <@&" + pingrole + ">", ephemeral: true })

      }

    } else {//there wasn't an exisiting pingrole. Make one and enable pingrole

      w.log.info('Creating Role')
      var newrole = await createRole(interaction.message.guildId)
      w.log.info('EnableAlerts1: New role ID is: ' + newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
      interaction.reply({ content: "Alerts are now enabled for this server. Created a new alert role: <@&" + newrole.id + ">", ephemeral: true })

    }//end else pingrole wasn't enabled and role didn't exist
  }//end else pingrole not enabled
} else {
  interaction.reply({ content: "Error: the bot requires the manage role permission to perform this action. Please grant the bot this permission and try again.", ephemeral: true })
}
}//end function
module.exports.enableAlerts = enableAlerts

async function disableAlerts(interaction) {
    
   //check if the bot had manage roles
  var managerolepermission = false
  if (interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    managerolepermission = true
}

if (managerolepermission === true ) {
  //disable alerts
  await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", false)

  //get the alert role if if there is one
  var pingrole = await sql.getData("servers", "serverid", interaction.message.guildId, "pingrole")
  if (pingrole) {//wasn't enabled, but there was a previous pingrole. Check if that role still exists, renable pings and respond to the user confirming the role

    //check guild roles to see if it's still there
    await interaction.message.guild.roles.fetch()
    let oldrole = await interaction.message.guild.roles.cache.get(pingrole)
    w.log.info('oldrole is: ' + oldrole)
    if (oldrole != pingrole) {

      interaction.reply({ content: "Alerts have now been disabled for this server. We have a saved alert role in our database, but it looks like you have already deleted it from the server", ephemeral: true })
      await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", null)

    } else {
      // Role exists
      interaction.reply({ content: "Alerts have now been disabled for this server. There was an exisitng role: <@&" + pingrole + ">. You can now delete this, or leave it and it will be reused if your later renable alerts", ephemeral: true })

    }
  } else {

    interaction.reply({ content: "Alerts have now been disabled for this server. You can now dismiss this message", ephemeral: true })

  }
} else {
  interaction.reply({ content: "Error: the bot requires the manage role permission to perform this action. Please grant the bot this permission and try again.", ephemeral: true })
}

}//end function
module.exports.disableAlerts = disableAlerts

async function createRole(guildid) {
  const thisGuild = await client.guilds.cache.get(guildid)
  const role = await thisGuild.roles.create({ name: 'Snipe Alerts' })
  w.log.info('CreateRole: New role ID is: ' + role.id)
  return role;

}
