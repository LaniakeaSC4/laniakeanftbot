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
    
    getUpVotes()
    
    
  }, //end execute block
} //end module.exports

//get up votre
async function getUpVotes() {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		var querystring = 'SELECT votemeslug,COUNT (votemeslug) FROM votes WHERE votetype = \'up\' GROUP BY votemeslug;'

		pgclient.query(querystring, (err, res) => {
			if (err) throw err
			
			w.log.info(JSON.stringify(res))
			
		}) //end query
	}) //end promise 
}
