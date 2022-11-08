var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')
const w = require('../tools/winston.js')
const sql = require('../tools/commonSQL.js')//common sql related commands are in here

//global var to hold supported collections. Populated in homechannelsetup1. Accessed in homechannelsetup3
var supportedcollections = {}
//Global var to hold valid/supported collections user is adding to this homechannel
var homecollections = { "enabled": {} }

//Main /setup message has a "set up home channel" button. When pressed, send this setup panel
async function addChannelMain(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('addHomeCollection-button')
				.setLabel('Add Channel')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
			new ButtonBuilder()
				.setCustomId('donehome-button')
				.setLabel('Done')
				.setStyle(ButtonStyle.Secondary),
		)
	//reset config vars for any previous setup for this server
	homecollections.enabled[interaction.message.guildId] = []

	//send the reply (including button row)
	await interaction.reply({
		embeds: [
			{
				"title": "Home Channel Setup",
				"color": parseInt('0x9901f6', 16),
				"fields": [
					{
						"name": "🎯 __Alpha Channel Setup__",
						"value": "Home Channel allows you to select multiple collections (e.g. Collections for your NFT project) for which snipes of **any rarity** will go into a dedicated \'Home channel\'. If you have Snipe Feed enabled, collections you add to your home channel will be redirected from the snipe feed into your home channel. You can add multiple collections, but you may only have one home channel.\n\nPress \"Add collection\" below and enter the Magic Eden link to the collection you would like to add to your home channel. When you have added all the collections you wish to be in your homechannel, press Done.",
						"inline": false
					},
				],
				"footer": {
					"text": "D: https://discord.gg/CgF7neAte2 | W: nftsniperbot.xyz"
				},
			}
		],//end embed
		components: [row], ephemeral: true
	})
} module.exports.addChannelMain = addChannelMain

//2nd fialogue for setup of this particualr channel

//when "Add Collection" is pressed, show a modal to capture the ME address
async function sendModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('submithome-modal')
		.setTitle('Enter Magic Eden Link to collection')
		.addComponents([
			new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('collection-input')
					.setLabel('Collection ID')
					.setStyle(TextInputStyle.Short)
					.setMinLength(2)
					.setMaxLength(120)
					.setPlaceholder('e.g. https://magiceden.io/marketplace/{your-collection}')
					.setRequired(true),
			),//end actionrow add components
		])//end modal add components
	await interaction.showModal(modal)
} module.exports.sendModal = sendModal

//function to process the input from the modal sent in homechannelsetup2
async function validateCollection(interaction) {
	const response = interaction.fields.getTextInputValue('collection-input')//get modal input text
	var meslug = response.substring(response.lastIndexOf('magiceden.io/marketplace/') + 25).replace(/[^0-9a-z]/gi, '')//find the end slug and clean it (same process as cleaning to colleciton key in SQL)
	//get collections and populate global var
	supportedcollections = {}//clear and repopulate in case collections have changed since last time command was run
	supportedcollections = await sql.getSupportedCollections()//set from sql

	var found = false//start as false
	for (var i = 0; i < supportedcollections.length; i++) {//loop supported collections recieved from SQL
		if (supportedcollections[i].collectionkey === meslug) {//if collection entered by user is found in our supported collections
			if (!homecollections.enabled[interaction.message.guildId].includes(meslug)) {//only if we haven't already added this one
				found = true
				homecollections.enabled[interaction.message.guildId].push(meslug)//push it to the homecollections. We will gather them up here while the user enters them.
				//update interaction to list the ones they have added so far
				interaction.update({ content: "__**Home Channel Setup**__\n\nHome Channel allows you to select multiple collections (e.g. Collections for your NFT project) for which snipes of **any rarity** will go into a dedicated \'Home channel\'. If you have Snipe Feed enabled, collections you add to your home channel will be redirected from the Snipe Feed into your Home Channel. You can add multiple collections, but you may only have one Home Channel.\n\nPress **[Add collection]** below and enter the Magic Eden link to the collection you would like to add to your Home Channel. When you have added all the collections you wish to be in your Home Channel, press [Done].\n\nAdding: **" + homecollections.enabled[interaction.message.guildId].toString() + "**", ephemeral: true })
				break//if we have found it, dont need to loop more
			} else { found = true; interaction.update({ content: "__**Home Channel Setup**__\n\nHome Channel allows you to select multiple collections (e.g. Collections for your NFT project) for which snipes of **any rarity** will go into a dedicated \'Home channel\'. If you have Snipe Feed enabled, collections you add to your home channel will be redirected from the Snipe Feed into your Home Channel. You can add multiple collections, but you may only have one Home Channel.\n\nPress **[Add Collection]** below and enter the Magic Eden link to the collection you would like to add to your Home Channel. When you have added all the collections you wish to be in your Home Channel, press [Done].\n\nAdding: **" + homecollections.enabled[interaction.message.guildId].toString() + "**", ephemeral: true }) }//set found to true as it was found, just a duplicate. Avoids not found error.
		}//end if
	}//end for

	if (found === false) {
		await interaction.reply({ content: 'Collection ' + meslug + 'was not found in our supported collections. View all supported collections with /supportedcollections. This message will auto-delete in 5 seconds' });
		setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
	}//end if !found
} module.exports.validateCollection = validateCollection

