const w = require('../tools/winston.js')
const https = require('https')
var db = require('../clients/pgclient.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function sqlGetCollections() {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		//select the data in this column for a row which has this primary key
		var querystring = "SELECT meslug,servers,me_activities FROM sales"

		pgclient.query(querystring, (err, res) => {
			if (err) throw err
			resolve(res.rows)
		}) //end query
	}) //end promise
}//end get collections

async function saveActivities(meslug, activities) {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		//update this table to add this data to this column where this key matches the table's primary key
		var querystring = "UPDATE sales SET me_activiies = $1 WHERE meslug = '" + meslug + "'"
		var querydata = [activities]

		pgclient.query(querystring, querydata, (err, res) => {
			if (err) throw err
			resolve(true)
		})//end query
	})//end promise
}

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
		var magicactivities = await getMEactivities(collections[i].meslug, 10)
		//await wait(1000)
		w.log.info('got activities. logging them')
		w.log.info(JSON.stringify(magicactivities[0]))

		//cut recieved activities down to just the new ones
		var oldactivities = collections[i].me_activities
		for (var j = 0; j < magicactivities.length; j++) {
			for (var k = 0; k < oldactivities.length; k++) {
				if (magicactivities[j].signature === oldactivities[k].signature) {
					magicactivities.pop(magicactivities[j])
				}//end if
			}//end for each old avtivities
		}//end for each recieved activity

		w.log.info('Saveing these new activities; ')
		w.log.info(JSON.stringify(magicactivities))
		await saveActivities(collections[i].meslug,magicactivities)



		for (var l = 0; l < collections[i].servers.data.length; l++) {//for each server signed up to that collection
			w.log.info(JSON.stringify(collections[i].servers.data[l]))
		}
	}

} module.exports.getActivities = getActivities