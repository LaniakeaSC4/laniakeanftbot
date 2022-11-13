var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
  ModalBuilder, ActionRowBuilder, TextInputBuilder,
  TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')

const w = require('../tools/winston.js')
const sql = require('../tools/commonSQL.js')//common sql related commands are in here

//===============
//  Admin Panel
//===============

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
    manageroles = '\n\n**Note**: Laniakea Sniper Bot will require Manage Roles permission. Currently it **does** have this permission.'
  } else {
    manageroles = '\n\n**Note**: Laniakea Sniper Bot will require Manage Roles permission. Currently it **does not** have this permission.'
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
        replytext = "Snipe Alerts allow your users to opt-in using `/alerts` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for:```Mythic rarity NFTs within 20% of floor price\nLegendary NFTs within 5% of floor price```\nAlerts are already enabled for this server. There was a saved role in our database, but it must have been deleted. Please press [Enable alerts] again to make a new alerts role which users can opt in to receive alerts." + manageroles
      } else {
        // Role exists
        w.log.info('Found the DB role in guild')
        replytext = "Snipe Alerts allow your users to opt-in using `/alerts` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for:```Mythic rarity NFTs within 20% of floor price\nLegendary NFTs within 5% of floor price```\nAlerts are already enabled for this server. The Role is: <@&" + pingrole + ">." + manageroles
      }

    } else {//make a new pingrole. Somehow DB is blank? this should not happen

      replytext = "Snipe Alerts allow your users to opt-in using `/alerts` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently alerts are sent for:```Mythic rarity NFTs within 20% of floor price\nLegendary NFTs within 5% of floor price```\nAlthough alerts are enabled on this server, there was no saved role in our database. Please press [Enable Alerts] again to create a new alert role which users can opt in to receive alerts." + manageroles

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
        replytext = "Snipe Alerts allow your users to opt-in using `/alerts` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently alerts are sent for:```Mythic rarity NFTs within 20% of floor price\nLegendary NFTs within 5% of floor price```\nAlerts are not currently enabled for this server. Despite there being a saved role in our database, it must have been deleted from your server. Please press [Enable alerts] again to make a new alerts role which users can opt in to receive alerts." + manageroles
      } else {
        // Role exists
        w.log.info('Found the DB role in guild')
        replytext = "Snipe Alerts allow your users to opt-in using `/alerts` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently alerts are sent for:```Mythic rarity NFTs within 20% of floor price\nLegendary NFTs within 5% of floor price```\nAlerts are not currently enabled for this server. However, a role was found: <@&" + pingrole + ">. To reenable use of this role press [Enable alerts]." + manageroles
      }

    } else {//there wasn't an exisiting pingrole. Make one and enable pingrole

      replytext = "Snipe Alerts allow your users to opt-in using `/alerts` to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently Alerts are sent for:```Mythic rarity NFTs within 20% of floor price\nLegendary NFTs within 5% of floor price```\nAlerts are disabled for this server and there is no exisitng config. Press [Enable Alerts] to get started. The bot will create a new role which users can then opt in to receiveing alerts." + manageroles

    }//end else pingrole wasn't enabled and role didn't exist
  }//end else pingrole not enabled

  await interaction.reply({
    embeds: [
			{
				"title": "🔔 __Alerts Setup 1__ ",
				"color": parseInt('0x9901f6', 16),
				"description": replytext,
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
    components: [row], ephemeral: true })
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

  if (managerolepermission === true) {
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
         await interaction.reply({ 
            embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Created a new alert role to replace the deleted one: <@&" + newrole.id + ">. Your users can now opt in to this role with `/alerts` (make sure the bot has manage roles permission)",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
     ephemeral: true })

        } else {
          // Role exists
          w.log.info('Found the DB role in guild')
          await interaction.reply({ 
            
            embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "No action taken. Alerts are already enabled for this server. The Role is: <@&" + pingrole + ">. Your users can now opt in to this role with `/alerts` (make sure the bot has manage roles permission)",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
         ephemeral: true })
        }

      } else {//make a new pingrole. Somehow DB is blank? this should not happen

        w.log.info('Creating Role')
        var newrole = await createRole(interaction.message.guildId)
        w.log.info('EnableAlerts1: New role ID is: ' + newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
        await interaction.reply({ 
          
          embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alerts were enabled for this server, but there was no saved role. Created a new alert role: <@&" + newrole.id + ">. Your users can now opt in to this role with `/alerts` (make sure the bot has manage roles permission)",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
          
           ephemeral: true })

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
         await interaction.reply({ 
            
            embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alerts have now been enabled for this server. There was an exisitng saved role, but it must have been deleted. Created a new alert role: <@&" + newrole.id + ">. Your users can now opt in to this role with `/alerts` (make sure the bot has manage roles permission)",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
            
            
            ephemeral: true })

        } else {
          // Role exists
          w.log.info('Found the DB role in guild. Lets just re-enable it')
          await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
          await interaction.reply({ 
            
            embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alerts have now been enabled for this server. There was an exisitng role, so it has been reused: <@&" + pingrole + ">. Your users can now opt in to this role with `/alerts` (make sure the bot has manage roles permission)",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
            
             ephemeral: true })

        }

      } else {//there wasn't an exisiting pingrole. Make one and enable pingrole

        w.log.info('Creating Role')
        var newrole = await createRole(interaction.message.guildId)
        w.log.info('EnableAlerts1: New role ID is: ' + newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", newrole.id)
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "enable_ping", true)
       await interaction.reply({ 
          
          embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alerts are now enabled for this server. Created a new alert role: <@&" + newrole.id + ">. Your users can now opt in to this role with `/alerts` (make sure the bot has manage roles permission)",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
          
           ephemeral: true })

      }//end else pingrole wasn't enabled and role didn't exist
    }//end else pingrole not enabled
  } else {
    await interaction.reply({ 
      
      embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Error: the bot requires the manage role permission to perform this action. Please grant the bot this permission and try again.",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
      
      ephemeral: true })
  }
}//end function
module.exports.enableAlerts = enableAlerts

