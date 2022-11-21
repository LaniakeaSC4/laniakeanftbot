const w = require('../tools/winston.js')
const https = require('https')
var db = require('../clients/pgclient.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function sqlGetCollections() {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		//select the data in this column for a row which has this primary key
		var querystring = "SELECT meslug,servers FROM sales"

		pgclient.query(querystring, (err, res) => {
			if (err) throw err
			resolve(res.rows)
		}) //end query
	}) //end promise
}//end get collections

function getMEactivities(collection, number) {
	return new Promise((resolve, reject) => {
	var thiscollection = 'https://api-mainnet.magiceden.dev/v2/collections/' + collection + '/activities?offset=0&limit=' + number//build collection URL
	w.log.info('getting: ' + thiscollection)
	//https://api-mainnet.magiceden.dev/v2/collections/crypto_coral_tribe/activities?offset=0&limit=5

	https.get(thiscollection, (resp) => {
		let data = ''
		// A chunk of data has been received.
		resp.on('data', (chunk) => {
			data += chunk
		})
		// The whole response has been received.
		resp.on('end', () => {

			var thislistings = JSON.parse(data)
			w.log.info(JSON.stringify(thislistings))
			resolve(thislistings)//return the recieved X listings

		})
	}).on("error", (err) => { w.log.info("Error: " + err.message) })
}) //end promise
}

async function getActivities() {

	var collections = await sqlGetCollections()

	for (var i = 0; i < collections.length; i++) {//for each sql row (collection)
		w.log.info(collections[i].meslug)
		//get activities
		var activities = await getMEactivities(collections[i].meslug, 5)
		//await wait(1000)
		w.log.info('got activities. logging them')
		w.log.info(JSON.stringify(activities))


		for (var j = 0; j < collections[i].servers.data.length; j++) {//for each server signed up to that collection
			w.log.info(JSON.stringify(collections[i].servers.data[j]))
		}
	}

} module.exports.getActivities = getActivities