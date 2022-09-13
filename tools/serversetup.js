var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')

const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

async function start(interaction) {
	//check if user has managechannels (or is admin)
	if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { w.log.info('user didnt have manage channel permissions'); return null }

	var thisserver
	//check if this server is in the table
	const guildid = interaction.message.guildId
	supportedservers = await sql.getSupportedServers()
	var validserver = false
	for (var i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].serverid === guildid && supportedservers[i].inserver === true) {//if this server ID was found and bot is active in server
			validserver = true
			thisserver = supportedservers[i]
			w.log.info('matched server in our database during installation: ' + guildid)
			break
		}//end if
	}//end for

	if (validserver) {

		w.log.info('setting up guild ' + guildid)
		const guild = client.guilds.cache.get(guildid)//get guild from discord

		//get saved sniper channels (if any)
		const existingchannels = await sql.getServerRow(guildid)

		//temporty checking object to mark off what was found or what needs created
		var channelcheck = {
			"snipecategory": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "LANIAKEA SNIPER BOT", "servercolumn": "snipecategory" },
			"raresnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Rare Snipes", "servercolumn": "raresnipes", "premium": false },
			"epicsnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Epic Snipes", "servercolumn": "epicsnipes", "premium": false },
			"legendarysnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Legendary Snipes", "servercolumn": "legendarysnipes", "premium": true },
			"mythicsnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Mythic Snipes", "servercolumn": "mythicsnipes", "premium": true }
		}

		//if any of the channels are found in SQL, update channelcheck to say we have found them
		if (existingchannels[0].snipecategory) { channelcheck.snipecategory.dbfound = true; channelcheck.snipecategory.db_cid = existingchannels[0].snipecategory }
		if (existingchannels[0].raresnipes) { channelcheck.raresnipes.dbfound = true; channelcheck.raresnipes.db_cid = existingchannels[0].raresnipes }
		if (existingchannels[0].epicsnipes) { channelcheck.epicsnipes.dbfound = true; channelcheck.epicsnipes.db_cid = existingchannels[0].epicsnipes }
		if (existingchannels[0].legendarysnipes) { channelcheck.legendarysnipes.dbfound = true; channelcheck.legendarysnipes.db_cid = existingchannels[0].legendarysnipes }
		if (existingchannels[0].mythicsnipes) { channelcheck.mythicsnipes.dbfound = true; channelcheck.mythicsnipes.db_cid = existingchannels[0].mythicsnipes }

		//get the guild channels to see if our saved ones still exist
		await guild.channels.fetch()
			.then(async channels => {
				channels.forEach(async channel => {

					//check for the channels in server. If channel wasnt found db_cid would be null. Incorrect or null means serverfound wont get updated to true.
					//verified gets set true if both server and SQL are found and matched. If not, we will recreate
					if (channel.id === channelcheck.snipecategory.db_cid) {
						w.log.info('Found the saved category channel')
						channelcheck.snipecategory.serverfound = true
						channelcheck.snipecategory.server_cid = channel.id
						channelcheck.snipecategory.verified = true
					}
					if (channel.id === channelcheck.raresnipes.db_cid) {
						w.log.info('Found the saved raresnipes channel')
						channelcheck.raresnipes.serverfound = true
						channelcheck.raresnipes.server_cid = channel.id
						channelcheck.raresnipes.verified = true
					}
					if (channel.id === channelcheck.epicsnipes.db_cid) {
						w.log.info('Found the saved epicsnipes channel')
						channelcheck.epicsnipes.serverfound = true
						channelcheck.epicsnipes.server_cid = channel.id
						channelcheck.epicsnipes.verified = true
					}
					if (channel.id === channelcheck.legendarysnipes.db_cid) {
						w.log.info('Found the saved legendarysnipes channel')
						channelcheck.legendarysnipes.serverfound = true
						channelcheck.legendarysnipes.server_cid = channel.id
						channelcheck.legendarysnipes.verified = true
					}
					if (channel.id === channelcheck.mythicsnipes.db_cid) {
						w.log.info('Found the saved mythicsnipes channel')
						channelcheck.mythicsnipes.serverfound = true
						channelcheck.mythicsnipes.server_cid = channel.id
						channelcheck.mythicsnipes.verified = true
					}
				})//end channels for each

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
					})
				} else {
					w.log.info('Category channel already existed')
					createchildren()
				}

				async function createchildren() {
					//get the category channel object so we can add children
					w.log.info('fetching category channel')
					const laniakeacategory = await client.channels.fetch(channelcheck.snipecategory.server_cid)

					for (const key in channelcheck) {
						if (key != 'snipecategory') {//we have created the category already
							if (channelcheck[key].verified === false) {//if this one isnt verified as present
								//only create premium channels if premium server
								if (thisserver.premium === true || channelcheck[key].premium === false) {
									guild.channels.create({
										name: channelcheck[key].name,
										type: ChannelType.GuildText,
										parent: laniakeacategory
									}).then(async newchannel => {
										w.log.info('created new channel ' + newchannel.name + ' it\'s ID is: ' + newchannel.id)
										channelcheck.snipecategory.server_cid = newchannel.id//save category channel ID to we can add children
										await sql.updateTableColumn('servers', 'serverid', guildid, channelcheck[key].servercolumn, newchannel.id)
									})//end then
								}//end if premium
							}//end if verified was false
						}//end if key isnt snipecategory
					}//end for each key in channelcheck
				}//end createchildren
			})//end then after get channels
		return true
	} else { return null }//end if valid server
} module.exports.start = start

