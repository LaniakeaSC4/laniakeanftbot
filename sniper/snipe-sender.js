const sql = require('../tools/commonSQL.js')//sql related commands are in here
const w = require('../tools/winston.js')
var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

var nonPremiumDelay = 300000

//initialise servers
var supportedservers = []
var initalisecount = 1
async function initaliseServers() {
	supportedservers = []
	supportedservers = await sql.getSupportedServers()
	initalisecount = initalisecount + 1
	if ((initalisecount % 5) == 0) {w.log.info('Servers have been initalised 5 times since last log message') }
}; module.exports.initaliseServers = initaliseServers

//work out where to send them
async function sendFilter(thisname, thiscollection, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize) {

	for (i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].inserver === true) {//only proceed if bot is in server
			var thisserver = supportedservers[i]; var thisserverid = ''; var feedchannel = ''
			//w.log.info('thisserver.premium is: ' + thisserver.premium + ' for server ' + thisserver.serverid)

			//check if this snipe should be sent to a homechannel or alphachannel
			var foundhome = false
			if (thisserver.homechannel_enabled === true && thisserver.premium === true) {
				//w.log.info('homechannel was enabled for ' + thisserver.serverid)
				//check if this snipe needs to go into a home channel
				for (var j = 0; j < thisserver.homechannel_collections.enabled.length; j++) {
					if (thisserver.homechannel_collections.enabled[j] == thiscollection) {
						if (thisserver.homechannel_id) {
							thisserverid = thisserver.serverid
							feedchannel = thisserver.homechannel_id
							foundhome = true
						}
						//w.log.info('matched this snipe to a home collection for server: ' + thisserver.homechannel_id)
						break
					} else {/*w.log.info('No homechannel match for this collection on this server')*/ }
				}//end loop through saved home channels
			}//end if homechannel is enabled and server is premium

			//check if this server has this collection enabled for an alpha channel
			var foundalpha = false; var alphachannelid = ''
			if (thisserver.alpha_channels != null && thisserver.premium === true) {//if there is an alpha channel config and server is premium
				for (var k = 0; k < thisserver.alpha_channels.enabled.length; k++) {//for each enables alpha channel (for this server)
					if (thisserver.alpha_channels.enabled[k].meslug === thiscollection) {//if match this collection
						foundalpha = true
						alphachannelid = thisserver.alpha_channels.enabled[k].channelid//save the alpha channel id for sending
						//w.log.info('Matched an alpha channel for this snipe we should send it to channel: ' + thisserver.alpha_channels.enabled[k].channelid)
						break
					}//end if match this collection
				}//end for enabled alpha channels 
			}//end if this server is premium and has an alpha config

			//if alpha channel is matched, send straight away.
			if (foundalpha === true) {
				sendsnipes(thisserverid, alphachannelid, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
			}//end if alpha

			//if foundhome is true (will only be if server is still premium, homechannel is enabled and this collection was found as a homechannel collection)
			//finding a homechannel will filter a message out of the snipe feed and into the home channel
			if (foundhome === true) {
				sendsnipes(thisserverid, feedchannel, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
			} else {//if valid homechannel was not found enter normal send filter process
			
			thisserverid = thisserver.serverid 
			//check if single feed mode is enabled
			if (thisserver.singlefeedmode === true) {
			  feedchannel = thisserver.raresnipes
			} else {//get the snipes channel id to send the snipe to
				if (raritydescription === 'Rare') { feedchannel = thisserver.raresnipes }
				if (raritydescription === 'Epic') { feedchannel = thisserver.epicsnipes }
				if (raritydescription === 'Legendary') { feedchannel = thisserver.legendarysnipes }
				if (raritydescription === 'Mythic') { feedchannel = thisserver.mythicsnipes }
			} 

				if (feedchannel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
					//send snipes
					if (thisserver.premium === false) {//if this isnt a premium server. Send after wait
						if (raritydescription == 'Rare' || raritydescription == 'Epic') {//as this inst a premium server, send only rare or epic snipes
							//w.log.info(thisserverid + ' is not premium waiting before sending ' + thisname + '...')
							//w.log.info(thisserverid + ' done waiting...' + 'now sending ' + thisname)
							sendsnipes(thisserverid, feedchannel, nonPremiumDelay, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
						} else { /*w.log.info('NFT: ' + thisname + ' was better than rare or epic, not posting to ' + thisserverid)*/ }
					} else {//if this is a premium server, just send it
						sendsnipes(thisserverid, feedchannel, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
					}//end else
				}//end if snipe channel.
			}//end else if homechannel was not enabled - send normally

		}//if bot is active in this server
	}//for each supported server (from SQL)   
}; module.exports.sendFilter = sendFilter

async function sendsnipes(server, thischannel, delay, nftname, embedcolour, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage, listinglink, hotness, collectionSize) {
	//if senddelay isnt null
	if (delay) {
		//w.log.info('server: ' + server + ' is not premium. Waiting to send ' + nftname + ' ' + raritydescription)
		await wait(delay); /*w.log.info('Done waiting. Now sending ' + nftname + ' to ' + server)*/
	} else { /*w.log.info('Sending ' + nftname + ' ' + raritydescription + ' immediately to premium server ' + server)*/ }
	//try sending. Fetch server if not cached
	try {
		//const guild = await client.guilds.fetch(server)
		const channel = await client.channels.fetch(thischannel)
		channel.send({
			embeds: [
				{
					"title": raritydescription + ' Snipe Opportunity: ' + nftname,
					"color": embedcolour,
					"fields": [
						{
							"name": "🎯 __Snipe Details__",
							"value": "**Rarity**: " + thisrarity + "/" + collectionSize + ' - ' + raritydescription + "\n**Hotness**: " + hotness + "\n**List price**: " + pround(parseFloat(thisprice), 3) + ' SOL\n**Floor price**: ' + pround(parseFloat(floorprice), 3) + ' SOL\n[Buy on Magic Eden](' + listinglink + ')\n',
							"inline": false
						},
						{
							"name": "⚡ __Snipe Price Info__",
							"value": 'For ' + raritydescription + ' NFTs, any price less than ' + parseFloat(thislimit) + 'x the floor price of ' + pround(parseFloat(floorprice), 3) + ' SOL is a snipe (i.e. less than ' + pround(parseFloat(thissnipeprice), 3) + ' SOL)',
							"inline": true
						},
						{
							"name": "🐍 __Laniakea Sniper v2.5 (beta) __",
							"value": "Hand crafted by Laniakea#3683.\n\n**📌 You can now vote for collections to be included in Snipe Feed. Cast your vote with `/vote`! **",
							"inline": false
						}
					],
					"thumbnail": {
						"url": thisimage,
						"height": 75,
						"width": 75
					}
				}
			]//end embed
		}).catch((err) => { w.log.error('there was a message send error: ' + err) })//end message send
	} catch (err) { w.log.error('there was an nft sending error. Perhaps channel deleted? Error was: ' + err) }
}//end sendsnipes function
