/*
 * Command leaderboard for up/down votes
 */

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js')
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
    upvotes.sort((a, b) => b.count - a.count)
    var upPostString = ''

    if (upvotes.length != 0) {//if there are some upvotes
      if (upvotes.length <= 5) {//if there are less than 5 votes, prepare them all for printing to the reply
        for (var i = 0; i < upvotes.length; i++) {
          upPostString = upPostString + '[' + upvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + upvotes[i].rawmeslug + '): ' + upvotes[i].count + ' votes.\n'
        }//end for
      } else {//if there were more than 5,lets do top 5 (they're already sorted)
        for (var i = 0; i < 5; i++) {
          upPostString = upPostString + '[' + upvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + upvotes[i].rawmeslug + '): ' + upvotes[i].count + ' votes.\n'
        }//end for 5
      }//end else more than 5
      upPostString = upPostString.slice(0, -1)//remove last linebreak
    } else {//if there was not any votes
      upPostString = 'None! Vote using `/vote`'
    }//if upvotes is 0

    //downvotes
    var downvotes = await getDownVotes()
    //sort
    downvotes.sort((a, b) => b.count - a.count)
    var downPostString = ''

    if (downvotes.length != 0) {//if there was some downvotes
      if (downvotes.length <= 5) {//if there are less than 5 votes, prepare them all for printing to the reply
        for (var i = 0; i < downvotes.length; i++) {
          downPostString = downPostString + '[' + downvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + downvotes[i].rawmeslug + '): ' + downvotes[i].count + ' votes.\n'
        }//end for
      } else {//if there were more than 5,lets do top 5 (they're already sorted) 
        for (var i = 0; i < 5; i++) {
          downPostString = downPostString + '[' + downvotes[i].votemeslug + '](https://magiceden.io/marketplace/' + downvotes[i].rawmeslug + '): ' + downvotes[i].count + ' votes.\n'
        }//end for 5
      }//end else
      downPostString = downPostString.slice(0, -1)//remove last linebreak 
    } else {//if there were not any downvotes
      downPostString = 'None! Vote using `/vote`'
    }//if downvotes was 0

    //post it
    interaction.reply({
      embeds: [
        {
          "title": "Community Collection Vote Leaderboard",
          "description": "Here is the leaderboard of collections the community has voted to be added or removed from Laniakea Sniper. Cast your vote with `/vote`.",
          "color": 0xed2839,
          "fields": [
            {
              "name": "⬆️ Upvoted collecitons to add",
              "value": upPostString,
              "inline": false
            },
            {
              "name": "⬇️ Downvoted collections for removal",
              "value": downPostString,
              "inline": false
            }
          ]
        }
      ]//end embed 
    })//end interaction.reply
  }, //end execute block
} //end module.exports

//import dB client
var db = require('../clients/pgclient.js')

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
}//end get upvotes function

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
}//end get downvotes function
