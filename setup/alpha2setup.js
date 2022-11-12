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
var thisNewChannel = { "enabled": {} }

//Main /setup message has a "set up home channel" button. When pressed, send this setup panel
async function addChannelMain(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('addAlphaCh-button')
				.setLabel('Add Channel')
				.setStyle(ButtonStyle.Primary),
		)

	/*
	
	{"enabled": false,
	  "channels": 
	  [
		{cid:1234,collections : 
		  [
		  meslug, meslug, meslug
		  ]
		}
	  ]
	}
	*/

	//reset config vars for any previous setup for this server
	thisNewChannel.enabled[interaction.guildId] = []

	//get current home channels for message reply
	var alphaconfig = await sql.getData("servers", "serverid", interaction.guildId, "alphaconfig")

	
	var currentChannels = ''
	var channelCount = 1
	for (var i = 0; i < alphaconfig.channels.length; i++) {
		var theseChannels = ''
		for (var j = 0; j < alphaconfig.channels[i].collections.length; j++) {
			theseChannels = theseChannels + alphaconfig.channels[i].collections[j] + ', '
		}
		theseChannels = theseChannels.slice(0, -2)
		currentChannels = currentChannels + channelCount + ': ' + theseChannels + '\n'
		channelCount++
	}

	if (currentChannels === '') { currentChannels = "none" }

	//send the reply (including button row)
	await interaction.reply({
		embeds: [
			{
				"title": "🎯 __Alpha Channel Setup 1__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Alpha Channels allow you to select one or more collections for which snipes of **any rarity** will be redirected into a dedicated \'Alpha channel\'. \n\nPress \"Add Alpha Channel\" below to begin creating a new Alpha channel.",
				"fields": [
					{
						"name": "Current Alpha Channels",
						"value": currentChannels,
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


//2nd dialogue for setup of this particualr channel
async function newChannel(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('addAlphaCol-button')
				.setLabel('Add Collection')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
			new ButtonBuilder()
				.setCustomId('doneAlphaCh-button')
				.setLabel('Create')
				.setStyle(ButtonStyle.Success),
		)

	//reset config vars for any previous setup for this server
	thisNewChannel.enabled[interaction.guildId] = []

	await interaction.reply({
		embeds: [
			{
				"title": "🎯 __Alpha Channel Setup 2__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Press [Add Collection] below and enter a Magic Eden link to a supported collection you would like in this alpha channel. For a list of supported collections please use `/supportedcollections`. When you have added all the collections you wish for this alpha channel, press [Create] to create the channel",
				"fields": [
					{
						"name": "Creating Channel for",
						"value": 'None yet',
						"inline": false
					},
				],
				"footer": {
					"text": "D: https://discord.gg/CgF7neAte2 | W: nftsniperbot.xyz"
				},
			}
		],//end embed
		ephemeral: true,
		components: [row]
	})

} module.exports.newChannel = newChannel


//when "Add Collection" is pressed, show a modal to capture the ME address
async function sendModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('submitAlpha-modal')
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
			if (!thisNewChannel.enabled[interaction.guildId].includes(meslug)) {//only if we haven't already added this one
				found = true
				thisNewChannel.enabled[interaction.guildId].push(meslug)//push it to the thisNewChannel. We will gather them up here while the user enters them.
				//update interaction to list the ones they have added so far
				interaction.update({
					embeds: [
						{
							"title": "🎯 __Alpha Channel Setup__ ",
							"color": parseInt('0x9901f6', 16),
							"description": "Adding new channel",
							"fields": [
								{
									"name": "Adding",
									"value": thisNewChannel.enabled[interaction.guildId].toString(),
									"inline": false
								},
							],
							"footer": {
								"text": "D: https://discord.gg/CgF7neAte2 | W: nftsniperbot.xyz"
							},
						}
					],//end embed
					ephemeral: true
				})
				break//if we have found it, dont need to loop more
			} else {
				found = true; interaction.update({//set found to true as it was found, just a duplicate. Avoids not found error.
					embeds: [
						{
							"title": "🎯 __Alpha Channel Setup__ ",
							"color": parseInt('0x9901f6', 16),
							"description": "Adding new channel",
							"fields": [
								{
									"name": "Adding",
									"value": thisNewChannel.enabled[interaction.guildId].toString(),
									"inline": false
								},
							],
							"footer": {
								"text": "D: https://discord.gg/CgF7neAte2 | W: nftsniperbot.xyz"
							},
						}
					],//end embed
					ephemeral: true
				})
			}
		}//end if
	}//end for

	if (found === false) {
		await interaction.reply({ content: 'Collection ' + meslug + 'was not found in our supported collections. View all supported collections with /supportedcollections. This message will auto-delete in 5 seconds' });
		setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
	}//end if !found
} module.exports.validateCollection = validateCollection

async function done(interaction) {
	if (thisNewChannel.enabled[interaction.message.guildId].length != 0) {

		//create alpha channel if not already existing
		var newID = await setupchannel(interaction)
w.log.info('newID was returned as ' + newID)
		if (newID) {
			//get current config
			var config = await sql.getData("servers", "serverid", interaction.guildId, "alphaconfig")
			var theseSlugs = thisNewChannel.enabled[interaction.guildId]

			//add this config to it
			config.channels.push({
			  "channelID" : newID,
			  "collections" : theseSlugs
			})

			//store it
			await sql.updateTableColumn('servers', 'serverid', interaction.guildId, 'alphaconfig', config)
			
			thisNewChannel.enabled[interaction.message.guildId] = []//blank this after storage

			//reply success message
			await interaction.reply({ content: "Changes saved. All snipes for the collections you added will now redirect to this Alpha Channel. You can now dismiss this message.", ephemeral: true })

		} else {
			await interaction.reply({ content: "As you did not identify any collections, no changes have been made to your Alpha Channel setup. You can now dismiss this message.", ephemeral: true })
		}
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
		w.log.info('setting up new alpha channel for guild ' + guildid)
		const guild = await client.guilds.fetch(guildid)

		//get saved sniper channels (if any)
		const existingchannels = await sql.getServerRow(guildid)//need to add the home channel to the sql function


		var channelcheck = {
			"snipecategory": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "LANIAKEA SNIPER BOT", "servercolumn": "snipecategory" }
		}


		//if any of the channels are found in SQL, update channelcheck to say we have found them
		if (existingchannels[0].snipecategory) { channelcheck.snipecategory.dbfound = true; channelcheck.snipecategory.db_cid = existingchannels[0].snipecategory }

		//get the guild channels to see if our saved ones still exist
	var channels =	await guild.channels.fetch()
			
				channels.forEach(async channel => {
					if (channel) {
						//check for the channels in server
						if (channel.id === channelcheck.snipecategory.db_cid) {
							w.log.info('Found the saved category channel')
							channelcheck.snipecategory.serverfound = true
							channelcheck.snipecategory.server_cid = channel.id
							channelcheck.snipecategory.verified = true
						}//end if match category channel
					}//end if a channel is recieved (not null) from discord. Can be null if bot has no access to any channels
				})//end forEach

				//first check and create the category channel
				if (channelcheck.snipecategory.verified === false) {
					w.log.info('Category channel was not found - creating it')
					var newchannel = await guild.channels.create({
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
					})
						w.log.info('created new category channel it\'s ID is:')
						w.log.info(newchannel.id)
						channelcheck.snipecategory.server_cid = newchannel.id//save category channel ID to we can add children
						await sql.updateTableColumn('servers', 'serverid', guildid, 'snipecategory', newchannel.id)
					
						var newID = await createchildren()
						return newID
					
				} else {
					w.log.info('Category channel already existed')
					var newID = await createchildren()
					return newID
				}//end else

				//create children channels under the category. For home channel, only will be one child
				async function createchildren() {
					//get the category channel object so we can add children
					w.log.info('fetching category channel')
					const laniakeacategory = await client.channels.fetch(channelcheck.snipecategory.server_cid)

					var newchannel = await guild.channels.create({
						name: "alpha-channel",
						type: ChannelType.GuildText,
						parent: laniakeacategory
					})
						w.log.info('created new channel ' + newchannel.name + ' it\'s ID is: ' + newchannel.id)
						return newchannel.id
					

				}//end createchildren function
			
	} else { return null }//end if valid server
}//end setupchannel
