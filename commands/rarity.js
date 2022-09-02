/*
 * Rarity checker command
 * Users can use this to check the rarity of an individual nft in a collection.
 */

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js')

//import metaplex RPC - add database functionality
const raritychecker = require('../raritychecker/raritychecker.js')

//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rarity')
    .setDescription('Check the rarity of an NFT')
    .addStringOption(option =>
      option.setName('collectionkey')
      .setDescription('Which collection? For list of collections use /supportedcollections')
      .setRequired(true))
    .addStringOption(option =>
      option.setName('nftid')
      .setDescription('Which NFT # in the collection?' )
      .setRequired(true)),
      
  //when command is triggered, do this
  async execute(interaction) {
    //get the inputs from the command
    var collectionKey = interaction.options.getString('collectionkey'); var nftid = interaction.options.getString('nftid')
    rarityembed = await raritychecker.check(collectionKey, nftid)
    if (rarityembed) {
    await interaction.reply({ embeds: rarityembed })} else {w.log.error('error checking this rarity')
      await interaction.reply({ content: "there has been an error checking this NFT" })
    }
  }, //end execute block
} //end module.exports
