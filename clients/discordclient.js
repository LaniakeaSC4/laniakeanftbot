/* Creates new discord client and returns that connected client to a function that needs it */

const { Client, GatewayIntentBits } = require('discord.js')
var discordclient

module.exports = {
	getClient: function () {
		if (discordclient) return discordclient; // if it is already there, grab it here and return it
		//else, set up new client, connect it and return it
		discordclient = new Client({
		  allowedMentions: { parse: ['users', 'roles'], repliedUser: true }, 
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
			],
		})
		discordclient.login(process.env.BOTTOKEN)
		return discordclient
	}//end function
}//end export
