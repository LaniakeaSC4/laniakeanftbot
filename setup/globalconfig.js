var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')

const w = require('../tools/winston.js')
const sql = require('../tools/commonSQL.js')//common sql related commands are in here

/*
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
		.addComponents(
			new ButtonBuilder()
				.setCustomId('configPrice-button')
				.setLabel('Configure Price Limits')
				.setStyle(ButtonStyle.Primary),
		)
	//send the reply (including button row)
	await interaction.reply({ content: "What would you like to configure?\n\n__Configure Rarities__\n Enabled or Disable particular rarities (e.g. All Rare Snipes) from all other bot functions.\n\n__Configure Price Limits__\nSet min/max prices for the snipes delivered to your server", components: [row], ephemeral: true })
} module.exports.configPanel = configPanel
*/
/*
Configure Rarities
Globally enable/disable rarity classes
*/

//configure rarity buttons/reply
async function configRarities(interaction) {
	//enable buttons
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
	//disable buttons
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

	//build discord action rows
	let buttonRow1 = new ActionRowBuilder()
		.addComponents([button1, button2, button3, button4])
	let buttonRow2 = new ActionRowBuilder()
		.addComponents([button5, button6, button7, button8])
const nextrow = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
    .setCustomId('raritiesNextBtn')
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary),
  )

	//send the reply (including button rows)
	await interaction.reply({
		embeds: [
			{
				"title": "🔥 __Feed Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "It is possible to disables entire classes of snipes (e.g. Disable all Rare Snipes).\n\nWhat snipes would you like to enable or disable? Note: this change **is global** and will start/stop the selected snipe rarity for all other services (e.g. Alpha Channels, Snipe Feed, Home Channel). Disabled rarities will still be available to the rarity chacker.\n\n1️⃣ Enable Rare Snipes\n2️⃣ Enable Epic Snipes\n3️⃣ Enable Legendary Snipes\n4️⃣ Enable Mythic Snipes\n\n5️⃣ Disable All Rare Snipes\n6️⃣ Disable All Epic Snipes\n7️⃣ Disable all Legendary Snipes\n8️⃣ Disable Mythic Snipes\n\nWhen your finished you can dismiss this message.",
				"footer": {
					"text": "Setup 3/5. To move on to next setup step press [Next]"
				},
			}
		],//end embed
		components: [buttonRow1, buttonRow2, nextrow],
		ephemeral: true
	})
} module.exports.configRarities = configRarities

//When a global config button is pressed, send it here for handling
async function buttonHandler(interaction) {
	//enable buttons
	if (interaction.customId === 'rareyes-button') { setRarityConfig(interaction, "rare_enabled", true) }
	if (interaction.customId === 'epicyes-button') { setRarityConfig(interaction, "epic_enabled", true) }
	if (interaction.customId === 'legendaryyes-button') { setRarityConfig(interaction, "legendary_enabled", true) }
	if (interaction.customId === 'mythicyes-button') { setRarityConfig(interaction, "mythic_enabled", true) }
	//disable buttons
	if (interaction.customId === 'rareno-button') { setRarityConfig(interaction, 'rare_enabled', false) }
	if (interaction.customId === 'epicno-button') { setRarityConfig(interaction, "epic_enabled", false) }
	if (interaction.customId === 'legendaryno-button') { setRarityConfig(interaction, "legendary_enabled", false) }
	if (interaction.customId === 'mythicno-button') { setRarityConfig(interaction, "mythic_enabled", false) }
} module.exports.buttonHandler = buttonHandler

//save new config in sql
async function setRarityConfig(interaction, column, setTo) {
	//save to SQL
	await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, column, setTo)
	//convert function inputs into friendly strings for the reply to user
	var status = ''; if (setTo === true) { status = 'enabled' }; if (setTo === false) { status = 'disabled' }
	var thisrarity = ''; if (column === 'rare_enabled') { thisrarity = 'rare' }; if (column === 'epic_enabled') { thisrarity = 'epic' }; if (column === 'legendary_enabled') { thisrarity = 'legendary' }; if (column === 'mythic_enabled') { thisrarity = 'mythic' }
	//reply
	await interaction.reply({ content: "Your " + thisrarity + " snipes have now been globally " + status + ". This message will auto delete in 5 seconds." })
	setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
}//end function setRarityConfig

/*
Configure global min/max prices
*/

//min/max setting dialogue triggered reply with options panel to click min/max
async function configPrices(interaction) {
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('setMinPrice-button')
				.setLabel('Set Min Price')
				.setStyle(ButtonStyle.Primary),
		)
		.addComponents(
			new ButtonBuilder()
				.setCustomId('setMaxPrice-button')
				.setLabel('Set Max Price')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
    new ButtonBuilder()
    .setCustomId('limitsNextBtn')
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary),
  )

	await interaction.reply({
	  embeds: [
			{
				"title": "🔥 __Feed Setup 3__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "If you would like to set a minimum or maximum (or both) list price for the snipes sent to your server you can do so below. When your done, you can dismiss this message.",
				"footer": {
					"text": "Setup 4/5. To move on to next setup step press [Next]"
				},
			}
		],//end embed
		components: [row],
		ephemeral: true
	})
} module.exports.configPrices = configPrices

//send minimum price entry modal
async function sendMinModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('setMin-modal')
		.setTitle('Enter minimum snipe price')
		.addComponents([
			new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('price-input')
					.setLabel('Minimum Snipe Price')
					.setStyle(TextInputStyle.Short)
					.setMinLength(1)
					.setMaxLength(5)
					.setPlaceholder('Enter 0.00 to 10,000')
					.setRequired(true),
			),//end actionrow add components
		])//end modal add components
	await interaction.showModal(modal)
} module.exports.sendMinModal = sendMinModal

//send max price entry modal
async function sendMaxModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('setMax-modal')
		.setTitle('Enter maximum snipe price')
		.addComponents([
			new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('price-input')
					.setLabel('Maximum Snipe Price')
					.setStyle(TextInputStyle.Short)
					.setMinLength(1)
					.setMaxLength(5)
					.setPlaceholder('Enter 0.00 to 10,000')
					.setRequired(true),
			),//end actionrow add components
		])//end modal add components
	await interaction.showModal(modal)
} module.exports.sendMaxModal = sendMaxModal

//when modal is submitted, validate input and store it
async function validateModalInput(interaction, column) {
	const response = interaction.fields.getTextInputValue('price-input')//get modal input text
	//check if number
	if (Number.isNaN(+response)) {//if when response is cast to a number it is NaN
		w.log.info('oh no! this was not a number')
	} else {//if it was a valid number
		w.log.info('This was a number. Lets do stuff')
		var thislimit = +response
		if (thislimit >= 0 && thislimit < 10000) {//if number is in some sensible range
			//save to SQL
			await sql.updateTableColumn("servers", "serverid", interaction.message.guildId, column, thislimit)
			//reply
			var minmax = ""; if (column === "max_price") { minmax = "Maximum" }; if (column === "min_price") { minmax = "Minimum" }
			await interaction.reply({ content: minmax + " snipe price has been set to: " + thislimit + ". This message will auto delete in 5 seconds." })
			setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
		} else {
			await interaction.reply({ content: "Min/max price must be between 0 and 10,000. Please enter a number in this range. This message will auto delete in 5 seconds." })
			setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
		}//end else out of range
	}//end else NaN
} module.exports.validateModalInput = validateModalInput
