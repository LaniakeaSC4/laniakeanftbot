const sql = require('../tools/commonSQL.js')//sql related commands are in here
const nfttools = require('../tools/nfttools.js')//generic nft tools like get rarity description from rank in here
const w = require('../tools/winston.js')

async function check(collectionKey, nftid) {

  //get NFT data
  var NFTdata = await sql.getNFTdata(collectionKey, nftid)
  //w.log.info(NFTdata)
  var collectionSize = await sql.getData("solanametaplex", "collectionkey", collectionKey, 'collectioncount')
  //w.log.info('collectionsize is: ' + collectionSize)


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
        "text": "Bot and Rarity data by Laniakea#3683"
      }
    }
  ]//end embed  
  return rarityembed
}; module.exports.check = check