async function setuphomechannel(interaction) {
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

	if (validserver) {
		w.log.info('setting up home channel for guild ' + guildid)
		const guild = client.guilds.cache.get(guildid)

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
				channels.forEach(channel => {
					//check for the channels in server
					if (channel.id === channelcheck.snipecategory.db_cid) {
						w.log.info('Found the saved category channel')
						channelcheck.snipecategory.serverfound = true
						channelcheck.snipecategory.server_cid = channel.id
						channelcheck.snipecategory.verified = true
					}
					if (channel.id === channelcheck.homechannel.db_cid) {
						w.log.info('Found the saved homechannel channel')
						channelcheck.homechannel.serverfound = true
						channelcheck.homechannel.server_cid = channel.id
						channelcheck.homechannel.verified = true
					}
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
					})
				} else {
					w.log.info('Category channel already existed')
					createchildren()
				}

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
} module.exports.setuphomechannel = setuphomechannel

//global var to hold supported collections. Populated in homechannelsetup1. Accessed in homechannelsetup3
var supportedcollections = {}

//Main /setup message has a "set up home channel" button. When pressed, send this setup panel
async function homechannelsetup1(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('homechannelsetup2-button')
				.setLabel('Add Collection')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
			new ButtonBuilder()
				.setCustomId('done-button')
				.setLabel('Done')
				.setStyle(ButtonStyle.Secondary),
		)
	//send the reply (including button row)
	await interaction.reply({ content: "Press \"Add collection\" below and enter the Magic Eden link to the collection you would like to add to your home channel. When you have added all the collections you wish to be in your homechannel, press Done.\n\nAdding: ", components: [row], ephemeral: true })
} module.exports.homechannelsetup1 = homechannelsetup1

//when "Add Collection" is pressed, show a modal to capture the ME address
async function homechannelsetup2(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('homechannelsetup-modal')
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
} module.exports.homechannelsetup2 = homechannelsetup2

//Global var to hold valid/supported collections user is adding to this homechannel
var homecollections = { "enabled": [] }

//function to process the input from the modal sent in homechannelsetup2
async function homechannelsetup3(interaction) {
	const response = interaction.fields.getTextInputValue('collection-input')//get modal input text
	var meslug = response.substring(response.lastIndexOf('magiceden.io/marketplace/') + 25).replace(/[^0-9a-z]/gi, '')//find the end slug and clean it (same process as cleaning to colleciton key in SQL)

	//get collections and populate global var
	supportedcollections = {}//clear and repopulate in case collections have changed since last time command was run
	supportedcollections = await sql.getOurMetaplexCollections()//set from sql

	var found = false//start as false
	for (var i = 0; i < supportedcollections.length; i++) {//loop supported collections recieved from SQL
		if (supportedcollections[i].collectionkey === meslug) {//if collection entered by user is found in our supported collections
			found = true
			homecollections.enabled.push(meslug)//push it to the homecollections. We will gather them up here while the user enters them.
			//update interaction to list the ones they have added so far
			interaction.update({ content: "Press \"Add collection\" below and enter the Magic Eden link to the collection you would like to add to your home channel. When you have added all the collections you wish to be in your homechannel, press Done.\n\nAdding: " + homecollections.enabled.toString(), ephemeral: true })
			break//if we have found it, dont need to loop more
		}//end if
	}//end for

	if (!found) {
		await interaction.reply({ content: 'Collection ' + meslug + 'was not found in our supported collections. This message will delete in 5 seconds' });
		setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
	}//end if !found
} module.exports.homechannelsetup3 = homechannelsetup3

async function homechanneldone(interaction) {
	if (homecollections.enabled.length != 0) {

		//create home channel if not already existing
		setuphomechannel(interaction)

		//save validated supported collections gathered from user
		await sql.updateTableColumn('servers', 'serverid', interaction.message.guildId, 'homechannel_collections', homecollections)
		//enable homechannel mode
		await sql.updateTableColumn('servers', 'serverid', interaction.message.guildId, 'homechannel_enabled', true)
		//reply success message
		await interaction.reply({ content: "Changes saved. All snipes for the collections you added will now redirect to your Home Channel", ephemeral: true })

	} else {
		await interaction.reply({ content: "As you did not identify any collections, no changes have been made to your Home Channel setup.", ephemeral: true })
	}
} module.exports.homechanneldone = homechanneldone
