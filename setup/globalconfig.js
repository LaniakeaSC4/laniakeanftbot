var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')

const w = require('../tools/winston.js')
const sql = require('../tools/commonSQL.js')//common sql related commands are in here

//respond to global config button press
async function configPanel(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('configrarity-button')
				.setLabel('Configure Rarities')
				.setStyle(ButtonStyle.Primary),
		)
	//send the reply (including button row)
	await interaction.reply({ content: "What would you like to config?", components: [row], ephemeral: true })
} module.exports.configPanel = configPanel

//
async function configRarities(interaction) {
	//build a new button row for the command reply
	//enable
	let button1 = new ButtonBuilder()
		.setStyle(ButtonStyle.Secondary)
		.setLabel("1️⃣")
		.setCustomId("rareyes-button")

	let button2 = new ButtonBuilder()
		.setLabel("2️⃣")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId("epicyes-button")
		
	let button3 = new ButtonBuilder()
		.setLabel("3️⃣")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId("legendaryyes-button")

let button4 = new ButtonBuilder()
		.setLabel("4️⃣")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId("mythicyes-button")
		
let button5 = new ButtonBuilder()
		.setStyle(ButtonStyle.Secondary)
		.setLabel("5️⃣")
		.setCustomId("rareno-button")

	let button6 = new ButtonBuilder()
		.setLabel("6️⃣")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId("epicno-button")
		
	let button7 = new ButtonBuilder()
		.setLabel("7️⃣")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId("legendaryno-button")

let button8 = new ButtonBuilder()
		.setLabel("8️⃣")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId("mythicno-button")  
		
		let buttondone = new ButtonBuilder()
		.setLabel("8️⃣")
		.setStyle(ButtonStyle.Secondary)
		.setCustomId("rarityDone-button")  
	
let buttonRow1 = new ActionRowBuilder()
		.addComponents([button1, button2, button3, button4])
	
let buttonRow2 = new ActionRowBuilder()
		.addComponents([button5, button6, button7, button8]) 
		

let buttonrow3 = new ActionRowBuilder()
.addComponents([buttondone])


	//send the reply (including button row)
	await interaction.reply({ content: "What channels would you like to change?", components: [buttonRow1, buttonRow2, buttonRow3], ephemeral: true })
} module.exports.configRarities = configRarities
