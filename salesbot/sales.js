const w = require('../tools/winston.js')
var db = require('../clients/pgclient.js')

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

async function go() {

	var collections = await sqlGetCollections()

	for (var i = 0; i < collections.length; i++) {//for each sql row (collection)
		w.log.info(collections[i].meslug)
		for (var j = 0; j < collections[i].servers.data.length; j++) {//for each server signed up to that collection
			w.log.info(JSON.stringify(collections[i].servers.data[j]))
		}
	}

} module.exports.go = go