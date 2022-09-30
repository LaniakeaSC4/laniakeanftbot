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
		.setStyle(ButtonStyle.Success)
		.setLabel("1️⃣")
		.setCustomId("rareyes-button")

	let button2 = new ButtonBuilder()
		.setLabel("2️⃣")
		.setStyle(ButtonStyle.Success)
		.setCustomId("epicyes-button")
		
	let button3 = new ButtonBuilder()
		.setLabel("3️⃣")
		.setStyle(ButtonStyle.Success)
		.setCustomId("legendaryyes-button")

let button4 = new ButtonBuilder()
		.setLabel("4️⃣")
		.setStyle(ButtonStyle.Success)
		.setCustomId("mythicyes-button")
		
let button5 = new ButtonBuilder()
		.setStyle(ButtonStyle.Danger)
		.setLabel("5️⃣")
		.setCustomId("rareno-button")

	let button6 = new ButtonBuilder()
		.setLabel("6️⃣")
		.setStyle(ButtonStyle.Danger)
		.setCustomId("epicno-button")
		
	let button7 = new ButtonBuilder()
		.setLabel("7️⃣")
		.setStyle(ButtonStyle.Danger)
		.setCustomId("legendaryno-button")

let button8 = new ButtonBuilder()
		.setLabel("8️⃣")
		.setStyle(ButtonStyle.Danger)
		.setCustomId("mythicno-button")  
	
let buttonRow1 = new ActionRowBuilder()
		.addComponents([button1, button2, button3, button4])
	
let buttonRow2 = new ActionRowBuilder()
		.addComponents([button5, button6, button7, button8]) 


	//send the reply (including button row)
await interaction.reply({
  content: "What channels would you like to change?\n\n1️⃣ Enable Rare Snipes\n2️⃣ Enable Epic Snipes\n3️⃣ Enable Legendary Snipes\n4️⃣ Enable Mythic Snipes\n\n5️⃣ Disable All Rare Snipes\n6️⃣Disable All Epic Snipes\n7️⃣Disable all Legendary Snipes\n8️⃣Disable Mythic Snipes\n\nWhen your finished you can dismiss this message.",
  components: [buttonRow1, buttonRow2], 
  ephemeral: true })
} module.exports.configRarities = configRarities

//handle a button press
async function buttonHandler(interaction) {
  //enable
if (interaction.customId === 'rareyes-button') {
  setRarityConfig(interaction,"rare_enabled",true)
}
if (interaction.customId === 'epicyes-button') {
  setRarityConfig(interaction,"epic_enabled",true)
}
if (interaction.customId === 'legendaryyes-button') {
  setRarityConfig(interaction,"legendary_enabled",true)
}
if (interaction.customId === 'mythicyes-button') {
  setRarityConfig(interaction,"mythic_enabled",true)
}
//disable
if (interaction.customId === 'rareno-button') {
  setRarityConfig(interaction,'rare_enabled',false)
}
if (interaction.customId === 'epicno-button') {
  setRarityConfig(interaction,"epic_enabled",false)
}
if (interaction.customId === 'legendaryno-button') {
  setRarityConfig(interaction,"legendary_enabled",false)
}
if (interaction.customId === 'mythicno-button') {
  setRarityConfig(interaction,"mythic_enabled",false)
}
} module.exports.buttonHandler = buttonHandler

async function setRarityConfig(interaction,column,setTo) {
  await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, column, setTo)
  var status = '';if (setTo === true) {status = 'enabled'}; if (setTo === false) {status = 'disabled'}
  var thisrarity = ''
  if (column === 'rare_enabled') {thisrarity = 'rare'}
  if (column === 'epic_enabled') {thisrarity = 'epic'}
  if (column === 'legendary_enabled') {thisrarity = 'legendary'}
  if (column === 'mythic_enabled') {thisrarity = 'mythic'}
  await interaction.reply({content : "Your " + thisrarity + " snipes have now been globally " + status + ". This message will auto delete in 5 seconds."})
  setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
}
