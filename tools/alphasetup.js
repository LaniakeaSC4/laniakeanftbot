var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const { ChannelType, PermissionFlagsBits, PermissionsBitField,
	ModalBuilder, ActionRowBuilder, TextInputBuilder,
	TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js')

const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

//Main setup
async function replyMainSetup(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('modifyAlpha-button')
				.setLabel('Modify Alpha Channel Settings')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
			new ButtonBuilder()
				.setCustomId('doneAlpha-button')
				.setLabel('Done')
				.setStyle(ButtonStyle.Secondary),
		)
	//get current alpha channels from sql here and display then
	var replytext = 'Need to query SQL'
	var alphachannels = await sql.getData("servers", "serverid", interaction.message.guildId, "alpha_channels")
	//if there was an existing config
	if (alphachannels) {

	} else {//if no existing config

	}
	//send the reply (including button row)
	await interaction.reply({ content: "Your current alpha channels are:\n```[" + replytext + "]```", components: [row], ephemeral: true })
} module.exports.replyMainSetup = replyMainSetup

//Main setup
async function replyModifyAlpha(interaction) {
	//build a new button row for the command reply
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('addAlpha-button')
				.setLabel('Add an Alpha Channel')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
			new ButtonBuilder()
				.setCustomId('removeAlpha-button')
				.setLabel('Remove an Alpha Channel')
				.setStyle(ButtonStyle.Primary),
		).addComponents(
			new ButtonBuilder()
				.setCustomId('doneModifyAlpha-button')
				.setLabel('Done')
				.setStyle(ButtonStyle.Secondary),
		)
	//send the reply (including button row)
	await interaction.reply({ content: "What would you like to do?", components: [row], ephemeral: true })
} module.exports.replyModifyAlpha = replyModifyAlpha

//when "Add Alpha Channel" is pressed, show a modal to capture the ME address
async function sendAddModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('addAlpha-modal')
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
} module.exports.sendAddModal = sendAddModal

//when "Remove Alpha Channel" is pressed, show a modal to capture the ME address
async function sendRemoveModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('removeAlpha-modal')
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
} module.exports.sendRemoveModal = sendRemoveModal

//function to process the input from sendAddModal. Do we support this collection? 
async function validateCollection(interaction) {
	const response = interaction.fields.getTextInputValue('collection-input')//get modal input text
	var meslug = response.substring(response.lastIndexOf('magiceden.io/marketplace/') + 25).replace(/[^0-9a-z]/gi, '')//find the end slug and clean it (same process as cleaning to colleciton key in SQL)

	//get collections and populate global var
	supportedcollections = {}//clear and repopulate in case collections have changed since last time command was run
	supportedcollections = await sql.getOurMetaplexCollections()//set from sql

	w.log.info('validating collection')
	//check if it was a supported collection
	var found = false//start as false
	for (var i = 0; i < supportedcollections.length; i++) {//loop supported collections recieved from SQL
		if (supportedcollections[i].collectionkey === meslug) {//if collection entered by user is found in our supported collections
			w.log.info('validated collection. Caling createAlpha')
			createAlpha(interaction, meslug)
		}//end if
	}//end for
	if (found === false) { return null }//if this collection wasn't supported

} module.exports.validateCollection = validateCollection

//if collection was validated, save in sql and make a new channel ready to recieve snipes
async function createAlpha(interaction, collectionkey) {
	//get any existing config
	var serverdetails = await sql.getServerRow(interaction.message.guildId)
	
	//if there was an existing config in SQL send it to the setupchannel function to be modified
	if (serverdetails[0].alpha_channels != null) {
		w.log.info('there was exisiting alpha channels. Calling setupchannel')
			//check alpha channel config to see if it is active already (and the channel is still present etc)
			const guild = client.guilds.cache.get(interaction.message.guildId)
			var foundalpha = false
			await guild.channels.fetch()
			.then(async channels => {
				channels.forEach(async channel => {
			for (var i = 0; i < serverdetails[0].alpha_channels.enabled.length; i++) {
				if (serverdetails[0].alpha_channels.enabled[i]['channelid'] === channel.id && serverdetails[0].alpha_channels.enabled[i]['meslug'] === collectionkey) {
					foundalpha = true
					break
				}//end if we have found a setup matching the current collectionkey
			}//end for each alpha channel config object

				}) 
			})
			
			if (foundalpha === false) {
		await setupchannel(interaction, collectionkey, serverdetails[0].alpha_channels).then(async newchannelid => {
			interaction.reply({ content: "New channel <#" + newchannelid + "> created" })
		})//end then
			} else {//if there were alpha channels and this one was found.
			  interaction.reply({ content: "This alpha channel is already active in your server"})
			}
			
	} else {//if no existing config
		w.log.info('there was NOT exisiting alpha channels. Calling setupchannel')
		await setupchannel(interaction, collectionkey, null).then(async newchannelid => {
			interaction.reply({ content: "New channel <#" + newchannelid + "> created" })
		})//end then
	}//end else
}//end function createAlpha

