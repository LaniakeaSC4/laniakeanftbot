/*
* Personal admin command
* Currently used for adding new metaplex databases
*/

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js');
//import common SQL commands
const sql = require('../tools/commonSQL.js')
//import sniper so we can restart it
const sniper = require('../sniper/sniper-main.js')
//premium management commands
const premium = require('../tools/premium.js')

//build the slash command
module.exports = {
	data: new SlashCommandBuilder()
		.setName('laniakea')
		.setDescription('BotOwner Commands')
		.addStringOption(option =>
			option.setName('action')
				.setDescription('What action?')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('data')
				.setDescription('What data?')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('extradata')
				.setDescription('extra data?')
				.setRequired(false)),

	//when command is triggered, do this
	async execute(interaction) {
		var action = interaction.options.getString('action'); var data = interaction.options.getString('data')

		if (interaction.member.user.id === "684896787655557216") {

			//restart the sniper intervals
			if (action === 'restart') {
				await interaction.reply({ content: "Sniper Bot restarted", ephemeral: true })
				await sniper.stop()
				await sniper.initialise()
			}

			if (action === 'premium') {
				var serverid = data
				var daysToAdd = 0
				if (interaction.options.getString('extradata')) { daysToAdd = parseFloat(interaction.options.getString('extradata')) } //if there is extra data, set daysToAdd to it
				await premium.update(serverid, daysToAdd, interaction)
			}

			//restart the sniper intervals
			const sales = require('../salesbot/sales.js')
			if (action === 'sales') {
				await interaction.reply({ content: "Logging Sales", ephemeral: true })
				await sales.go()
			}

		}//end if user is laniakea
	},//end execute block
}//end module.exports
