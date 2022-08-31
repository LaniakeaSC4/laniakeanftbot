const { Client } = require('discord.js')
var discordclient

module.exports = {
	getClient: function () {
	  if (discordclient) return discordclient; // if it is already there, grab it here
	  discordclient = new Client({
		intents: [
		  GatewayIntentBits.Guilds,
		  GatewayIntentBits.GuildMessages,
		],
	  })
	  discordclient.login(process.env.BOTTOKEN)
	  return discordclient
	}//end function
  }//end export