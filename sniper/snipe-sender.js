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
	if ((initalisecount % 5) == 0) { w.log.info('Servers have been initalised 5 times since last log message') }
}; module.exports.initaliseServers = initaliseServers

//work out where to send them
async function sendFilter(thisname, thiscollection, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize, floor_history, snipe_ping, seller, floordrop) {
	for (i = 0; i < supportedservers.length; i++) {
		if (supportedservers[i].inserver === true) {//only proceed if bot is in server
			var thisserver = supportedservers[i]; var thisserverid = ''; var feedchannel = ''

			//Skip this loop altogether if this server has a rarity disabled
			if (raritydescription === "Rare" && supportedservers[i].rare_enabled === false) { continue }
			if (raritydescription === "Epic" && supportedservers[i].epic_enabled === false) { continue }
			if (raritydescription === "Legendary" && supportedservers[i].legendary_enabled === false) { continue }
			if (raritydescription === "Mythic" && supportedservers[i].mythic_enabled === false) { continue }

			//filter out snipes below global minimum list price (e.g. less than 2 sol)
			if (parseFloat(thisprice) < parseFloat(supportedservers[i].min_price) || parseFloat(thisprice) >= parseFloat(supportedservers[i].max_price)) { continue }

			//snipe ping may have come through as true, but let's see if this server has it enabled
			var thisping = false
			var thispingrole = ''
			if (supportedservers[i].enable_ping === true && snipe_ping === true) {
				if (supportedservers[i].pingrole) {
					thisping = true
					thispingrole = supportedservers[i].pingrole
				}
			}

			//check if this snipe should be redirected to a homechannel from the main feed
			var foundhome = false//start with false
			if (thisserver.homechannel_enabled === true && thisserver.premium === true) {
				//w.log.info('homechannel was enabled for ' + thisserver.serverid)
				//check if this snipe needs to go into a home channel
				for (var j = 0; j < thisserver.homechannel_collections.enabled.length; j++) {//for enabled homechannel collections (could be 0)
					if (thisserver.homechannel_collections.enabled[j] == thiscollection) {//if we match on meslug
						if (thisserver.homechannel_id) {//if there is a homechannel ID (perhaps there are defined home collections, but channel has been deleted)
							thisserverid = thisserver.serverid//this is the server where we are going to send it
							feedchannel = thisserver.homechannel_id//this is (home)channel we should send it to
							foundhome = true//set true, we found a homechannel
						}//end if there is a homechannel id
						break//no need to loop further
					} else {/*w.log.info('No homechannel match for this collection on this server')*/ }
				}//end loop through saved home channels
			}//end if homechannel is enabled and server is premium

			//check if this server has this collection enabled for an alpha channel send a duplicate there
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
				sendsnipes(thisserverid, alphachannelid, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize, thiscollection, floor_history, thisping, thispingrole, seller, floordrop)
			}//end if alpha
			
			
			var foundalpha2 = false
		//send to new alpha channels
			if (thisserver.alphaconfig.channels.length != 0 && thisserver.premium === true) {//if there is an alpha channel config and server is premium
		
				for (var k = 0; k < thisserver.alphaconfig.channels.length; k++) {//for each alpha channel (for this server)
				for (var m = 0;m < thisserver.alphaconfig.channels[k].collections.length;m++) {
				  w.log.info('meslug is: ' + thisserver.alphaconfig.channels[k].collections[m] + '. Thiscollection is: ' + thiscollection)
				  if (thisserver.alphaconfig.channels[k].collections[m] === thiscollection) {//if match this collection
						
						alphachannelid = thisserver.alphaconfig.channels[k].channelID
						foundalpha2 = true
						sendsnipes(thisserverid, alphachannelid, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize, thiscollection, floor_history, thisping, thispingrole, seller, floordrop)
						
						
						
						break//no need to go through the rest of this alpha channels collections
					}//end if match this collection
				  
				}
					
				}//end for enabled alpha channels 
			}//end if this server is premium and has an alpha config

			
			
			
			if (foundalpha2 === true) {return} 
			
			
			
			
			

			//if foundhome is true (will only be if server is still premium, homechannel is enabled and this collection was found as a homechannel collection)
			//finding a homechannel will filter a message out of the snipe feed and into the home channel
			if (foundhome === true) {
				sendsnipes(thisserverid, feedchannel, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize, thiscollection, floor_history, thisping, thispingrole, seller, floordrop)
			} else {//if valid homechannel was not found enter normal send filter process

				thisserverid = thisserver.serverid
				//check if single feed mode is enabled
				if (thisserver.singlefeedmode === true) {//if it is, use the raresnipes channel
					feedchannel = thisserver.raresnipes
				} else {//get the snipes channel id to send the snipe to
					if (raritydescription === 'Rare') { feedchannel = thisserver.raresnipes }
					if (raritydescription === 'Epic') { feedchannel = thisserver.epicsnipes }
					if (raritydescription === 'Legendary') { feedchannel = thisserver.legendarysnipes }
					if (raritydescription === 'Mythic') { feedchannel = thisserver.mythicsnipes }
				}//end else not single feed mode

				if (feedchannel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
					//send snipes
					if (thisserver.premium === false) {//if this isnt a premium server. Send after wait
						if (raritydescription == 'Rare' || raritydescription == 'Epic') {//as this inst a premium server, send only rare or epic snipes
							//w.log.info(thisserverid + ' is not premium waiting before sending ' + thisname + '...')
							//w.log.info(thisserverid + ' done waiting...' + 'now sending ' + thisname)
							sendsnipes(thisserverid, feedchannel, nonPremiumDelay, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize, thiscollection, floor_history, thisping, thispingrole, seller, floordrop)
						} else { /*w.log.info('NFT: ' + thisname + ' was better than rare or epic, not posting to ' + thisserverid)*/ }
					} else {//if this is a premium server, just send it
						sendsnipes(thisserverid, feedchannel, null, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness, collectionSize, thiscollection, floor_history, thisping, thispingrole, seller, floordrop)
					}//end else
				}//end if snipe channel.
			}//end else if homechannel was not enabled - send normally

		}//if bot is active in this server
	}//for each supported server (from SQL)   
}; module.exports.sendFilter = sendFilter

