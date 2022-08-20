const metaplex = require('./metaplexRPC.js')//metaplex RPC. Work with database collections
const postgress = require('./postgres.js')//postgress related commands are in here
const nfttools = require('./nfttools.js')//generic nft tools like get rarity description from rank in here

async function check(collectionKey, nftid) {

	//get NFT data
	var NFTdata = await metaplex.getNFTdata(collectionKey, nftid)
	console.log(NFTdata)
	var collectionSize = getData("solanametaplex", "collectionkey", collectionKey, collectioncount) 
	
	var ranges = await nfttools.calculateranges(collectionSize)

      var mythicstart = ranges[0]; var mythicend = ranges[1]
      var legendarystart = ranges[2]; var legendaryend = ranges[3]
      var epicstart = ranges[4]; var epicend = ranges[5]
      var rarestart = ranges[6]; var rareend = ranges[7]
      var uncommonstart = ranges[8]; var uncommonend = ranges[9]
      var commonstart = ranges[10]; var commonend = ranges[11]

      var raritydescription = await nfttools.getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, NFTdata.rarityRank)

      var embedcolour = await nfttools.getembedcolour(raritydescription)
      var thisembedcolour = parseInt(embedcolour, 16)
	
	//build embed
	var rarityembed = [
        {
          "title": NFTdata.name,
          "color": thisembedcolour,
          "fields": [
            {
              "name": "Rarity",
              "value": NFTdata.rarityRank + ' - ' + raritydescription,
              "inline": true
            }
          ],
          "image": {
            "url": NFTdata.image,
            "height": 75,
            "width": 75
          },
          "footer": {
            "text": "Bot by Laniakea#3683"
          }
        }
      ]//end embed  
	
return rarityembed
}; module.exports.check = check
