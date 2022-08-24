/*
* Personal admin command
* Currently used for adding new metaplex databases
*/

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js');

//import metaplex RPC - add database functionality
const metaplex = require('../sniper/v2/addCollection.js')
//import common SQL commands
const sql = require('../tools/commonSQL.js')

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
    var meslug = ''
    if (interaction.options.getString('extradata')) { meslug = interaction.options.getString('extradata') }//if there is extra data, set meslug to it

    //for adding new metaplex collections
    if (interaction.member.user.id === "684896787655557216") {
      if (action === ('fulladd' || 'addstep1' || 'addstep2' || 'addstep3' || 'addstep4' || 'addstep5')) { await interaction.reply({ content: "Command recieved. Adding new collection to database" }) }
      if (action === 'fulladd') { await metaplex.addNewNFT(data, meslug) }
      if (action === 'addstep1') { await metaplex.getMetaplexData(data) }
      if (action === 'addstep2') { await metaplex.calculateTraitPercentages(data) }
      if (action === 'addstep3') { await metaplex.combineTraitRarity(data) }
      if (action === 'addstep4') { await metaplex.rankNFTs(data, meslug) }
      if (action === 'addstep5') { await metaplex.cleanupDatabase(data) }
      
    }//end if user is laniakea
	},//end execute block
}//end module.exports
