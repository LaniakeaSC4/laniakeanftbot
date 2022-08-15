const https = require('https')
const axios = require('axios')

//returns x number of recent listings from Magic Eden
function getnewremoteMElistings(collection, number) {
	return new Promise((resolve, reject) => {
		var thiscollection = 'https://api-mainnet.magiceden.dev/v2/collections/' + collection + '/listings?offset=0&limit=' + number//build collection URL

		https.get(thiscollection, (resp) => {
			let data = ''
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk
			})

			// The whole response has been received.
			resp.on('end', () => {
				var thislistings = JSON.parse(data)
				resolve(thislistings)//return the recieved X listings
			})
		}).on("error", (err) => { console.log("Error: " + err.message) })
	}) //end promise
}//end getnewremoteMElistings function

//returns token details from Magic Eden
async function getremoteMEtokendetails(mintaddress) {
	return new Promise((resolve, reject) => {
		var thisurl = 'https://api-mainnet.magiceden.dev/v2/tokens/' + mintaddress//build token URL

		https.get(thisurl, (resp) => {
			let data = ''
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk
			})

			// The whole response has been received.
			resp.on('end', () => {
				var thistoken = JSON.parse(data)
				resolve(thistoken)//return the recieved tokendetails
			})
		}).on("error", (err) => { console.log("Error: " + err.message) })
	}) //end promise
}//end getremoteMEtokendetails function

//returns floor price from Magic Eden API
async function getremotefloorprice(collection) {
	return new Promise((resolve, reject) => {

		//build collection URL
		var thiscollection = 'https://api-mainnet.magiceden.dev/v2/collections/' + collection + '/stats'

		https.get(thiscollection, (resp) => {
			let data = ''
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk
			});
			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				var rawFP = parseFloat(JSON.parse(data).floorPrice)//get FP in Sol
				var thisFP = rawFP / 1000000000
				resolve(thisFP)
			})
		}).on("error", (err) => { console.log("Error: " + err.message) })
	}) //end promise
}//end getremotefloorprice function

async function getNFTtraitCounts(collectionstring){
  return new Promise((resolve, reject) => {
  var thiscollection = 'https://api-mainnet.magiceden.dev/rpc/getCollectionEscrowStats/' + collectionstring
  
  https.get(thiscollection, (resp) => {
			let data = ''
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk
			});
			// The whole response has been received. Print out the result.
			resp.on('end', () => {
				resolve(data)
			})
		}).on("error", (err) => { console.log("Error: " + err.message) })
	}) //end promise
}

module.exports.getNewListings = getnewremoteMElistings
module.exports.getTokenDetails = getremoteMEtokendetails
module.exports.getFloorPrice = getremotefloorprice
module.exports.getNFTtraitCounts = getNFTtraitCounts
