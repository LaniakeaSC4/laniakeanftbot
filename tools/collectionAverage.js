const https = require('https')
var db = require('../clients/pgclient.js')
const sql = require('./commonSQL.js')//common sql related commands are in here
const w = require('./winston.js')
const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const magiceden = require('./magicedenRPC.js')//Magic Eden related commands are in here

async function getCurrentFP() {

//get collections
var collections = await getCollectionAverages()
//get solana/usdt price from https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd
var solprice = await getSolPrice()



for (i = 0;i < collections.length;i++){
  
  var solchange = 1
  var fpchange = 1
  var sol_direction = ''
  var sol_percent = ''
  var fp_direction = ''
  var fp_percent = ''
  var sol_significant = false
  var fp_significant = false
  var collection_24h_strength = ''
  var fp_5daverage = 0
  var sol_5daverage = 0
  
  //current collection fp
  var fpoutput
  var thisfp = await magiceden.getFloorPrice(collections[i].meslug)
  
  if (!collections[i].floor_history) {
    fpoutput = [thisfp]
  } else {
    
    fpoutput = collections[i].floor_history.fp_history
    //calculate average before pushing out oldest
   fp_5daverage = fpoutput.reduce((a, b) => a + b, 0) / fpoutput.length
    //push new
    fpoutput.push(thisfp)
    if (fpoutput.length > 5) {fpoutput.pop()}
  }
  
  //get current sol price
  var soloutput
  if (!collections[i].floor_history) {
    soloutput = [solprice]
  } else {
    soloutput = collections[i].floor_history.sol_history
    //calculate average before pushing out oldest
   sol_5daverage = soloutput.reduce((a, b) => a + b, 0) / soloutput.length
    //push new
    soloutput.push(solprice)
    if (soloutput.length > 5) {soloutput.pop()}
  }
 
  if (soloutput.length > 1 && fpoutput.length > 1) {
    
    solchange = soloutput[1] / soloutput[0]
    solchange = pround(solchange,4)
    
    if (solchange > 1) {
      sol_direction = 'increased'
      sol_percent = pround(((solchange - 1) * 100),2) + '%'
    }
    if (solchange < 1) {
      sol_direction = 'decreased'
      sol_percent = pround((Math.abs((solchange - 1)) * 100),2) + '%'
    }
    if (solchange === 1) {
      sol_direction = 'unchanged'
      sol_percent = '0%'
    }
    
    //if change is more than 3%
    if (pround(((solchange - 1) * 100), 2) > 2) { sol_significant = true }
    
    fpchange = fpoutput[1] / fpoutput[0]
    if (fpchange > 1) {
      fp_direction = 'increased'
      fp_percent = pround(((fpchange - 1) * 100),2.5) + '%'
    }
    if (fpchange < 1) {
      fp_direction = 'decreased'
      fp_percent = pround((Math.abs((fpchange - 1)) * 100),2) + '%'
    }
    if (fpchange === 1) {
      fp_direction = 'unchanged'
      fp_percent = '0%'
    }
    
   //if change is more than 3%
   if (pround(((fpchange - 1) * 100), 2) > 2.5) { fp_significant = true }
    
  } 
  
  //if there had been significant change to both fp and sol price
  if (fp_significant === true || sol_significant === true) {
  if (sol_direction === 'increased' && fp_direction === 'increased') {collection_24h_strength = '↗️ Strong. FP +' + fp_percent + ' SOL/USD +' + sol_percent}
  
  if (sol_direction === 'decreased' && fp_direction === 'decreased') {collection_24h_strength = '↘️ Weak. FP -' + fp_percent + ' SOL/USD -' + sol_percent}
  
  if (sol_direction === 'increased' && fp_direction === 'decreased') {collection_24h_strength = '⬇️ V.Weak. FP -' + fp_percent + ' SOL/USD +' + sol_percent}
  
  if (sol_direction === 'decreased' && fp_direction === 'increased') {collection_24h_strength = '⬆️ V.Strong. FP +' + fp_percent + ' SOL/USD -' + sol_percent}
  
  if (sol_direction === 'unchanged' && fp_direction === 'decreased') {collection_24h_strength = '⬇️ V.Weak. FP -' + fp_percent + ' SOL/USD +' + sol_percent}
  
  if (sol_direction === 'unchanged' && fp_direction === 'increased') {collection_24h_strength = '⬆️ V.Strong. FP +' + fp_percent + ' SOL/USD +' + sol_percent}
  
  if (sol_direction === 'increased' && fp_direction === 'unchanged') { collection_24h_strength = '↘️ Weak. FP +' + fp_percent + ' SOL/USD +' + sol_percent}
  
  if (sol_direction === 'decreased' && fp_direction === 'unchanged') { collection_24h_strength = '↗️ Strong. FP +' + fp_percent + ' SOL/USD -' + sol_percent}
  
  } else {
    var solsymbol = ''
    var fpsymbol = ''
    if (sol_direction === 'decreased') {solsymbol = '-'} else {solsymbol = '+'}
    if (fp_direction === 'decreased') {fpsymbol = '-'} else {fpsymbol = '+'}
    
    collection_24h_strength = '➡️ Stable. No significant change in FP (' + fpsymbol + fp_percent + ') or SOL/USD price (' + solsymbol + sol_percent + ').'
  }
  
  //calculate 5d fp change
 var fp_5dchange = fp_5daverage / fpoutput[0]
  
  w.log.info(collection_24h_strength)
  
  
  var dbstore = {}
  dbstore['fp_history'] = fpoutput
  dbstore['sol_history'] = soloutput
  dbstore['collection_24h_strength'] = collection_24h_strength
  dbstore['fp_5daverage'] = pround(fp_5daverage,2)
  dbstore['sol_5daverage'] = pround(sol_5daverage,2)
  dbstore['fp_5dchange'] = pround(fp_5dchange,2)
  
  sql.updateTableColumn("solanametaplex", "meslug", collections[i].meslug, "floor_history", dbstore)
  
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
