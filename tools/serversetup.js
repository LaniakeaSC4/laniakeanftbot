const sql = require('./commonSQL.js')//common sql related commands are in here
const main = require('../bot.js')
const { ChannelType, PermissionFlagsBits } = require('discord.js');

async function start(guildid) {
	console.log('setting up guild ' + guildid)
	const guild = main.client.guilds.cache.get(guildid)

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


} module.exports.start = start
