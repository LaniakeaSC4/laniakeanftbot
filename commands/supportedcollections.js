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
   
   collections = await sql.getOurMetaplexCollections() 
   var replystring = '```'
   
   for (var i =0;i < collections.length;i++){
     
     replystring = replystring + ', ' + collections[0].collectionkey
     
   } 
   
   replystring = replystring + '```'
   
    await interaction.reply({ content : replystring })
  }, //end execute block
} //end module.exports
