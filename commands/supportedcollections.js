/*
 * Command to show users our supported collections
 */

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js')
//import common SQL commands
const sql = require('../tools/commonSQL.js')

//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('supportedcollections')
    .setDescription('Shows which collections the rarity checker supports'),

  //when command is triggered, do this
  async execute(interaction) {
   
   var unsortedcollections = await sql.getOurMetaplexCollections() 
   
   var collections = unsortedcollections.sort((a, b) => a.collectionkey - b.collectionkey)
   
   var replystring = '```' + collections[0].collectionkey
   
   for (var i =1;i < collections.length;i++){
     
     replystring = replystring + ', ' + collections[i].collectionkey
     
   } 
   
   replystring = replystring + '```'
   
    await interaction.reply({ content : replystring })
  }, //end execute block
} //end module.exports
