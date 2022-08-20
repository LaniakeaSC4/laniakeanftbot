const metaplex = require('./metaplexRPC.js')//metaplex RPC. Work with database collections

async function check(collectionKey, nftid) {

	//get NFT data
	var NFTdata = await metaplex.getNFTdata(collectionKey, nftid)
	console.log(NFTdata)
	
	//thisrarity from database
	//thisname from database
	//thisimage from database
	//get collection size (should I be storing this on pg?)
	//calculate ranges from collection size
	//get rarity description
	//get embed colour
	
	/* build embed
	
	var rarityembed = [
        {
          "title": thisname,
          "color": thisembedcolour,
          "fields": [
            {
              "name": "Rarity",
              "value": thisrarity + ' - ' + raritydescription,
              "inline": true
            }
          ],
          "image": {
            "url": thisimage,
            "height": 75,
            "width": 75
          },
          "footer": {
            "text": "Bot by Laniakea#3683"
          }
        }
      ]//end embed  
	
	*/

}; module.exports.check = check
