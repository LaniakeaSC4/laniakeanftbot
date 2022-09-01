const sql = require('../tools/commonSQL.js')//sql related commands are in here
const nfttools = require('../tools/nfttools.js')//generic nft tools like get rarity description from rank in here
const w = require('../tools/winston.js')

async function check(collectionKey, nftid) {

  //get NFT data from metaplex data
  var NFTdata = await sql.getNFTdata(collectionKey, nftid)
  var collectionSize = await sql.getData("solanametaplex", "collectionkey", collectionKey, 'collectioncount')

/*
//calculate rarity ranges for this collection
  var ranges = await nfttools.calculateranges(collectionSize)

//seperate out rarity ranges. This is just visual for the code. Could pass ranges[x] straight into raritydescription function
  var mythicstart = ranges[0]; var mythicend = ranges[1]
  var legendarystart = ranges[2]; var legendaryend = ranges[3]
  var epicstart = ranges[4]; var epicend = ranges[5]
  var rarestart = ranges[6]; var rareend = ranges[7]
  var uncommonstart = ranges[8]; var uncommonend = ranges[9]
  var commonstart = ranges[10]; var commonend = ranges[11]
*/
//get rarity description (e.g. 'legendary')
  var raritydescription = await nfttools.getraritydescription(collectionSize, NFTdata.rarityRank)


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
        "text": "Bot and Rarity data by Laniakea#3683"
      }
    }
  ]//end embed  
  return rarityembed
}; module.exports.check = check
