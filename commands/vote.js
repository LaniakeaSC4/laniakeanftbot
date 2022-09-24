/*
* setup command to create server channels for snipes
*/

//import discord parts we need
const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionsBitField } = require('discord.js')

const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')


//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Vote to add or remove a Snipe collection.'),

  //when command is triggered, do this
  async execute(interaction) {
      //build a new button row for the command reply
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('voteUp-button')
            .setLabel('Upvote Collection')
            .setStyle(ButtonStyle.Success),
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId('voteDown-button')
            .setLabel('Down vote Collection')
            .setStyle(ButtonStyle.Danger),
        )//end add components

      //send the reply (including button row)
      await interaction.reply({ content: 'Vote to add or remove a collection. When your done, dismiss this message.', components: [row], ephemeral: true })
 
  },//end execute block
}//end module.exports