async function setupchannel(interaction, collectionkey, alphaconfig) {
	//check if this server is in the table and currently premium 
	const guildid = interaction.message.guildId
	supportedservers = await sql.getSupportedServers()
	var validserver = false
	for (var i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].serverid === guildid) {
			if (supportedservers[i].premium === true) {//alpha channel is always premium
				validserver = true
				w.log.info('matched premium server in our database during alpha setup: ' + guildid)
				break
			}//end if premium
		}//end if
	}//end for

	if (validserver === true) {
		w.log.info('setting up alpha channel for guild ' + guildid)
		const guild = client.guilds.cache.get(guildid)

		//set up object to run through checks for exisiting channels
		const existingchannels = await sql.getServerRow(guildid)//need to add the alpha channel to the sql function
		var channelcheck = {
			"snipecategory": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "LANIAKEA SNIPER BOT", "servercolumn": "snipecategory" },
			"alphachannel": { "dbfound": false, "serverfound": false, "db_cid": '', "server_cid": '', "verified": false, "name": "Alpha Channel " + collectionkey }
		}

		//if any of the channels are found in SQL, update channelcheck to say we have found them
		if (existingchannels[0].snipecategory) { channelcheck.snipecategory.dbfound = true; channelcheck.snipecategory.db_cid = existingchannels[0].snipecategory }

		//need to loop through the alpha channel config. Could be multiple alpha channels setup
		if (existingchannels[0].alpha_channels) {
			for (var i = 0; i < existingchannels[0].alpha_channels.enabled.length; i++) {
				if (existingchannels[0].alpha_channels.enabled[i]['meslug'] === collectionkey) {
					channelcheck.alphachannel.dbfound = true; channelcheck.alphachannel.db_cid = existingchannels[0].alpha_channels.enabled[i]['channelid']
				}//end if we have found a setup matching the current collectionkey
			}//end for each alpha channel config object
		}//end if an exisiting config was passed to the function

		//get the guild channels to see if our saved ones still exist (not deleted)
		await guild.channels.fetch()
			.then(async channels => {
				channels.forEach(async channel => {
					//check for the channels in server
					if (channel.id === channelcheck.snipecategory.db_cid) {
						w.log.info('Found the saved category channel in server')
						channelcheck.snipecategory.serverfound = true
						channelcheck.snipecategory.server_cid = channel.id
						channelcheck.snipecategory.verified = true
					}
					if (channel.id === channelcheck.alphachannel.db_cid) {
						w.log.info('Found the saved alphachannel channel in server')
						channelcheck.alphachannel.serverfound = true
						channelcheck.alphachannel.server_cid = channel.id
						channelcheck.alphachannel.verified = true
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
									parent: laniakeacategory,
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
									w.log.info('created new channel ' + newchannel.name + ' it\'s ID is: ' + newchannel.id)

									if (alphaconfig) {//if existing config, add to it
										w.log.info('old config was: ' + JSON.stringify(alphaconfig))
										alphaconfig.enabled.push({ "meslug": collectionkey, "channelid": newchannel.id })
										w.log.info('updated config is: ' + JSON.stringify(alphaconfig))
										await sql.updateTableColumn('servers', 'serverid', guildid, "alpha_channels", alphaconfig)
										return newchannel.id
									} else {//if no existing config, create and store it
										w.log.info('no exisiting config, adding a new one')
										var newconfig = { "enabled": [{ "meslug": collectionkey, "channelid": newchannel.id }] }
										await sql.updateTableColumn('servers', 'serverid', guildid, "alpha_channels", newconfig)
										return newchannel.id
									}//end else
								})//end .then newchannel
							}//end if not verified as present
						}//end if not sniper category
					}//end for key in channelcheck
				}//end createchildren function
			})//end then for fetched channels
	} else { return null }//end if valid server
}//end function setupchannel




async function done(interaction) {
	if (homecollections.enabled.length != 0) {

		//create home channel if not already existing
		setupchannel(interaction)

		//save validated supported collections gathered from user
		await sql.updateTableColumn('servers', 'serverid', interaction.message.guildId, 'homechannel_collections', homecollections)
		//enable homechannel mode
		await sql.updateTableColumn('servers', 'serverid', interaction.message.guildId, 'homechannel_enabled', true)
		//reply success message
		await interaction.reply({ content: "Changes saved. All snipes for the collections you added will now redirect to your Home Channel", ephemeral: true })

	} else {
		await interaction.reply({ content: "As you did not identify any collections, no changes have been made to your Home Channel setup.", ephemeral: true })
	}
} module.exports.done = done
