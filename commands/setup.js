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
            .setLabel('🌟 Setup Alpha Channels')
            .setStyle(ButtonStyle.Primary),
        )//end add components
         .addComponents(
          new ButtonBuilder()
            .setCustomId('globalconfig-button')
            .setLabel('Global Configs')
            .setStyle(ButtonStyle.Secondary),
        )//end add components
        .addComponents(
          new ButtonBuilder()
            .setCustomId('setupalerts-button')
            .setLabel('Setup Alerts')
            .setStyle(ButtonStyle.Secondary),
        )//end add components

      //send the reply (including button row)
      await interaction.reply({ content: '__**Laniakea NFT Sniper Bot Setup**__\n\n___Feature: **Snipe Feed**___\nPress **[Setup Snipe Feed]** below to create a new channel category and new channels to recieve a feed of snipes for **all** supported collections. __🌟 Legendary and Mythic snipes for premium servers only.__ If channels already exist (by ID) it won\'t be recreated. Default permissions on these channels will be; deny @\'everyone and allow @\'laniakea Bot. You are free to rename the channels and add member permissions (remember to give the bot send permissions!)\n\n___Feature_: **Home Channel 🌟**__\nSetup a Home Channel to redirect snipes from the Snipe Feed for one or more collections of your choice (e.g. your collections). Collections added to your Home Channel **won\'t** appear in the main Snipe Feed. Press **[Setup Home Channel]** to get started.\n\n___Feature_: **Alpha Channels 🌟**__\nCreate single collection Alpha Channels for focused collection sniping. Alpha Channel snipes **will** also appear in the Snipe Feed or Home Channel if enabled. Press **[Setup Alpha Channels]** to get started.\n\n🌟 Premium only feature. Contact Laniakea#3683 for details.', components: [row], ephemeral: true })
    } else { await interaction.reply({ content: 'Sorry, you do not have permissions to run this command (Manage Channels/Admin required)', ephemeral: true }) }//end if user has manage channels
  },//end execute block
}//end module.exports
