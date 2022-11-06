/*
* Personal admin command
* Currently used for adding new metaplex databases
*/

//import discord parts we need
const { SlashCommandBuilder } = require('discord.js');

//build the slash command
module.exports = {
	data: new SlashCommandBuilder()
		.setName('addcollection')
		.setDescription('Laniakea#3683 only')
		.addStringOption(option =>
			option.setName('vca')
				.setDescription('vca')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('meslug')
				.setDescription('meslug')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('bl')
				.setDescription('bl')
				.setRequired(false)),

	//when command is triggered, do this
	async execute(interaction) {
		

		//Add collection without storing stages in sql
		const addcollection = require('../sniper/autoAddCollection.js')

		if (interaction.member.user.id === "684896787655557216") {
			
		await interaction.reply({ content: "Command recieved. Adding new collection to database", ephemeral: true })
				
		var vca = interaction.options.getString('vca');
		var meslug = interaction.options.getString('meslug')
		
		var extraBlockList = []
		if (interaction.options.getString('bl')) {
		blockstring = interaction.options.getString('bl').toLowerCase()
		extraBlockList = blockstring.split(",")
		
		}//end if there is a blocklist
				
		await addcollection.addNewNFT(vca, meslug, extraBlockList) 

		} else {
		await interaction.reply({ content: "This command is currently only available to @Laniakea#3683", ephemeral: true })
		}//end if user is laniakea
	},//end execute block
}//end module.exports
