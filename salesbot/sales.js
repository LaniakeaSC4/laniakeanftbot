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
		var querystring = "UPDATE sales SET me_activities = $1 WHERE meslug = '" + meslug + "'"
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
				w.log.info('returning ' + thislistings.length + ' activities from ME.')
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
		var magicactivities = await getMEactivities(collections[i].meslug, 100)
		var newactivities = magicactivities
		w.log.info('typeof newactivities: ' + typeof newactivities)
		w.log.info('length of newactivities is: ' + newactivities.length)
		w.log.info('tokenMint 0 is: ' + newactivities[0].tokenMint)
		//
		
		var salesActivities = []
		for (var s = 0;s < newactivities.length;s++){
		  if (newactivities[s].type == "buyNow"){
		    newactivities[s]['findkey'] = newactivities[s].type + newactivities[s].tokenMint + newactivities[s].price
		    salesActivities.push(newactivities[s])
		  }
		}
		w.log.info('salesactivities.length is: ' + salesActivities.length)
		w.log.info(JSON.stringify(salesActivities[0]))
		
		var oldactivities = collections[i].me_activities
		var newSales = []
		for (var j = 0; j < salesActivities.length; j++) {//for each sale
			await wait(50)
			for (var k = 0; k < oldactivities.length; k++) {
				try {
					if (oldactivities[k].findkey === salesActivities[j].findkey)  {
						w.log.info('Matched: ' + oldactivities[k].findkey )
						break
					} else {
						w.log.info('did not match ' + salesActivities[j].findkey + ' is it new?')
						newSales.push(salesActivities[j])
					}
				} catch { w.log.info('newactivities[j].tokenMint is: ' + newactivities[j]?.tokenMint + ". oldactivities[k].tokenMint is: " + oldactivities[k]?.tokenMint) }
			}//end for each old avtivities
		}//end for each recieved activity

		w.log.info('length of newSales is: ' + newSales.length)

		//add newactivities to oldactivities
		var storeActivities = newSales.concat(oldactivities)//add actual new ones to old ones
		storeActivities = storeActivities.slice(0, 200)//keep last 20

		w.log.info('Saveing up to 200 activities. This time it is ' + storeActivities.length + ' activities')

		await saveActivities(collections[i].meslug, JSON.stringify(storeActivities))

/*
		//loop through new activities and filter out the buys
		var buys = []
		w.log.info('newactivities.length is ' + newactivities.length)
		
		for (var m = 0; m < newactivities.length; m++) {
			await wait(50)
			w.log.info(newactivities[m].blockTime + ': type is: ' + newactivities[m].type)
			if (newactivities[m].type === "buyNow") {
				buys.push(newactivities[m])
			}
		}
*/
		w.log.info('These are the new buys:')
		w.log.info(JSON.stringify(newSales))

		for (var l = 0; l < collections[i].servers.data.length; l++) {//for each server signed up to that collection
			w.log.info(JSON.stringify(collections[i].servers.data[l]))
		}

		await wait(2000)

	}

} module.exports.getActivities = getActivities