async function disableAlerts(interaction) {

  //check if the bot had manage roles
  var managerolepermission = false
  if (interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    managerolepermission = true
  }

  if (managerolepermission === true) {
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

       await interaction.reply({ 
          
          embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alerts have now been disabled for this server. Users will no longer recieve pings. We have a saved alert role in our database, but it looks like you have already deleted it from the server. To re-enable in future please run `/setup` again.",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
          
          ephemeral: true })
        await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, "pingrole", null)

      } else {
        // Role exists
      await interaction.reply({ 
          
          embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alerts have now been disabled for this server. Users will no longer recieve pings. There was an exisitng role: <@&" + pingrole + ">. You can now delete this, or leave it and it will be reused if your later renable alerts",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
          
          ephemeral: true })

      }
    } else {

      await interaction.reply({ 
        
      embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alerts have now been disabled for this server. Users will no longer recieve pings. You can now dismiss this message",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
       
        ephemeral: true })

    }
  } else {
    await interaction.reply({ 
      
      embeds: [
			{
				"title": "🔔 __Alerts Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Error: the bot requires the manage role permission to perform this action. Please grant the bot this permission and try again.",
				"footer": {
					"text": "Setup 5/5. When you have finished configuration of alerts config setup is complete."
				},
			}
		],//end embed
      
      ephemeral: true })
  }

}//end function
module.exports.disableAlerts = disableAlerts

async function createRole(guildid) {
  const thisGuild = await client.guilds.cache.get(guildid)
  const role = await thisGuild.roles.create({ name: 'Snipe Alerts', permissions: [], mentionable: true })
  w.log.info('CreateRole: New role ID is: ' + role.id)
  return role;

}

//===============
//  User Roles
//===============

async function addRole(interaction) {
  //check if the bot had manage roles
  var managerolepermission = false
  if (interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    managerolepermission = true
  }

  //check if alerts are enabled and there is a valid alertrole
  //get current config for this server
  var pingrole = await sql.getData("servers", "serverid", interaction.message.guildId, "pingrole")
  var ping_enabled = await sql.getData("servers", "serverid", interaction.message.guildId, "enable_ping")

  if (ping_enabled === true) {
    if (managerolepermission === true) {
      if (pingrole) {//enabled and existing. Check if role still exists and confirm back to the user that all is good

        //check guild roles to see if it's still there
        await interaction.message.guild.roles.fetch()
        let oldrole = await interaction.message.guild.roles.cache.get(pingrole)
        w.log.info('oldrole is: ' + oldrole)
        if (oldrole != pingrole) {
          // Role doesn't exist, give error to user
          await interaction.reply({ content: "There has been a problem with the alert config on this Sever. Please let a sever admin know.", ephemeral: true })
        } else {
          // Role exists. Apply it to user
          await interaction.member.roles.add(pingrole)
         await interaction.reply({ content: "You have been now been given the alert role for this server. When a high value snipe occurs you will recieve a discord ping.", ephemeral: true })
        }

      } else { await interaction.reply({ content: "Error: There is no saved role in Sniper bot database. Please tell a server admin.", ephemeral: true }) }
    } else { await interaction.reply({ content: "It seems that the bot does not have manage roles permissions. Please let a server admin know.", ephemeral: true }) }

  } else { await interaction.reply({ content: "The ping alerts feature has been disabled by server owner. If this is a feature you would like to use, please let a server admin know.", ephemeral: true }) }
}
module.exports.addRole = addRole

async function removeRole(interaction) {

  //check if the bot had manage roles
  var managerolepermission = false
  if (interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    managerolepermission = true
  }

  //check if alerts are enabled and there is a valid alertrole
  //get current config for this server
  var pingrole = await sql.getData("servers", "serverid", interaction.message.guildId, "pingrole")

  if (pingrole) {
    if (managerolepermission === true) {
      if (interaction.member.roles.cache.some(role => role.id === pingrole)) {
        await interaction.member.roles.remove(pingrole)
        await interaction.reply({ content: "The alert role has been removed. You will no longer receive alerts.", ephemeral: true })
      } else { await interaction.reply({ content: "You did not seem to have this server's alert role. No action has been taken.", ephemeral: true }) }
    } else { await interaction.reply({ content: "It seems that the bot does not have manage roles permissions. Please let a server admin know.", ephemeral: true }) }
  } else { await interaction.reply({ content: "Error: There is no saved role in Sniper bot database. Please tell a server admin.", ephemeral: true }) }
}
module.exports.removeRole = removeRole
