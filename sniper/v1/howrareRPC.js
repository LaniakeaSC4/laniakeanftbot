const https = require('https')
const w = require('../../tools/winston.js')

//get complete howrare.is dataset
async function getRemoteHowRareData(collection) {
	return new Promise((resolve, reject) => {
		var thiscollection = 'https://api.howrare.is/v0.1/collections/' + collection//build collection URL

		https.get(thiscollection, (resp) => {
			let data = ''
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk
			})
			// The whole response has been received.
			resp.on('end', () => {
				var thiscollection = JSON.parse(data)
				//w.log.info('howrare API code is; ' + thiscollection.result.api_code)
				resolve(thiscollection)//return the recieved X listings
			})
		}).on("error", (err) => { w.log.info("Error: " + err.message) })
	}) //end promise
}//end getremoteHowRareData function

module.exports.getCollection = getRemoteHowRareData
