var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ChannelType, PermissionFlagsBits,
	ButtonBuilder, ButtonStyle } = require('discord.js')

const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

async function start(interaction) {
	//check if user has managechannels (or is admin)
	if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) { w.log.info('user didnt have manage channel permissions'); return null }

	//check if this server is in the table
	const guildid = interaction.message.guildId
	supportedservers = await sql.getSupportedServers()
	var validserver = false
	for (var i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].serverid === guildid) {
			validserver = true
			w.log.info('matched server in our database during installation: ' + guildid)
			break
		}//end if
	}//end for

	if (validserver) {

		//check if bot has manage channels on this server and if not return

		w.log.info('setting up guild ' + guildid)
		const guild = client.guilds.cache.get(guildid)

		//get saved sniper channels (if any)
		const existingchannels = await sql.getSniperChannels(guildid)
		w.log.info('log exisiting channels')
		w.log.info(existingchannels)

		var channelcheck = {
			"snipecategory": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "LANIAKEA SNIPER BOT", "servercolumn": "snipecategory" },
			"raresnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Rare Snipes", "servercolumn": "raresnipes" },
			"epicsnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Epic Snipes", "servercolumn": "epicsnipes" },
			"legendarysnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Legendary Snipes", "servercolumn": "legendarysnipes" },
			"mythicsnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Mythic Snipes", "servercolumn": "mythicsnipes" }
		}

		if (existingchannels[0].snipecategory) { channelcheck.snipecategory.dbfound = true; channelcheck.snipecategory.db_cid = existingchannels[0].snipecategory }
		if (existingchannels[0].raresnipes) { channelcheck.raresnipes.dbfound = true; channelcheck.raresnipes.db_cid = existingchannels[0].raresnipes }
		if (existingchannels[0].epicsnipes) { channelcheck.epicsnipes.dbfound = true; channelcheck.epicsnipes.db_cid = existingchannels[0].epicsnipes }
		if (existingchannels[0].legendarysnipes) { channelcheck.legendarysnipes.dbfound = true; channelcheck.legendarysnipes.db_cid = existingchannels[0].legendarysnipes }
		if (existingchannels[0].mythicsnipes) { channelcheck.mythicsnipes.dbfound = true; channelcheck.mythicsnipes.db_cid = existingchannels[0].mythicsnipes }

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

				})

				w.log.info('log final channelcheck')
				w.log.info(channelcheck)

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

							}
						}
					}
				}
			})

		return 'complete'
	} else { return null }//end if valid server
} module.exports.start = start

async function setuphomechannel(interaction) {
	//check if this server is in the table
	const guildid = interaction.message.guildId
	supportedservers = await sql.getSupportedServers()
	var validserver = false
	for (var i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].serverid === guildid) {
			validserver = true
			w.log.info('matched server in our database during homechannel setup: ' + guildid)
			break
		}//end if
	}//end for

	if (validserver) {
		w.log.info('setting up home channel for guild ' + guildid)
		const guild = client.guilds.cache.get(guildid)

		//get saved sniper channels (if any)
		const existingchannels = await sql.getSniperChannels(guildid)//need to add the home channel to the sql function
		//
		//
		//
		//
		//
		//
		/*
		w.log.info('log exisiting channels')
		//w.log.info(existingchannels)//winston error? 

		var channelcheck = {
			"snipecategory": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "LANIAKEA SNIPER BOT", "servercolumn": "snipecategory" },
			"raresnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Rare Snipes", "servercolumn": "raresnipes" },
			"epicsnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Epic Snipes", "servercolumn": "epicsnipes" },
			"legendarysnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Legendary Snipes", "servercolumn": "legendarysnipes" },
			"mythicsnipes": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Mythic Snipes", "servercolumn": "mythicsnipes" }
		}

		if (existingchannels[0].snipecategory) { channelcheck.snipecategory.dbfound = true; channelcheck.snipecategory.db_cid = existingchannels[0].snipecategory }
		if (existingchannels[0].raresnipes) { channelcheck.raresnipes.dbfound = true; channelcheck.raresnipes.db_cid = existingchannels[0].raresnipes }
		if (existingchannels[0].epicsnipes) { channelcheck.epicsnipes.dbfound = true; channelcheck.epicsnipes.db_cid = existingchannels[0].epicsnipes }
		if (existingchannels[0].legendarysnipes) { channelcheck.legendarysnipes.dbfound = true; channelcheck.legendarysnipes.db_cid = existingchannels[0].legendarysnipes }
		if (existingchannels[0].mythicsnipes) { channelcheck.mythicsnipes.dbfound = true; channelcheck.mythicsnipes.db_cid = existingchannels[0].mythicsnipes }

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

				})

				w.log.info('log final channelcheck')
				w.log.info(channelcheck)

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

							}
						}
					}
				}
			})

		return 'complete'*/
	} else { return null }//end if valid server
} module.exports.setuphomechannel = setuphomechannel

async function homechannelsetup1(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('homechannelsetup2-button')
				.setLabel('enter collection')
				.setStyle(ButtonStyle.Primary),
		)

	var unsortedcollections = await sql.getOurMetaplexCollections() //set from sql
	//sort alphabetically
	var collections = unsortedcollections.sort((a, b) => (a.collectionkey > b.collectionkey) ? 1 : ((b.collectionkey > a.collectionkey) ? -1 : 0))
	//start reply with codeblock markdown and first sorted element
	var replystring = '```' + collections[0].collectionkey
	for (var i = 1; i < collections.length; i++) { //from second element to the end
		//add each collection and a comma
		replystring = replystring + ', ' + collections[i].collectionkey
	} //end for
	replystring = replystring + '```' //close the codeblock

	//send the reply (including button row)
	await interaction.reply({ content: replystring, components: [row], ephemeral: true })
} module.exports.homechannelsetup1 = homechannelsetup1

async function homechannelsetup2(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('homechannelsetup-modal')
		.setTitle('Verify yourself')
		.addComponents([
			new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('collection-input')
					.setLabel('Collection ID')
					.setStyle(TextInputStyle.Short)
					.setMinLength(2)
					.setMaxLength(30)
					.setPlaceholder('enter collection ID')
					.setRequired(true),
			),
		])
	await interaction.showModal(modal)
} module.exports.homechannelsetup2 = homechannelsetup2

async function homechannelsetup3(interaction) {
	const response = interaction.fields.getTextInputValue('collection-input')
	interaction.reply({ content: "Yay, your answer is submitted: " + response, ephemeral: true })
} module.exports.homechannelsetup3 = homechannelsetup3