/*
 * Rarity checker command
 * Users can use this to check the rarity of an individual nft in a collection.
 */

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js');

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
      
      /*
      
       "name": "newrarity",
        "description": "New rarity command",
        "options": [
          {
            "type": 3,
            "name": "collectionkey",
            "description": "Which collection?",
            "required": true
          },
          {
            "type": 3,
            "name": "nftid",
            "description": "Which NFT?",
            "required": true
          }
        ]*/

  //when command is triggered, do this
  async execute(interaction) {
    await interaction.deferReply()//send tempory 'thinking' reply
    //get the inputs from the command
    var collectionKey = interaction.options.getString('collectionkey'); var nftid = interaction.options.getString('nftid')
    rarityembed = await raritychecker.check(collectionKey, nftid)
    await interaction.editReply({ embeds: rarityembed })
  }, //end execute block
} //end module.exports
