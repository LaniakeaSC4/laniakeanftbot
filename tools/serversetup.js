const sql = require('./commonSQL.js')//common sql related commands are in here
const main = require('../bot.js')
const { ChannelType, PermissionFlagsBits } = require('discord.js');

async function start(guildid) {

	//check if bot has manage channels and if not return

	//check if this server is in the table

	console.log('setting up guild ' + guildid)
	const guild = main.client.guilds.cache.get(guildid)

	//get saved sniper channels (if any)
	const existingchannels = await sql.getSniperChannels(guildid)
	console.log('log exisiting channels')
	console.log(existingchannels)

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
					console.log('Found the saved category channel')
					channelcheck.snipecategory.serverfound = true
					channelcheck.snipecategory.server_cid = channel.id
					channelcheck.snipecategory.verified = true
				}
				if (channel.id === channelcheck.raresnipes.db_cid) {
					console.log('Found the saved raresnipes channel')
					channelcheck.raresnipes.serverfound = true
					channelcheck.raresnipes.server_cid = channel.id
					channelcheck.raresnipes.verified = true
				}
				if (channel.id === channelcheck.epicsnipes.db_cid) {
					console.log('Found the saved epicsnipes channel')
					channelcheck.epicsnipes.serverfound = true
					channelcheck.epicsnipes.server_cid = channel.id
					channelcheck.epicsnipes.verified = true
				}
				if (channel.id === channelcheck.legendarysnipes.db_cid) {
					console.log('Found the saved legendarysnipes channel')
					channelcheck.legendarysnipes.serverfound = true
					channelcheck.legendarysnipes.server_cid = channel.id
					channelcheck.legendarysnipes.verified = true
				}
				if (channel.id === channelcheck.mythicsnipes.db_cid) {
					console.log('Found the saved mythicsnipes channel')
					channelcheck.mythicsnipes.serverfound = true
					channelcheck.mythicsnipes.server_cid = channel.id
					channelcheck.mythicsnipes.verified = true
				}

			})

			console.log('log final channelcheck')
			console.log(channelcheck)

			//first check and create the category channel
			if (channelcheck.snipecategory.verified === false) {
				console.log('Category channel was not found - creating it')
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
					console.log('created new category channel it\'s ID is:')
					console.log(newchannel.id)
					channelcheck.snipecategory.server_cid = newchannel.id//save category channel ID to we can add children
					await sql.updateTableColumn('servers', 'serverid', guildid, 'snipecategory', newchannel.id)
				}).then(async result => {

					createchildren()

				})
			} else {
				console.log('Category channel already existed')
				createchildren()
			}


			async function createchildren() {
				//get the category channel object so we can add children
				console.log('fetching category channel')
				const laniakeacategory = await main.client.channels.fetch(channelcheck.snipecategory.server_cid)
				for (const key in channelcheck) {
					if (channelcheck[key] != 'snipecategory') {//we have created the category already
						if (channelcheck[key].verified === false) {//if this one isnt verified as present

							guild.channels.create({
								name: channelcheck[key].name,
								type: ChannelType.GuildText,
								parent: laniakeacategory
							}).then(async newchannel => {
								console.log('created new channel ' + newchannel.name + ' it\'s ID is: ' + newchannel.id)
								channelcheck.snipecategory.server_cid = newchannel.id//save category channel ID to we can add children
								await sql.updateTableColumn('servers', 'serverid', guildid, channelcheck[key].servercolumn, newchannel.id)
							})

						}
					}
				}
			}
		})

	/*
	
	*/


} module.exports.start = start
