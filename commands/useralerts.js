/*
* alert command for users to opt in to the alert role
*/

//import discord parts we need
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField} = require('discord.js')

//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('alerts')
    .setDescription('Opt-in or Opt-out of discord pings for high value snipes'),

  //when command is triggered, do this
  async execute(interaction) {
    //build a new button row for the command reply
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('alert-yes-button')
          .setLabel('Alert me')
          .setStyle(ButtonStyle.Success),
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId('alert-no-button')
          .setLabel('Don\'t alert me')
          .setStyle(ButtonStyle.Danger),
      )//end add components

    //check if bot has manage roles
       //check if the bot had manage roles
  var managerolepermission = false
  if (interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    managerolepermission = true
}

    //if yes
    //send the reply (including button row)
    if (managerolepermission === true ) {
    await interaction.reply({ content: 'Snipe Alerts allow you to be given a discord role which the bot will mention for certain high value snipes.\n\nCurrently alerts are sent for:```Mythic rarity NFTs within 20% of floor price\nLegendary NFTs within 5% of floor price```\nWould you like alerts?', components: [row], ephemeral: true })
} else {//if no, tell user to tell this admin
await interaction.reply({ content: 'Unfortunately bot dosent have manage roles permissions', ephemeral: true })
  
}
    


  },//end execute block
}//end module.exports