async function done(interaction) {
	if (homecollections.enabled[interaction.message.guildId].length != 0) {

		//create home channel if not already existing
		setupchannel(interaction)
		var storecollections = { "enabled": homecollections.enabled[interaction.message.guildId] }
		homecollections.enabled[interaction.message.guildId] = []//blank this after storage
		//save validated supported collections gathered from user
		await sql.updateTableColumn('servers', 'serverid', interaction.message.guildId, 'homechannel_collections', storecollections)
		//enable homechannel mode
		await sql.updateTableColumn('servers', 'serverid', interaction.message.guildId, 'homechannel_enabled', true)
		//reply success message
		await interaction.reply({ content: "Changes saved. All snipes for the collections you added will now redirect to your Home Channel. You can now dismiss this message.", ephemeral: true })

	} else {
		await interaction.reply({ content: "As you did not identify any collections, no changes have been made to your Home Channel setup. You can now dismiss this message.", ephemeral: true })
	}
} module.exports.done = done

async function setupchannel(interaction) {
	if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { w.log.info('user didnt have manage channel permissions'); return null }
	//check if this server is in the table
	const guildid = interaction.message.guildId
	supportedservers = await sql.getSupportedServers()
	var validserver = false
	for (var i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].serverid === guildid) {
			if (supportedservers[i].premium === true) {//home channel is always premium
				validserver = true
				w.log.info('matched premium server in our database during homechannel setup: ' + guildid)
				break
			}//end if premium
		}//end if
	}//end for

	if (validserver) {//if a supported server and currently premium
		w.log.info('setting up home channel for guild ' + guildid)
		const guild = await client.guilds.fetch(guildid)

		//get saved sniper channels (if any)
		const existingchannels = await sql.getServerRow(guildid)//need to add the home channel to the sql function
		var channelcheck = {
			"snipecategory": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "LANIAKEA SNIPER BOT", "servercolumn": "snipecategory" },
			"homechannel": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Home Channel", "servercolumn": "homechannel_id" }
		}

		//if any of the channels are found in SQL, update channelcheck to say we have found them
		if (existingchannels[0].snipecategory) { channelcheck.snipecategory.dbfound = true; channelcheck.snipecategory.db_cid = existingchannels[0].snipecategory }
		if (existingchannels[0].homechannel_id) { channelcheck.homechannel.dbfound = true; channelcheck.homechannel.db_cid = existingchannels[0].homechannel_id }

		//get the guild channels to see if our saved ones still exist
		await guild.channels.fetch()
			.then(async channels => {
				channels.forEach(async channel => {
					if (channel) {
						//check for the channels in server
						if (channel.id === channelcheck.snipecategory.db_cid) {
							w.log.info('Found the saved category channel')
							channelcheck.snipecategory.serverfound = true
							channelcheck.snipecategory.server_cid = channel.id
							channelcheck.snipecategory.verified = true
						}//end if match category channel
						if (channel.id === channelcheck.homechannel.db_cid) {
							w.log.info('Found the saved homechannel channel')
							channelcheck.homechannel.serverfound = true
							channelcheck.homechannel.server_cid = channel.id
							channelcheck.homechannel.verified = true
						}//end if match home channel
					}//end if a channel is recieved (not null) from discord. Can be null if bot has no access to any channels
				})//end forEach

				//first check and create the category channel
				if (channelcheck.snipecategory.verified === false) {
					w.log.info('Category channel was not found - creating it')
					guild.channels.create({
						name: channelcheck.snipecategory.name,
						type: ChannelType.GuildCategory,
						permissionOverwrites: [
							{
								id: guild.roles.everyone,
								deny: [PermissionFlagsBits.ViewChannel],
							},
							{
								id: '996170261353222219',//the bot ID
								allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
							},
						]
					}).then(async newchannel => {
						w.log.info('created new category channel it\'s ID is:')
						w.log.info(newchannel.id)
						channelcheck.snipecategory.server_cid = newchannel.id//save category channel ID to we can add children
						await sql.updateTableColumn('servers', 'serverid', guildid, 'snipecategory', newchannel.id)
					}).then(async result => {
						createchildren()
					})//end then create children after cat channel
				} else {
					w.log.info('Category channel already existed')
					createchildren()
				}//end else

				//create children channels under the category. For home channel, only will be one child
				async function createchildren() {
					//get the category channel object so we can add children
					w.log.info('fetching category channel')
					const laniakeacategory = await client.channels.fetch(channelcheck.snipecategory.server_cid)
					for (const key in channelcheck) {
						if (key != 'snipecategory') {//we have created the category already
							if (channelcheck[key].verified === false) {//if this one isnt verified as present
								guild.channels.create({
									name: channelcheck[key].name,
									type: ChannelType.GuildText,
									parent: laniakeacategory
								}).then(async newchannel => {
									w.log.info('created new channel ' + newchannel.name + ' it\'s ID is: ' + newchannel.id)
									channelcheck.snipecategory.server_cid = newchannel.id//save category channel ID to we can add children
									await sql.updateTableColumn('servers', 'serverid', guildid, channelcheck[key].servercolumn, newchannel.id)
								})
							}//end if not verified as present
						}//end if not sniper category
					}//end for key in channelcheck
				}//end createchildren function
			})//end then for fetched channels
		return 'complete'
	} else { return null }//end if valid server
}//end setupchannel
