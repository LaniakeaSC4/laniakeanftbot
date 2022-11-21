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

	var fromsql = await sqlGetCollections()
	w.log.info(JSON.stringify(fromsql))

} module.exports.go = go