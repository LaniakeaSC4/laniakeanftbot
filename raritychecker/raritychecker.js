const sql = require('../tools/commonSQL.js')//sql related commands are in here
const nfttools = require('../tools/nfttools.js')//generic nft tools like get rarity description from rank in here
const w = require('../tools/winston.js')

async function check(collectionKey, tokenAddress) {

  //get NFT data from metaplex data
  var NFTdata = await sql.getNFTdata(collectionKey, tokenAddress)//get NFT data from our database
  if (NFTdata) {//if there was any error getting the NFT data, function will return null. If it didnt return null - proceed
    //get collection size
    var collectionSize = await sql.getData("solanametaplex", "collectionkey", collectionKey, 'collectioncount')
    //get rarity description (e.g. 'legendary')
    var raritydescription = await nfttools.getraritydescription(collectionSize, NFTdata.rarityRank)
    var thisembedcolour = await nfttools.getembedcolour(raritydescription)

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
    w.log.error('error getting NFTdata from SQL')
    return null//return null to be handled by calling function
  }//end else
}; module.exports.check = check
