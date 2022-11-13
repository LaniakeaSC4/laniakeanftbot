var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')
const snipersender = require('../sniper/snipe-sender.js')
const w = require('../tools/winston.js')
const sql = require('../tools/commonSQL.js')//common sql related commands are in here

const successrow = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
    .setCustomId('feedNextBtn')
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary),
  )
var successReply = {
		embeds: [
			{
				"title": "🔥 __Feed Setup 1__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Setup complete. Your Snipe Feed channel will now start receiving snipes! Default permissions are deny @\'everyone, please now configure access to the Snipe Feed channels for your users. Please also confirm the bot has send permissions on the Snipe Feed channels.",
				"footer": {
					"text": "Setup 1/5. To move on to next setup step press [Next]"
				},
			}
		],//end embed
		components: [successrow], ephemeral: true,
	} 

//Main feed setup dialogue. Does the user want single channel mode? 
async function whichMode(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('standardfeed-button')
				.setLabel('Multi Feed')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
			new ButtonBuilder()
				.setCustomId('singlefeed-button')
				.setLabel('Single Feed')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
		  new ButtonBuilder()
		  .setCustomId('feedNextBtn')
		  .setLabel('Next')
		  .setStyle(ButtonStyle.Secondary),
		)
	//send the reply (including button row)
	await interaction.reply({
		embeds: [
			{
				"title": "🔥 __Feed Setup 1__ ",
				"color": parseInt('0x9901f6', 16),
				"description": "Snipe Feed gives your users a scrolling feed of amazing NFT deals. Choose between **[Single Feed]** (all snipes in one channel) mode or **[Multi Feed]** mode which splits Snipes into separate Rare, Epic, Legendary and Mythic discord channels so your users know the best channel to watch. Show the hottest deals to your biggest holders!\n\nPress one of the setup buttons below to create a new channel category and new channels to recieve a feed of snipes for **all** supported collections. \n\nLegendary and Mythic snipes for premium servers only. If channels already exist (by ID) it won\'t be recreated. Default permissions on these channels will be; deny @\'everyone and allow @\'laniakea Bot. You are free to rename the channels and add member permissions (remember to give the bot send permissions!)",
				"fields": [
					{
						"name": "Current Mode",
						"value": "Write this code",
						"inline": false
					},
				],
				"footer": {
					"text": "Setup 1/5. To move on to next setup step press [Next]"
				},
			}
		],//end embed
		components: [row], ephemeral: true,
	})
} module.exports.whichMode = whichMode

async function start(interaction, feedmode) {
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
		const guild = await client.guilds.fetch(guildid)

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
		var channels = await guild.channels.fetch()
				channels.forEach(async channel => {
					if (channel) {
						//check for the channels in server. If channel wasnt found db_cid would be null. Incorrect or null means serverfound wont get updated to true.
						//verified gets set true if both server and SQL are found and matched. If not, we will recreate
						if (channel.id === channelcheck.snipecategory.db_cid) {
							w.log.info('Found the saved category channel')
							channelcheck.snipecategory.serverfound = true
							channelcheck.snipecategory.server_cid = channel.id
							channelcheck.snipecategory.verified = true
						}//end if category
						if (channel.id === channelcheck.raresnipes.db_cid) {
							w.log.info('Found the saved raresnipes channel')
							channelcheck.raresnipes.serverfound = true
							channelcheck.raresnipes.server_cid = channel.id
							channelcheck.raresnipes.verified = true
						}//end if rare
						if (channel.id === channelcheck.epicsnipes.db_cid) {
							w.log.info('Found the saved epicsnipes channel')
							channelcheck.epicsnipes.serverfound = true
							channelcheck.epicsnipes.server_cid = channel.id
							channelcheck.epicsnipes.verified = true
						}//end if epic
						if (channel.id === channelcheck.legendarysnipes.db_cid) {
							w.log.info('Found the saved legendarysnipes channel')
							channelcheck.legendarysnipes.serverfound = true
							channelcheck.legendarysnipes.server_cid = channel.id
							channelcheck.legendarysnipes.verified = true
						}//end if legendary
						if (channel.id === channelcheck.mythicsnipes.db_cid) {
							w.log.info('Found the saved mythicsnipes channel')
							channelcheck.mythicsnipes.serverfound = true
							channelcheck.mythicsnipes.server_cid = channel.id
							channelcheck.mythicsnipes.verified = true
						}//end if mythic
					}//end if a channel is recieved (not null) from discord. Can be null if bot has no access to any channels
				})//end channels for each

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
					})//creare
						w.log.info('created new category channel it\'s ID is:')
						w.log.info(newchannel.id)
						channelcheck.snipecategory.server_cid = newchannel.id//save category channel ID to we can add children
						await sql.updateTableColumn('servers', 'serverid', guildid, 'snipecategory', newchannel.id)
					
						await createchildren(guildid)
						
						    snipersender.initaliseServers()//rebuild the snipe sender object so it has the new channel
     await interaction.reply(successReply)
					
				} else {
					w.log.info('Category channel already existed')
					await createchildren(guildid)
					      w.log.info('setup status was sucessful')
      //await wait(5000)//give time for channels to be created
      snipersender.initaliseServers()//rebuild the snipe sender object so it has the new channel
     await interaction.reply(successReply)

				}//end else

				async function createchildren(guildid) {
					//get the category channel object so we can add children
					w.log.info('fetching category channel')
					const laniakeacategory = await client.channels.fetch(channelcheck.snipecategory.server_cid)

					if (feedmode === 'multichannel') {
						sql.updateTableColumn('servers', 'serverid', guildid, 'singlefeedmode', false)
						for (const key in channelcheck) {
							if (key != 'snipecategory') {//we have created the category already
								if (channelcheck[key].verified === false) {//if this one isnt verified as present
									//only create premium channels if premium server
									if (thisserver.premium === true || channelcheck[key].premium === false) {
										var newchannel = await guild.channels.create({
											name: channelcheck[key].name,
											type: ChannelType.GuildText,
											parent: laniakeacategory
										})
											w.log.info('created new channel ' + newchannel.name + ' it\'s ID is: ' + newchannel.id)
											await sql.updateTableColumn('servers', 'serverid', guildid, channelcheck[key].servercolumn, newchannel.id)
											return newchannel.id
									}//end if premium
								}//end if verified was false
							}//end if key isnt snipecategory
						}//end for each key in channelcheck
					} else {//else, if feedmode wasn't multichannel
						sql.updateTableColumn('servers', 'serverid', guildid, 'singlefeedmode', true)
						//if there wasn't already a raresnipes channel
						if (channelcheck.raresnipes.verified === false) {
							var newchannel = await guild.channels.create({
								name: "Snipe-Feed",
								type: ChannelType.GuildText,
								parent: laniakeacategory
							})
								w.log.info('created new channel ' + newchannel.name + ' it\'s ID is: ' + newchannel.id)
								//save channel id in raresnipes column. That's where single mode snipes are always sent.
								await sql.updateTableColumn('servers', 'serverid', guildid, channelcheck.raresnipes.servercolumn, newchannel.id)
								return newchannel.id 
						}//end if raresnipes verified === false
					}//end else feedmode wasn't multichannel
				}//end createchildren

	} else { return null }//end if valid server
} module.exports.start = start
