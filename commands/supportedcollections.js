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
    var unsortedcollections = await sql.getOurMetaplexCollections()//set from sql
    //sort alphabetically
    var collections = unsortedcollections.sort((a, b) => (a.collectionkey > b.collectionkey) ? 1 : ((b.collectionkey > a.collectionkey) ? -1 : 0))
    //start reply with codeblock markdown and first sorted element
    var replystring = '```' + collections[0].collectionkey
    for (var i = 1; i < collections.length; i++) {//from second element to the end
      //add each collection and a comma
      replystring = replystring + ', ' + collections[i].collectionkey
    }//end for
    replystring = replystring + '```'//close the codeblock
    await interaction.reply({ content: replystring })//send reply
  }, //end execute block
} //end module.exports
