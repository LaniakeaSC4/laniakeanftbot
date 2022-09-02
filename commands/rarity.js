/*
 * Rarity checker command
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
      option.setName('nftid')
        .setDescription('Which NFT # in the collection?')
        .setRequired(true)),

  //when command is triggered, do this
  async execute(interaction) {
    //get the inputs from the command
    var collectionKey = interaction.options.getString('collectionkey'); var nftid = interaction.options.getString('nftid')
    var supportedcollections = await sql.getOurMetaplexCollections()//set supported collections from sql
    w.log.info('collection key is; ' + collectionKey.toString())
    w.log.info('supported collections are: ')
    w.log.info(supportedcollections.toString())
    if (supportedcollections.includes(collectionKey)) {//check if the user has typed a valid collection in the database
      rarityembed = await raritychecker.check(collectionKey, nftid)//check rarity
      if (rarityembed) {//if an embed is returned, reply with it
        await interaction.reply({ embeds: rarityembed })
      } else {//if null was returned
        w.log.error('error checking this rarity')
        await interaction.reply({ content: "there has been an error checking this NFT" })
      }//end else (if embed was returned)
    } else {//if collection wasnt in database
      interaction.reply('The collection your entered is not in our database. Check spelling or supported collections with /supported collections')
    }//end else (if collection is in database)
  }, //end execute block
} //end module.exports
