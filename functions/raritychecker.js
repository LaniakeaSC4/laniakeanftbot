const metaplex = require('./metaplexRPC.js')//metaplex RPC. Work with database collections

async function check(collectionKey, nftid) {

	//get NFT data
	var NFTdata = await metaplex.getNFTdata(collectionKey, nftid)
	console.log(NFTdata)

}; module.exports.check = check