const sql = require('../tools/commonSQL.js')//sql related commands are in here
const w = require('../tools/winston.js')
var discord = require('../clients/discordclient.js')
const client = discord.getClient()
const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

var nonPremiumDelay = 300000

//initialise servers
var supportedservers = []
async function initaliseServers() {
	w.log.info('Initialising servers')
	supportedservers = []
	supportedservers = await sql.getSupportedServers()
}; module.exports.initaliseServers = initaliseServers

//work out where to send them
async function sendFilter(thisname, thiscollection, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize) {

	for (i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].inserver === true) {//only proceed if bot is in server
			var thisserver = supportedservers[i]
			var thisserverid = ''
			var channel = ''
			//w.log.info('thisserver.premium is: ' + thisserver.premium + ' for server ' + thisserver.serverid)

			//check if this snipe should be sent to a homechannel
			var foundhome = false
			if (thisserver.homechannel_enabled === true && thisserver.premium === true) {
				//w.log.info('homechannel was enabled for ' + thisserver.serverid)
				//check if this snipe needs to go into a home channel
				for (var j = 0; j < thisserver.homechannel_collections.enabled.length; j++) {
					if (thisserver.homechannel_collections.enabled[j] == thiscollection) {
						if (thisserver.homechannel_id) {
							thisserverid = thisserver.serverid
							channel = thisserver.homechannel_id
							foundhome = true
						}
						//w.log.info('matched this snipe to a home collection for server: ' + thisserver.homechannel_id)
						break
					} else {/*w.log.info('No homechannel match for this collection on this server')*/ }
				}//end loop through saved home channels
			}

			//if foundhome is true (will only be if server is still premium, homechannel is enabled and this collection was found as a homechannel collection)
			if (foundhome === true) {
				/*//w.log.info('Foundhome was true sending snipe to homechannel')
				if (channel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
					if (thisserver.premium === false) {//if this isnt a premium server. Send after wait
						if (raritydescription == 'Rare' || raritydescription == 'Epic') {//as this inst a premium server, send only rare or epic snipes
							//w.log.info(thisserverid + ' is not premium waiting before sending ' + thisname + '...')
							//w.log.info(thisserverid + ' done waiting...' + 'now sending ' + thisname)
							sendsnipes(thisserverid, channel, nonPremiumDelay, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
						/*} else { w.log.info('hit the else 1 for ' + thisname) }//this shouldnt trigger as we have covered all the snipe scenarios
					} else {//if this is a premium server, just send it*/
				sendsnipes(thisserverid, channel, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
					/*}//end else
						*/}/*//end if snipe there is a valid snipe channel
				} else {//if homechannel enabled, but not for this collection, send it through the normal process
					//get the snipes channel id to send the snipe to
					thisserverid = thisserver.serverid
					if (raritydescription === 'Rare') { channel = thisserver.raresnipes }
					if (raritydescription === 'Epic') { channel = thisserver.epicsnipes }
					if (raritydescription === 'Legendary') { channel = thisserver.legendarysnipes }
					if (raritydescription === 'Mythic') { channel = thisserver.mythicsnipes }

					if (channel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
						//send snipes
						if (thisserver.premium === false) {//if this isnt a premium server. Send after wait
							if (raritydescription == 'Rare' || raritydescription == 'Epic') {//as this inst a premium server, send only rare or epic snipes
								//w.log.info(thisserverid + ' is not premium waiting before sending ' + thisname + '...')
								//w.log.info(thisserverid + ' done waiting...' + 'now sending ' + thisname)
								sendsnipes(thisserverid, channel, nonPremiumDelay, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
							} else { w.log.info('hit the else 2 for' + thisname) }//this shouldnt trigger as we have covered all the snipe scenarios
						} else {//if this is a premium server, just send it
							sendsnipes(thisserverid, channel, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
						}//end else
					}//end if snipe there is a valid snipe channel
				}//end else - a home channel was found, but not for this collection*/

			else {//if valid homechannel was not found enter normal send filter process
				//get the snipes channel id to send the snipe to
				thisserverid = thisserver.serverid
				if (raritydescription === 'Rare') { channel = thisserver.raresnipes }
				if (raritydescription === 'Epic') { channel = thisserver.epicsnipes }
				if (raritydescription === 'Legendary') { channel = thisserver.legendarysnipes }
				if (raritydescription === 'Mythic') { channel = thisserver.mythicsnipes }

				if (channel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
					//send snipes
					if (thisserver.premium === false) {//if this isnt a premium server. Send after wait
						if (raritydescription == 'Rare' || raritydescription == 'Epic') {//as this inst a premium server, send only rare or epic snipes
							//w.log.info(thisserverid + ' is not premium waiting before sending ' + thisname + '...')
							//w.log.info(thisserverid + ' done waiting...' + 'now sending ' + thisname)
							sendsnipes(thisserverid, channel, nonPremiumDelay, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
						} else { w.log.info('NFT: ' + thisname + ' was better than rare or epic, not posting to ' + thisserverid) }
					} else {//if this is a premium server, just send it
						sendsnipes(thisserverid, channel, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize)
					}//end else
				}//end if snipe channel.
			}//end else if homechannel was not enabled - send normally

		}//if bot is active in this server
	}//for each supported server (from SQL)   
}; module.exports.sendFilter = sendFilter

async function sendsnipes(server, channel, delay, nftname, embedcolour, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage, listinglink, hotness, collectionSize) {
	//if senddelay isnt null
	if (delay) {
		w.log.info('server: ' + server + ' is not premium. Waiting to send ' + nftname + ' ' + raritydescription)
		await wait(delay); w.log.info('Done waiting. Now sending ' + nftname + ' to ' + server)
	} else { w.log.info('Sending ' + nftname + ' ' + raritydescription + ' immediately to premium server ' + server) }
	//try sending
	try {
		client.guilds.cache.get(server).channels.cache.get(channel).send({
			embeds: [
				{
					"title": hotness + ' Snipe Opportunity__\n' + nftname,
					"color": embedcolour,
					"fields": [
						{
							"name": "🎯 __Snipe Details__",
							"value": "**Rarity**: " + thisrarity + "/" + collectionSize + ' - ' + raritydescription + "\n**List price**: " + pround(parseFloat(thisprice), 3) + ' SOL\n**Floor price**: ' + pround(parseFloat(floorprice), 3) + ' SOL\n[Buy on Magic Eden](' + listinglink + ')\n',
							"inline": false
						},
						{
							"name": "⚡ __Snipe Price Info__",
							"value": 'For ' + raritydescription + ' NFTs, any price less than ' + parseFloat(thislimit) + 'x the floor price of ' + pround(parseFloat(floorprice), 3) + ' SOL is a snipe (i.e. less than ' + pround(parseFloat(thissnipeprice), 3) + ' SOL)',
							"inline": true
						},
						{
							"name": "🐍 __Laniakea Sniper v2.3 (beta) __",
							"value": "Hand crafted by Laniakea#3683. If your seeing this, your server is part of our beta test. Any and all feedback welcome by DM to Laniakea#3683",
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
