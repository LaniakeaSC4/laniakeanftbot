/*
 * Rarity checker command file
 
 
this file was removed from /commands when I stated adding collecitons without nft ids (creator address only. Files in /commands directory are parsed to setup bot slash commands.
functionality disbaked for now. If I bring this back, would need a way to differentiate between collections which have searchable nft ids or not.
 
 
 * Users can use this to check the rarity of an individual nft in a collection.
 */

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js')
//import metaplex RPC - add database functionality
const raritychecker = require('../raritychecker/raritychecker.js')
const sql = require('../tools/commonSQL.js')//import SQL commands for getting supported collections
const w = require('../tools/winston.js')

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
      option.setName('tokenaddress')
        .setDescription('Token Address?')
        .setRequired(true)),

  //when command is triggered, do this
  async execute(interaction) {

    //get the inputs from the command
    var collectionKey = interaction.options.getString('collectionkey'); var tokenAddress = interaction.options.getString('tokenaddress')
    var supportedcollections = await sql.getSupportedCollections()//set supported collections from sql

    //check if collection is supported
    var validcollection = false
    for (var i = 0; i < supportedcollections.length; i++) {
      if (supportedcollections[i].collectionkey === collectionKey) {
        validcollection = true
        break
      }//end if
    }//end for

    if (validcollection) {//check if the user has typed a valid collection in the database
      rarityembed = await raritychecker.check(collectionKey, tokenAddress)//check rarity
      if (rarityembed) {//if an embed is returned, reply with it
        await interaction.reply({ embeds: rarityembed })
      } else {//if collection was present, but there was some error with this particular NFT
        w.log.error('error checking this rarity')
        await interaction.reply({ content: "The collection your entered **does** exist in our database, but not this NFT# please check you entered it correctly" })
      }//end else (if embed was returned)
    } else {//if collection wasnt in database (raritychecker.check function returned null)
      interaction.reply('The collection your entered is not in our database. Check spelling or supported collections with /supported collections')
    }//end else (if collection is in database)
  }, //end execute block
} //end module.exports
