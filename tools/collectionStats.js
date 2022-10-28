const https = require('https')
const sql = require('./commonSQL.js')//common sql related commands are in here
const w = require('./winston.js')
const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const magiceden = require('./magicedenRPC.js')//Magic Eden related commands are in here

//import sniper so we can restart it
const sniper = require('../sniper/sniper-main.js')

async function updateStats() {
  w.log.info('Updating collection stats')
  //get collections
  var collections = await getCollectionAverages()
  //get solana/usdt price from https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd
  var solprice = await getSolPrice()
 // w.log.info(JSON.stringify(collections))
w.log.info('collections.meslug.length is ' + collections.length)
  for (i = 0; i < collections.length; i++) {
w.log.info('loop: ' + i)

    var solchange = 1
    var fpchange = 1
    var sol_direction = ''
    var sol_percent = ''
    var fp_direction = ''
    var fp_percent = ''
    var sol_significant = false
    var fp_significant = false
    var collection_12h_strength = 'Not enough data'
    var fp_3daverage = 0
    var sol_3daverage = 0
    var fp_3dchange = 'Not enough data'

    //current collection fp
    var fpoutput
    var thisfp = await magiceden.getFloorPrice(collections[i].meslug)
    w.log.info('got this fp: ' + thisfp + 'with meslug: ' + collections[i].meslug)

    if (!collections[i].floor_history) {
      w.log.info('There was no history so fp = ' + thisfp)
      fpoutput = [thisfp]
      w.log.info(JSON.stringify(fpoutput))
    } else {
w.log.info('There was a history setting fp history to ' + JSON.stringify(collections[i].floor_history.fp_history))
      fpoutput = collections[i].floor_history.fp_history
      //calculate average before pushing out oldest
      fp_3daverage = fpoutput.reduce((a, b) => a + b, 0) / fpoutput.length
      w.log.info("average calculated as: " + fp_3daverage)
      //push new
      fpoutput.unshift(thisfp)
      if (fpoutput.length > 6) { fpoutput.pop() }
    }

    //get current sol price
    var soloutput
    if (!collections[i].floor_history) {
      soloutput = [solprice]
    } else {
      soloutput = collections[i].floor_history.sol_history
      //calculate average before pushing out oldest
      sol_3daverage = soloutput.reduce((a, b) => a + b, 0) / soloutput.length
      //push new
      soloutput.unshift(solprice)
      if (soloutput.length > 6) { soloutput.pop() }
    }

    if (soloutput.length > 2 && fpoutput.length > 2) {
w.log.info('output length was greater than 2')
      solchange = soloutput[0] / soloutput[1]
      solchange = pround(solchange, 4)
w.log.info('solchange is: ' + soloutput[0] + '/' + soloutput[1] + '=' + solchange)
      if (solchange > 1) {
        sol_direction = 'increased'
        sol_percent = pround(((solchange - 1) * 100), 2) + '%'
        if (pround(pround(((solchange - 1) * 100), 2) > 3)) { sol_significant = true }
      }
      if (solchange < 1) {
        sol_direction = 'decreased'
        sol_percent = pround((Math.abs((solchange - 1)) * 100), 2) + '%'
        if (pround(pround((Math.abs((solchange - 1)) * 100), 2) > 3)) { sol_significant = true }
      }
      if (solchange === 1) {
        sol_direction = 'unchanged'
        sol_percent = '0%'
      }
      
w.log.info('SOL direction is: ' + sol_direction + '. Percentage is: ' + sol_percent + '. Sol_significant is: ' + sol_significant)

      fpchange = fpoutput[0] / fpoutput[1]
      if (fpchange > 1) {
        fp_direction = 'increased'
        fp_percent = pround(((fpchange - 1) * 100), 2) + '%'
        if (pround(((fpchange - 1) * 100), 2) > 3) { fp_significant = true }
      }
      if (fpchange < 1) {
        fp_direction = 'decreased'
        fp_percent = pround((Math.abs((fpchange - 1)) * 100), 2) + '%'
        if (pround((Math.abs((fpchange - 1)) * 100), 2) > 3) { fp_significant = true }
      }
      if (fpchange === 1) {
        fp_direction = 'unchanged'
        fp_percent = '0%'
      }
      
      w.log.info('FP direction is: ' + fp_direction + '. Percentage is: ' + fp_percent + '. fp_significant is: ' + fp_significant)

      //calculate 3d fp change
      var fp_3dchangecalc = fpoutput[0] / fp_3daverage

w.log.info('fp_3dchangecalc = ' + fpoutput[0] + '/' + fp_3daverage + '=' + fp_3dchangecalc)

      if (fp_3dchangecalc > 1) {
        fp_3dchange = '+' + pround(((fp_3dchangecalc - 1) * 100), 2) + '%'
      }
      if (fp_3dchangecalc < 1) {
        fp_3dchange = '-' + pround((Math.abs((fp_3dchangecalc - 1)) * 100), 2) + '%'
      }
      if (fp_3dchangecalc === 1) {
        fp_3dchange = '+0%'
      }
      
w.log.info('fp_3dchange = ' + fp_3dchange)

      //if there had been significant change to fp
      if (fp_significant === true) {
        
        w.log.info('There has been a significant fp shift')

        if (fp_direction === 'increased') {
          
          w.log.info('after the significant fp shift. FP shift was increase')
          
          if (sol_significant === true) {
            
            w.log.info('after the significant fp shift and the shift was in increase. There was a significant sol shift also. Sol_direction was: ' + sol_direction)
            
            if (sol_direction === 'increased') { collection_12h_strength = '↗️ Strong. FP +' + fp_percent + ' | SOL/USD +' + sol_percent }
            if (sol_direction === 'decreased') { collection_12h_strength = '⬆️ Strong. FP +' + fp_percent + ' | SOL/USD -' + sol_percent }
          } else {
            //if no significant change to SOL (just FP increase). Sol change can be insignficantly plus, minus or unchanged
            var solsymbol_1 = ""; if (sol_direction === 'decreased') { solsymbol_1 = '-' } else { solsymbol_1 = '+' }
            collection_12h_strength = '↗️ Strong. FP +' + fp_percent + ' | SOL/USD ' + solsymbol_1 + sol_percent
            w.log.info('after the significant fp shift and the shift was in increase. Sol shift was not significant. So solsymbol_1 is ' + solsymbol_1)
          }
        }

        if (fp_direction === 'decreased') {
          if (sol_significant === true) {
            if (sol_direction === 'increased') { collection_12h_strength = '⬇️ Weak. FP -' + fp_percent + ' | SOL/USD +' + sol_percent }
            if (sol_direction === 'decreased') { collection_12h_strength = '↘️ Weak. FP -' + fp_percent + ' | SOL/USD -' + sol_percent }
          } else {
            //if no significant change to SOL (just FP decrease). Sol change can be insignficantly plus, minus or unchanged
            var solsymbol_2 = ""; if (sol_direction === 'decreased') { solsymbol_2 = '-' } else { solsymbol_2 = '+' }
            collection_12h_strength = '↘️ Weak. FP -' + fp_percent + ' | SOL/USD ' + solsymbol_2 + sol_percent
          }
        }

      }

      //if there had been significant change to sol
      if (sol_significant === true) {

        if (sol_direction === 'increased') {
          if (fp_significant === true) {
            if (fp_direction === 'increased') { collection_12h_strength = '↗️ Strong. FP +' + fp_percent + ' | SOL/USD +' + sol_percent }
            if (fp_direction === 'decreased') { collection_12h_strength = '⬇️ Weak. FP -' + fp_percent + ' | SOL/USD +' + sol_percent }
          } else {
            //if significant change to SOL but no significant change to FP. FP change can be insignficantly plus, minus or unchanged
            var fpsymbol_1 = ""; if (fp_direction === 'decreased') { fpsymbol_1 = '-' } else { fpsymbol_1 = '+' }
            collection_12h_strength = '↘️ Weak. FP ' + fpsymbol_1 + fp_percent + ' | SOL/USD +' + sol_percent
          }
        }

        if (sol_direction === 'decreased') {
          if (fp_significant === true) {
            if (fp_direction === 'increased') { collection_12h_strength = '⬆️ Strong. FP +' + fp_percent + ' | SOL/USD -' + sol_percent }
            if (fp_direction === 'decreased') { collection_12h_strength = '↘️ Weak. FP -' + fp_percent + ' | SOL/USD -' + sol_percent }
          } else {
            //if no significant change to SOL (just FP increase). Sol change can be insignficantly plus, minus or unchanged
            var fpsymbol_2 = ""; if (fp_direction === 'decreased') { fpsymbol_2 = '-' } else { fpsymbol_2 = '+' }
            collection_12h_strength = '↗️ Strong. FP ' + fpsymbol_2 + fp_percent + ' | SOL/USD -' + sol_percent
          }
        }

      }

      //if no significant changes
      if (sol_significant === false && fp_significant === false) {

        var solsymbol = ''
        var fpsymbol = ''
        if (sol_direction === 'decreased') { solsymbol = '-' } else { solsymbol = '+' }
        if (fp_direction === 'decreased') { fpsymbol = '-' } else { fpsymbol = '+' }

        collection_12h_strength = '➡️ Stable. FP ' + fpsymbol + fp_percent + ' | SOL/USD price ' + solsymbol + sol_percent + '.'

      }

    }//if output length > 2

    w.log.info('Collection strength for ' + collections[i].meslug + ' is: ' + collection_12h_strength + " FP history is: " + fpoutput.toString() + ". SOL history is: " + soloutput.toString() + ". 3d FP AVG is: " + fp_3daverage + ". Today\'s change on 3d AVG FP is: " + fp_3dchange)

    var dbstore = {}
    dbstore['fp_history'] = fpoutput
    dbstore['sol_history'] = soloutput
    dbstore['collection_12h_strength'] = collection_12h_strength
    dbstore['fp_3daverage'] = pround(fp_3daverage, 2)
    dbstore['sol_3daverage'] = pround(sol_3daverage, 2)
    dbstore['fp_3dchange'] = fp_3dchange

    await sql.updateTableColumn("solanametaplex", "meslug", collections[i].meslug, "floor_history", dbstore)

    await wait(1500)

  }
  //restart sniper to update collection stats available to snipe sender
  			await sniper.stop()
				await sniper.initialise()
} module.exports.updateStats = updateStats

var db = require('../clients/pgclient.js')
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
      resolve(null)
    })
  }) //end promise
}//end get sol/usd price
