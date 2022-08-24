const sql = require('./commonSQL.js')//common sql related commands are in here
const main = require('../bot.js')
const { ChannelType, PermissionFlagsBits } = require('discord.js');

async function start(guildid) {
	console.log('setting up guild ' + guildid)
	const guild = main.client.guilds.cache.get(guildid)

	//get saved sniper channels (if any)
	const existingchannels = await sql.getSniperChannels(guildid)
	console.log('log exisiting channels')
	console.log(existingchannels)

	var channelcheck = { 
		"snipecategory" : { "dbfound" : false, "serverfound" : false, "db_cid" : '', "server_cid" : ''},
		"raresnipes" : { "dbfound" : false, "serverfound" : false, "db_cid" : '', "server_cid" : ''},
		"epicsnipes" : { "dbfound" : false, "serverfound" : false, "db_cid" : '', "server_cid" : ''},
		"legenradysnipes" : { "dbfound" : false, "serverfound" : false, "db_cid" : '', "server_cid" : ''},
		"mythicsnipes" : { "dbfound" : false, "serverfound" : false, "db_cid" : '', "server_cid" : ''}
	}

	if (existingchannels[0].snipecategory) {channelcheck.snipecategory.dbfound = true; channelcheck.snipecategory.db_cid = existingchannels[0].snipecategory}
	if (existingchannels[0].raresnipes) {channelcheck.raresnipes.dbfound = true; channelcheck.raresnipes.db_cid = existingchannels[0].raresnipes}
	if (existingchannels[0].epicsnipes) {channelcheck.epicsnipes.dbfound = true; channelcheck.epicsnipes.db_cid = existingchannels[0].epicsnipes}
	if (existingchannels[0].legenradysnipes) {channelcheck.legenradysnipes.dbfound = true; channelcheck.legenradysnipes.db_cid = existingchannels[0].legenradysnipes}
	if (existingchannels[0].mythicsnipes) {channelcheck.mythicsnipes.dbfound = true; channelcheck.mythicsnipes.db_cid = existingchannels[0].mythicsnipes}

	//get the guild channels to see if our saved ones still exist
	await guild.channels.fetch()
	.then(channels => {
		channels.forEach(channel =>{

		//check for the channels in server
		if (channel.id === channelcheck.snipecategory.db_cid) {
			console.log('Found the saved category channel')
			channelcheck.snipecategory.serverfound = true
			channelcheck.snipecategory.server_cid = channel.id
		}
		if (channel.id === channelcheck.raresnipes.db_cid) {
			console.log('Found the saved raresnipes channel')
			channelcheck.raresnipes.serverfound = true
			channelcheck.raresnipes.server_cid = channel.id
		}
		if (channel.id === channelcheck.epicsnipes.db_cid) {
			console.log('Found the saved epicsnipes channel')
			channelcheck.epicsnipes.serverfound = true
			channelcheck.epicsnipes.server_cid = channel.id
		}
		if (channel.id === channelcheck.legenradysnipes.db_cid) {
			console.log('Found the saved legenradysnipes channel')
			channelcheck.legenradysnipes.serverfound = true
			channelcheck.legenradysnipes.server_cid = channel.id
		}
		if (channel.id === channelcheck.mythicsnipes.db_cid) {
			console.log('Found the saved mythicsnipes channel')
			channelcheck.mythicsnipes.serverfound = true
			channelcheck.mythicsnipes.server_cid = channel.id
		}

		})

		console.log('log final channelcheck')
		console.log(channelcheck)

	})

	/*
	guild.channels.create({
		name: 'LANIAKEA SNIPER BOT',
		type: ChannelType.GuildCategory,
		permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: [PermissionFlagsBits.ViewChannel],
			},
		]
	})
	*/


} module.exports.start = start
