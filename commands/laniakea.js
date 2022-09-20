/*
* Personal admin command
* Currently used for adding new metaplex databases
*/

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js');

//import metaplex RPC - add database functionality
const metaplex = require('../sniper/addCollection.js')
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

		//for adding new metaplex collections
		if (interaction.member.user.id === "684896787655557216") {
			if (action === ('fulladd' || 'addstep1' || 'addstep2' || 'addstep3' || 'addstep4' || 'addstep5')) { 
			  await interaction.reply({ content: "Command recieved. Adding new collection to database", ephemeral: true }) 
			  var meslug = ''
			  if (interaction.options.getString('extradata')) { meslug = interaction.options.getString('extradata') } //if there is extra data, set meslug to it
if (action === 'fulladd') { await metaplex.addNewNFT(data, meslug) }
			if (action === 'addstep1') { await metaplex.getMetaplexData(data) }
			if (action === 'addstep2') { await metaplex.calculateTraitPercentages(data) }
			if (action === 'addstep3') { await metaplex.combineTraitRarity(data, meslug) }
			if (action === 'addstep4') { await metaplex.rankNFTs(data) }
			if (action === 'addstep5') { await metaplex.cleanupDatabase(data) }
			}
			
			//restart the sniper intervals
			if (action === 'restart') {
				await interaction.reply({ content: "Sniper Bot restarted", ephemeral: true })
				await sniper.stop()
				await sniper.initialise()
			}
			
			if (action === 'premium') {
			  var serverid = data
			  var daysToAdd = 0
			  if (interaction.options.getString('extradata')) { daysToAdd = parseFloat(interaction.options.getString('extradata'))} //if there is extra data, set meslug to it
				//await interaction.reply({ content: "Adding " + daysToAdd + " hours to server " + serverid, ephemeral: true })
				await premium.update(serverid, daysToAdd)
			}

		}//end if user is laniakea
	},//end execute block
}//end module.exports
