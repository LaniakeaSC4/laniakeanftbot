/*
 * Command leaderboard for up/down votes
 */

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js')
//import common SQL commands
const sql = require('../tools/commonSQL.js')
var db = require('../clients/pgclient.js')
const w = require('../tools/winston.js')

//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View community votes to add/remove collections.'),

  //when command is triggered, do this
  async execute(interaction) {
    
   var upvotes = await getUpVotes()
   var poststring = ''
   
   if (upvotes.length!=0) {
   
   if (upvotes.length <= 5) {
   for (var i = 0; i < upvotes.length;i++){
     poststring = poststring + upvotes[i].votemeslug + ': ' + upvotes[i].count + ' votes. [link]\n'
   }
   } else {
   for (var i = 0; i < 5;i++){
     poststring = poststring + upvotes[i].votemeslug + ': ' + upvotes[i].count + ' votes. [link]\n'
   }
   }
   poststring = poststring.slice(0,-2)//remove last linebreak
   
   //post it
   interaction.reply({
     			embeds: [
				{
					"title": "leaderboard",
					"color": 0x000000,
					"fields": [
						{
							"name": "Upvotes",
							"value": poststring,
							"inline": false
						}
						] 
				}
			]//end embed 
   })
   
   }//end if not 0
    
  }, //end execute block
} //end module.exports

//get up votre
async function getUpVotes() {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		var querystring = 'SELECT votemeslug,COUNT (votemeslug) FROM votes WHERE votetype = \'up\' GROUP BY votemeslug;'

		pgclient.query(querystring, (err, res) => {
			if (err) throw err
			
			resolve(res.rows)
			
		}) //end query
	}) //end promise 
}
