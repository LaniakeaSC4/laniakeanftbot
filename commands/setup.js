/*
* setup command to create server channels for snipes
*/

//import discord parts we need
const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup this server for Laniakea Sniper Bot'),

  //when command is triggered, do this
  async execute(interaction) {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels

      //build a new button row for the command reply
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('feedsetup-button')
            .setLabel('Setup Snipe Feed')
            .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId('starthomesetup-button')
            .setLabel('🌟 Setup Home Channel')
            .setStyle(ButtonStyle.Primary),
        )//end add components
        .addComponents(
          new ButtonBuilder()
            .setCustomId('startalphasetup-button')
            .setLabel('🌟 Setup Alpha Channels [inactive]')
            .setStyle(ButtonStyle.Primary),
        )//end add components

      //send the reply (including button row)
      await interaction.reply({ content: 'Would you like to setup this server for Laniakea Sniper Bot?\n\nTap [Setup Server] below to create a new channel category and new channels to recieve snipes!\n\n```LANIAKEA SNIPER BOT\n|-rare-snipes\n|-epic-snipes\n|-legendary-snipes🌟\n|-mythic-snipes🌟```\n🌟_Legendary and Mythic snipes for premium servers only_🌟 \n\nIf channel already exists (by ID) it won\'t be recreated.\nDefault permissions on these channels will be; Deny @\'everyone and allow @\'laniakea Bot.\nYou are free to rename the channels and add member permissions (remember to give the bot send permissions!)\n\nPremium servers can also optionaly set up a \'Home Channel\' to redirect snipes for collections of your choice (e.g. Your collection). Press [🌟 Setup Home Channel] to get started', components: [row], ephemeral: true })
    } else { await interaction.reply({ content: 'Sorry, you do not have permissions to run this command (Manage Channels/Admin required)', ephemeral: true }) }//end if user has manage channels
  },//end execute block
}//end module.exports