async function sendsnipes(server, thischannel, delay, nftname, embedcolour, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage, listinglink, hotness, collectionSize, thiscollection, floor_history, thisping, thispingrole, seller, floordrop) {

	if (delay) { await wait(delay) }//delay delivery if one was set

	//if there is no floor history at all, handle all the missing pieces
	if (!floor_history) {
		floor_history = {}
		floor_history.fp_3daverage = 'Not enough data'
		//floor_history.fp_3dchange = 'coming soon'
		//floor_history.fp_7dchange = 'coming soon'
		floor_history.fp_7daverage = 'Not enough data'
		//floor_history.collection_12h_strength = 'coming soon'

		//new
		floor_history['strength'] = {}
		floor_history.strength['strength_ready'] = false

		floor_history['threeDayChange'] = {}
		floor_history.threeDayChange['symbol_3dchange'] = ""

		floor_history['sevenDayChange'] = {}
		floor_history.sevenDayChange['symbol_7dchange'] = ""

		floor_history['fp_history'] = ['none']

	}

	//build collection strength string
	var strengthstring = ""
	if (floor_history.strength.strength_ready === false) {//if strength calc is note ready fill in those blanks
		strengthstring = "📊 As this is a new collection, there is not enough data to assess collection strength. "
	} else {
		strengthstring = "\n**FP vs SOL**: " + floor_history.strength.description + ". FP " + floor_history.strength.fp_symbol + floor_history.strength.fp_percent + " vs SOL/USD " + floor_history.strength.sol_symbol + floor_history.strength.sol_percent
	}

	//build 3d change string
	var threeDayChangeString = ""
	if (floor_history.threeDayChange.symbol_3dchange === "") {//if no 3d change has yet been calculated (not enough history)
		threeDayChangeString = "As this is a new collection we don\'t yet have a 3 day average to compare to"
	} else {
		var fp3dchangedirection = ""; if (floor_history.threeDayChange.symbol_3dchange === "-") { fp3dchangedirection = "dropped" } else { fp3dchangedirection = "increased" }
		threeDayChangeString = "**3 Day MA**: " + fp3dchangedirection + " " + floor_history.threeDayChange.symbol_3dchange + floor_history.threeDayChange.amount_3dchange + " SOL (" + floor_history.threeDayChange.symbol_3dchange + floor_history.threeDayChange.percentage_3dchange + "%)"
	}

	//build 7d change string
	var sevenDayChangeString = ""
	if (floor_history.sevenDayChange.symbol_7dchange === "") {//if no 7d change has yet been calculated (not enough history)
		sevenDayChangeString = "."
	} else {
		var fp7dchangedirection = ""; if (floor_history.sevenDayChange.symbol_7dchange === "-") { fp7dchangedirection = "dropped" } else { fp7dchangedirection = "increased" }
		sevenDayChangeString = "\n**7 Day MA**: " + fp7dchangedirection + " " + floor_history.sevenDayChange.symbol_7dchange + floor_history.sevenDayChange.amount_7dchange + " SOL (" + floor_history.sevenDayChange.symbol_7dchange + floor_history.sevenDayChange.percentage_7dchange + "%)"
	}

	//build snapshot FP
	var snapshotFPstring = ""
	if (floor_history.fp_history[0] === "none") {
		snapshotFPstring = "New collection. Not enough data"
	} else {
		snapshotFPstring = pround(floor_history.fp_history[0], 2) + " SOL"
	}


	var alertrole = ''
	if (thisping === true) { alertrole = '<@&' + thispingrole + '>' }

	var sellerLink = '**Seller**: [' + seller.slice(0, 3) + '...' + seller.slice(-2) + '](https://magiceden.io/u/' + seller + ')'
	
	var paperhands = ''
	if (floordrop > 0.01) {
	  paperhands = ' (🧻👐 FP -' + pround(floordrop, 2) + ' SOL)'
	}

	//send it
	try {
		const channel = await client.channels.fetch(thischannel)
		channel.send({
			content: alertrole,
			allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
			embeds: [
				{
					"title": nftname,
					"color": embedcolour,
					"fields": [
						{
							"name": "🎯 __Snipe Details__",
							"value": "**Rarity**: " + thisrarity + "/" + collectionSize + ' - ' + raritydescription + "*\n**Hotness**: " + hotness + "\n**List price**: " + pround(parseFloat(thisprice), 3) + ' SOL' + paperhands + '\n**Current FP**: ' + pround(parseFloat(floorprice), 3) + " SOL\n" + sellerLink + " | [Buy on Magic Eden](" + listinglink + ')\n',
							"inline": false
						},
						{
							"name": floor_history.strength.emoji + " __Snapshot Analysis__ (00:00 & 12:00 UTC)",
							"value": "**Last snapshot FP**: " + snapshotFPstring + "\n**3 day avg FP**: " + floor_history?.fp_3daverage + " SOL | " + "**7 day avg FP**: " + floor_history?.fp_7daverage + " SOL\n" + threeDayChangeString + sevenDayChangeString + strengthstring,
							"inline": false
						},
					],
					"thumbnail": {
						"url": thisimage,
						"height": 75,
						"width": 75
					},
					"footer": {
						"text": "Search \"snipe" + thiscollection + "\" for more snipes in this collection.\n" + raritydescription + ' snipes are those listed for <' + parseFloat(thislimit) + 'x the ' + pround(parseFloat(floorprice), 2) + ' SOL floor price ' + ' (<' + pround(parseFloat(thissnipeprice), 2) + ' SOL)' + "\n*statistical rarity may differ between providers\nD: https://discord.gg/CgF7neAte2 | W: nftsniperbot.xyz"
					},
				}
			]//end embed
		}).catch((err) => { w.log.error(server + ': there was a message send error: ' + err) })//end message send
	} catch (err) { w.log.error('there was an nft sending error. Perhaps channel deleted? Error was: ' + err) }
}//end sendsnipes function
