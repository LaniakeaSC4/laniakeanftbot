const sql = require('../../tools/commonSQL.js')//sql related commands are in here
const w = require('../../tools/winston.js')

//initialise servers
var supportedservers = []
async function initaliseServers() {
	supportedservers = []
	supportedservers = await sql.getSupportedServers()
}; module.exports.initaliseServers = initaliseServers

//work out where to send them
async function sendFilter(thisname, thiscollection, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness) {
w.log.info('starting sendFilter')
	var thisserverid = ''
	var channel = ''

	for (i = 0; i < supportedservers.length; i++) {

		//check if this snipe should be sent to a homechannel
		if (supportedservers[i].homechannel_enabled) {

			//check if this snipe needs to do into a home channel
			var foundhome = false
			for (var j = 0; j < supportedservers[i].homechannel_collections.enabled.length; j++) {
				if (supportedservers[i].homechannel_collections.enabled[j] == thiscollection) {
					foundhome = true
					thisserverid = supportedservers[i].serverid
					channel = supportedservers[i].homechannel_id
					w.log.info('matched this snipe to a home collection for server: ' + supportedservers[i].homechannel_id)
					break
				}
			}

			//if yes, send it to home channel
			if (foundhome) {
				if (channel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
					sendsnipes(thisserverid, channel, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness)
				}//end if snipe channel.
			} else {

				//if homechannel enabled, but not for this collection, send it through the normal process
				//get the snipes channel id to send the snipe to
				thisserverid = supportedservers[i].serverid
				if (raritydescription === 'Rare') { channel = supportedservers[i].raresnipes }
				if (raritydescription === 'Epic') { channel = supportedservers[i].epicsnipes }
				if (raritydescription === 'Legendary') { channel = supportedservers[i].legendarysnipes }
				if (raritydescription === 'Mythic') { channel = supportedservers[i].mythicsnipes }

				if (channel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
					//send snipes
					sendsnipes(thisserverid, channel, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness)
				}//end if snipe channel.
			}

		} else {//if homechannel is not enabled - send normally

			//get the snipes channel id to send the snipe to
			thisserverid = supportedservers[i].serverid
			if (raritydescription === 'Rare') { channel = supportedservers[i].raresnipes }
			if (raritydescription === 'Epic') { channel = supportedservers[i].epicsnipes }
			if (raritydescription === 'Legendary') { channel = supportedservers[i].legendarysnipes }
			if (raritydescription === 'Mythic') { channel = supportedservers[i].mythicsnipes }

			if (channel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
				//send snipes
				sendsnipes(thisserverid, channel, thisname, thisembedcolour, rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness)
			}//end if snipe channel.

		}



	}//for each supported server (from SQL)   

}; module.exports.sendFilter = sendFilter

async function sendsnipes(server, channel, nftname, embedcolour, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage, listinglink, hotness) {
	return new Promise((resolve, reject) => {
		client.guilds.cache.get(server).channels.cache.get(channel).send({
			embeds: [
				{
					"title": hotness + ' Snipe Opportunity__\n' + nftname,
					"color": embedcolour,
					"fields": [
						{
							"name": "🎯 __Snipe Details__",
							"value": "**Rarity**: " + thisrarity + ' - ' + raritydescription + "\n**List price**: " + pround(parseFloat(thisprice), 3) + ' SOL\n**Floor price**: ' + pround(parseFloat(floorprice), 3) + ' SOL\n[Buy on Magic Eden](' + listinglink + ')\n',
							"inline": false
						},
						{
							"name": "⚡ __Snipe Price Info__",
							"value": 'For ' + raritydescription + ' NFTs, any price less than ' + parseFloat(thislimit) + 'x the floor price of ' + pround(parseFloat(floorprice), 3) + ' SOL is a snipe (i.e. less than ' + pround(parseFloat(thissnipeprice), 3) + ' SOL)',
							"inline": true
						},
						{
							"name": "🐍 __Laniakea Bot v2.1__",
							"value": "Hand crafted by Laniakea#3683 and brought to you by the Secret Snake Society. Visit us [on Discord](https://discord.gg/Dr2Vb7Rt6u).",
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
		})//end message send
	}) //end promise
}//end sendsnipes function