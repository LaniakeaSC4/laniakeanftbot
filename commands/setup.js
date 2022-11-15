/*
* setup command to create server channels for snipes
*/

//import discord parts we need
const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup this server for Laniakea NFT Sniper Bot'),

  //when command is triggered, do this
  async execute(interaction) {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels

      const feedsetup = require('../setup/feedsetup.js')
      await feedsetup.whichMode(interaction)

    }//end if user has manage channels
  },//end execute block
}//end module.exports
