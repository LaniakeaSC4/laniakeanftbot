const https = require('https')
var db = require('../clients/pgclient.js')
const sql = require('./commonSQL.js')//common sql related commands are in here
const w = require('./winston.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const magiceden = require('./magicedenRPC.js')//Magic Eden related commands are in here

async function getCurrentFP() {

//get collections
var collections = await getCollectionAverages()
//get solana/usdt price from https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd
var solprice = await getSolPrice()



for (i = 0;i < collections.length;i++){
  
  //current collection fp
  var fpoutput
  var thisfp = await magiceden.getFloorPrice(collections[i].meslug)
  
  if (!collections[i].floor_history) {
    fpoutput = [thisfp]
  } else {
    fpoutput = collections[i].floor_history.fp_history
    fpoutput.push(thisfp)
    if (fpoutput.length > 5) {fpoutput.pop()}
  }
  
  //get current sol price
  var soloutput
  if (!collections[i].floor_history) {
    soloutput = [solprice]
  } else {
    soloutput = collections[i].floor_history.sol_history
    soloutput.push(solprice)
    if (soloutput.length > 5) {soloutput.pop()}
  }
  
  var dbstore = {}
  dbstore['fp_history'] = fpoutput
  dbstore['sol_history'] = soloutput
  
  
    w.log.info('Floor price for collection ' + collections[i].meslug+ ' is ' + thisfp + ' and solprice is ' + solprice)
    w.log.info(JSON.stringify(fpoutput))
    w.log.info(JSON.stringify(soloutput))
    await wait(2000)
    
    

}

} module.exports.getCurrentFP = getCurrentFP

async function getCollectionAverages() {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //select the data in this column for a row which has this primary key
    var querystring = "SELECT meslug,floor_history FROM \"solanametaplex\""

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows)
    }) //end query
  }) //end promise
}

//get solana usdt price 
async function getSolPrice() {
	return new Promise((resolve, reject) => {
		var thisurl = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'

		https.get(thisurl, (resp) => {
			let data = ''
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk
			})

			// The whole response has been received.
			resp.on('end', () => {
				var rawprice = JSON.parse(data)
				var thisprice = rawprice.solana.usd
				resolve(thisprice)
			})
		}).on("error", (err) => { 
		  w.log.error("General http error when getting solana price from coingeko. Error: " + err.message)
		  resolve(null)})
	}) //end promise
}
