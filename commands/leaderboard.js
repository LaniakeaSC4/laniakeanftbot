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
    
   //upvotes
   var upvotes = await getUpVotes()
  //sort
  upvotes = upvotes.sort((a, b) => a.count + b.count)
   var upPostString = ''
   
   if (upvotes.length!=0) {
   
   if (upvotes.length <= 5) {
   for (var i = 0; i < upvotes.length;i++){
     upPostString = upPostString + '[' + upvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + upvotes[i].rawmeslug + '): ' + upvotes[i].count + ' votes.\n'
   }
   } else {
   for (var i = 0; i < 5;i++){
     upPostString = upPostString + '[' + upvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + upvotes[i].rawmeslug + '): ' + upvotes[i].count + ' votes.\n'
   }
   }
   upPostString = upPostString.slice(0,-1)//remove last linebreak
   } else {
     upPostString = 'None! Vote using `/vote`'
   }//if upvotes is 0
   
   //downvotes
   var downvotes = await getDownVotes()
   var downPostString = ''
   
   if (downvotes.length!=0) {
   
   if (downvotes.length <= 5) {
   for (var i = 0; i < downvotes.length;i++){
     downPostString = downPostString + '[' + downvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + downvotes[i].rawmeslug + '): ' + downvotes[i].count + ' votes.\n'
   }
   } else {
   for (var i = 0; i < 5;i++){
     downPostString = downPostString + '[' + downvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + downvotes[i].rawmeslug + '): ' + downvotes[i].count + ' votes.\n'
   }
   }
   downPostString = downPostString.slice(0,-1)//remove last linebreak 
   } else {
     downPostString = 'None! Vote using `/vote`'
   }//if downvotes was 0
   
   //post it
   interaction.reply({
     			embeds: [
				{
					"title": "leaderboard",
					"color": 0x000000,
					"fields": [
						{
							"name": "Upvoted collecitons to add",
							"value": upPostString,
							"inline": false
						}, 
						{
							"name": "Downvotes collections voted for removal",
							"value": downPostString,
							"inline": false
						} 
						] 
				}
			]//end embed 
   })
   

    
  }, //end execute block
} //end module.exports

//get up votes
async function getUpVotes() {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		var querystring = 'SELECT votemeslug, rawmeslug,COUNT (votemeslug) FROM votes WHERE votetype = \'up\' GROUP BY votemeslug, rawmeslug;'

		pgclient.query(querystring, (err, res) => {
			if (err) throw err
			
			resolve(res.rows)
			
		}) //end query
	}) //end promise 
}

//get down votes
async function getDownVotes() {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		var querystring = 'SELECT votemeslug, rawmeslug,COUNT (votemeslug) FROM votes WHERE votetype = \'down\' GROUP BY votemeslug, rawmeslug;'

		pgclient.query(querystring, (err, res) => {
			if (err) throw err
			
			resolve(res.rows)
			
		}) //end query
	}) //end promise 
}
