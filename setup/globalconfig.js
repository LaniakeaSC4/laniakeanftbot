var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle, MessageButton } = require('discord.js')

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
	let button1 = new MessageButton()
		.setStyle("SECONDARY")
		.setEmoji("1️⃣")
		.setCustomId("rareyes-button")

	let button2 = new MessageButton()
		.setEmoji("2️⃣")
		.setStyle("SECONDARY")
		.setCustomId("epicyes-button")
		
	let button3 = new MessageButton()
		.setEmoji("3️⃣")
		.setStyle("SECONDARY")
		.setCustomId("legendaryyes-button")

let button4 = new MessageButton()
		.setEmoji("4️⃣")
		.setStyle("SECONDARY")
		.setCustomId("mythicyes-button")
		
let button5 = new MessageButton()
		.setStyle("SECONDARY")
		.setEmoji("5️⃣")
		.setCustomId("rareno-button")

	let button6 = new MessageButton()
		.setEmoji("6️⃣")
		.setStyle("SECONDARY")
		.setCustomId("epicno-button")
		
	let button7 = new MessageButton()
		.setEmoji("7️⃣")
		.setStyle("SECONDARY")
		.setCustomId("legendaryno-button")

let button8 = new MessageButton()
		.setEmoji("8️⃣")
		.setStyle("SECONDARY")
		.setCustomId("mythicno-button")  
		
		let buttondone = new MessageButton()
		.setEmoji("8️⃣")
		.setStyle("SECONDARY")
		.setCustomId("rarityDone-button")  
	
let buttonRow1 = new MessageActionRow()
		.addComponents([button1, button2, button3, button4])
	
let buttonRow2 = new MessageActionRow()
		.addComponents([button5, button6, button, button8]) 
		

let buttonrow3 = new MessageActionRow()
.addComponents([buttondone])


	//send the reply (including button row)
	await interaction.reply({ content: "What channels would you like to change?", components: [buttonrow1, buttonrow1, buttonrow3], ephemeral: true })
} module.exports.configRarities = configRarities
