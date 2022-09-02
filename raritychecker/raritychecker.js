const sql = require('../tools/commonSQL.js')//sql related commands are in here
const nfttools = require('../tools/nfttools.js')//generic nft tools like get rarity description from rank in here
const w = require('../tools/winston.js')

async function check(collectionKey, nftid) {

  //get NFT data from metaplex data
  var NFTdata = await sql.getNFTdata(collectionKey, nftid)
  if (NFTdata) {
    var collectionSize = await sql.getData("solanametaplex", "collectionkey", collectionKey, 'collectioncount')

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
  } else {
    w.log.error('error checking that rarity')
    return null
  }
}; module.exports.check = check
