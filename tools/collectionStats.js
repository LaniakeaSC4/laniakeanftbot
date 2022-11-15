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

  for (var i = 0; i < collections.length; i++) {

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
    var fp_7daverage = 0
    var sol_7daverage = 0
    var fp_7dchange = 'Not enough data'
    var solsymbol = ''
    var fpsymbol = ''
    var strengthemoji = ''
    var strengthdescription = ''
    var strength_ready = false

    var symbol_3dchange = ''
    var percentage_3dchange = 0
    var amount_3dchange = 0

    var symbol_7dchange = ''
    var percentage_7dchange = 0
    var amount_7dchange = 0

    //current collection fp
    var fpoutput
    var thisfp = await magiceden.getFloorPrice(collections[i].meslug)

    w.log.info('got this fp: ' + thisfp + ' with meslug: ' + collections[i].meslug)

    if (!collections[i].floor_history) {
      //if no old floor history, let's start one
      fpoutput = [thisfp]
    } else {
      //copy old history to new
      fpoutput = collections[i].floor_history.fp_history

      //push new
      fpoutput.unshift(thisfp)
      if (fpoutput.length > 14) { fpoutput.pop() }

      if (fpoutput.length > 5) {//if we have 3 days worth of data
        var threeDayFpArr = fpoutput.slice(0, 6)
        //calculate average before pushing out oldest
        fp_3daverage = threeDayFpArr.reduce((a, b) => a + b, 0) / threeDayFpArr.length
        w.log.info("3 Day FP average calculated as: " + fp_3daverage)
      }

      if (fpoutput.length > 13) {//if we have 7 days worth of data
        var sevenDayFpArr = fpoutput.slice(0, 14)
        //calculate average before pushing out oldest
        fp_7daverage = sevenDayFpArr.reduce((a, b) => a + b, 0) / sevenDayFpArr.length
        w.log.info("7 Day FP average calculated as: " + fp_7daverage)
      }


    }

    //get current sol price
    var soloutput
    if (!collections[i].floor_history) {
      //if no old sol history, make one
      soloutput = [solprice]
    } else {
      soloutput = collections[i].floor_history.sol_history

      //push new
      soloutput.unshift(solprice)
      if (soloutput.length > 14) { soloutput.pop() }

      if (soloutput.length > 5) {//if we have 3 days worth of data
        var threeDaySolArr = soloutput.slice(0, 6)
        //calculate average before pushing out oldest
        sol_3daverage = threeDaySolArr.reduce((a, b) => a + b, 0) / threeDaySolArr.length
      }

      if (soloutput.length > 13) {//if we have 7 days worth of data
        var sevenDaySolArr = soloutput.slice(0, 14)
        //calculate average before pushing out oldest
        sol_7daverage = sevenDaySolArr.reduce((a, b) => a + b, 0) / sevenDaySolArr.length
      }


    }

    //if we have 3 days data
    if (soloutput.length > 5 && fpoutput.length > 5) {
      strength_ready = true

      //calculate snapshot sol change
      solchange = soloutput[0] / soloutput[1]
      solchange = pround(solchange, 4)

      if (solchange > 1) {
        sol_direction = 'increased'
        sol_percent = pround(((solchange - 1) * 100), 2) + '%'
        if (pround(((solchange - 1) * 100), 2) > 3) { sol_significant = true }
      }
      if (solchange < 1) {
        sol_direction = 'decreased'
        sol_percent = pround((Math.abs((solchange - 1)) * 100), 2) + '%'
        if (pround(((Math.abs((solchange - 1)) * 100), 2)) > 3) { sol_significant = true }
      }
      if (solchange === 1) {
        sol_direction = 'unchanged'
        sol_percent = '0%'
      }

      //calculate FP snapshot change
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

      //calculate 3d fp change
      var fp_3dchangecalc = fpoutput[0] / fp_3daverage
      var fp_3dchangeAmt = pround(Math.abs(fp_3daverage - fpoutput[0]), 2)
      amount_3dchange = fp_3dchangeAmt

      if (fp_3dchangecalc > 1) {
        fp_3dchange = '+' + pround(((fp_3dchangecalc - 1) * 100), 2) + '% (' + fp_3dchangeAmt + ' SOL)'
        symbol_3dchange = '+'
        percentage_3dchange = pround(((fp_3dchangecalc - 1) * 100), 2)
      }
      if (fp_3dchangecalc < 1) {
        fp_3dchange = '-' + pround((Math.abs((fp_3dchangecalc - 1)) * 100), 2) + '% (' + fp_3dchangeAmt + ' SOL)'
        symbol_3dchange = '-'
        percentage_3dchange = pround((Math.abs((fp_3dchangecalc - 1)) * 100), 2)
      }
      if (fp_3dchangecalc === 1) {
        fp_3dchange = '+0%'
        symbol_3dchange = '+'
      }

      //if there had been significant change to fp
      if (fp_significant === true) {

        if (fp_direction === 'increased') {

          if (sol_significant === true) {

            if (sol_direction === 'increased') {
              collection_12h_strength = '↗️ Strong. FP +' + fp_percent + ' | SOL/USD +' + sol_percent
              strengthemoji = "↗️"
              strengthdescription = "Strong"
              fpsymbol = "+"
              solsymbol = "+"
            }
            if (sol_direction === 'decreased') {
              collection_12h_strength = '⬆️ Strong. FP +' + fp_percent + ' | SOL/USD -' + sol_percent
              strengthemoji = "⬆️"
              strengthdescription = "Strong"
              fpsymbol = "+"
              solsymbol = "-"
            }
          } else {
            //if no significant change to SOL (just FP increase). Sol change can be insignficantly plus, minus or unchanged
            if (sol_direction === 'decreased') { solsymbol = '-' } else { solsymbol = '+' }
            collection_12h_strength = '↗️ Strong. FP +' + fp_percent + ' | SOL/USD ' + solsymbol + sol_percent
            strengthemoji = "↗️"
            strengthdescription = "Strong"
            fpsymbol = "+"
          }
        }

        if (fp_direction === 'decreased') {
          if (sol_significant === true) {
            if (sol_direction === 'increased') {
              collection_12h_strength = '⬇️ Weak. FP -' + fp_percent + ' | SOL/USD +' + sol_percent
              strengthemoji = "⬇️"
              strengthdescription = "Weak"
              fpsymbol = "-"
              solsymbol = "+"
            }
            if (sol_direction === 'decreased') {
              collection_12h_strength = '↘️ Weak. FP -' + fp_percent + ' | SOL/USD -' + sol_percent
              strengthemoji = "↘️"
              strengthdescription = "Weak"
              fpsymbol = "-"
              solsymbol = "-"
            }
          } else {
            //if no significant change to SOL (just FP decrease). Sol change can be insignficantly plus, minus or unchanged
            if (sol_direction === 'decreased') { solsymbol = '-' } else { solsymbol = '+' }
            collection_12h_strength = '↘️ Weak. FP -' + fp_percent + ' | SOL/USD ' + solsymbol + sol_percent
            strengthemoji = "↘️"
            strengthdescription = "Weak"
            fpsymbol = "-"
          }
        }
      }

      //if there had been significant change to sol
      if (sol_significant === true) {

        if (sol_direction === 'increased') {
          if (fp_significant === true) {
            if (fp_direction === 'increased') {
              collection_12h_strength = '↗️ Strong. FP +' + fp_percent + ' | SOL/USD +' + sol_percent
              strengthemoji = "↗️"
              strengthdescription = "Strong"
              fpsymbol = "+"
              solsymbol = "+"
            }
            if (fp_direction === 'decreased') {
              collection_12h_strength = '⬇️ Weak. FP -' + fp_percent + ' | SOL/USD +' + sol_percent
              strengthemoji = "⬇️"
              strengthdescription = "Weak"
              fpsymbol = "-"
              solsymbol = "+"
            }
          } else {
            //if significant change to SOL but no significant change to FP. FP change can be insignficantly plus, minus or unchanged
            if (fp_direction === 'decreased') { fpsymbol = '-' } else { fpsymbol = '+' }
            collection_12h_strength = '↘️ Weak. FP ' + fpsymbol + fp_percent + ' | SOL/USD +' + sol_percent
            strengthemoji = "↘️"
            strengthdescription = "Weak"
            solsymbol = "+"
          }
        }

        if (sol_direction === 'decreased') {
          if (fp_significant === true) {
            if (fp_direction === 'increased') {
              collection_12h_strength = '⬆️ Strong. FP +' + fp_percent + ' | SOL/USD -' + sol_percent
              strengthemoji = "⬆️"
              strengthdescription = "Strong"
              fpsymbol = "+"
              solsymbol = "-"
            }
            if (fp_direction === 'decreased') {
              collection_12h_strength = '↘️ Weak. FP -' + fp_percent + ' | SOL/USD -' + sol_percent
              strengthemoji = "↘️"
              strengthdescription = "Weak"
              fpsymbol = "-"
              solsymbol = "-"
            }
          } else {
            //if no significant change to SOL (just FP increase). Sol change can be insignficantly plus, minus or unchanged
            if (fp_direction === 'decreased') { fpsymbol = '-' } else { fpsymbol = '+' }
            collection_12h_strength = '↗️ Strong. FP ' + fpsymbol + fp_percent + ' | SOL/USD -' + sol_percent
            strengthemoji = '↗️'
            strengthdescription = 'Strong'
            solsymbol = "-"
          }
        }
      }

      //if no significant changes
      if (sol_significant === false && fp_significant === false) {

        if (sol_direction === 'decreased') { solsymbol = '-' } else { solsymbol = '+' }
        if (fp_direction === 'decreased') { fpsymbol = '-' } else { fpsymbol = '+' }

        collection_12h_strength = '➡️ Stable. FP ' + fpsymbol + fp_percent + ' | SOL/USD price ' + solsymbol + sol_percent + '.'
        strengthemoji = '➡️'
        strengthdescription = 'Stable'

      }
    }//if output length > 5

    //if we have 7 days data
    if (soloutput.length > 13 && fpoutput.length > 13) {

      var fp_7dchangecalc = fpoutput[0] / fp_7daverage
      var fp_7dchangeAmt = pround(Math.abs(fp_7daverage - fpoutput[0]), 2)
      amount_7dchange = fp_7dchangeAmt

      if (fp_7dchangecalc > 1) {
        fp_7dchange = '+' + pround(((fp_7dchangecalc - 1) * 100), 2) + '% (' + fp_7dchangeAmt + ' SOL)'
        symbol_7dchange = '+'
        percentage_7dchange = pround(((fp_7dchangecalc - 1) * 100), 2)
      }
      if (fp_7dchangecalc < 1) {
        fp_7dchange = '-' + pround((Math.abs((fp_7dchangecalc - 1)) * 100), 2) + '% (' + fp_7dchangeAmt + ' SOL)'
        symbol_7dchange = '-'
        percentage_7dchange = pround((Math.abs((fp_7dchangecalc - 1)) * 100), 2)
      }
      if (fp_7dchangecalc === 1) {
        fp_7dchange = '+0%'
        symbol_7dchange = '+'
      }
    }

    w.log.info('Collection strength for ' + collections[i].meslug + ' is: ' + collection_12h_strength + " FP history is: " + fpoutput.toString() + ". SOL history is: " + soloutput.toString() + ". 3d FP AVG is: " + fp_3daverage + ". Today\'s change on 3d AVG FP is: " + fp_3dchange)

    var dbstore = {}
    dbstore['fp_history'] = fpoutput
    dbstore['sol_history'] = soloutput

    dbstore['collection_12h_strength'] = collection_12h_strength

    //new strength
    dbstore['strength'] = {}
    dbstore.strength['strength_ready'] = strength_ready
    dbstore.strength['emoji'] = strengthemoji
    dbstore.strength['description'] = strengthdescription
    dbstore.strength['fp_symbol'] = fpsymbol
    dbstore.strength['fp_percent'] = fp_percent
    dbstore.strength['sol_symbol'] = solsymbol
    dbstore.strength['sol_percent'] = sol_percent
    //

    //new 3d change
    dbstore['threeDayChange'] = {}
    dbstore.threeDayChange['symbol_3dchange'] = symbol_3dchange
    dbstore.threeDayChange['percentage_3dchange'] = percentage_3dchange
    dbstore.threeDayChange['amount_3dchange'] = amount_3dchange
    //

    //new 7d change
    dbstore['sevenDayChange'] = {}
    dbstore.sevenDayChange['symbol_7dchange'] = symbol_7dchange
    dbstore.sevenDayChange['percentage_7dchange'] = percentage_7dchange
    dbstore.sevenDayChange['amount_7dchange'] = amount_7dchange
    //

    //if there has been enough data to calculate 7D averages for this collection, store it. Else store N\A
    if (fp_3daverage != 0) {
      dbstore['fp_3daverage'] = pround(fp_3daverage, 2)
    } else {
      dbstore['fp_3daverage'] = "N\\A"
    }
    if (sol_3daverage != 0) {
      dbstore['sol_3daverage'] = pround(sol_3daverage, 2)
    } else {
      dbstore['sol_3daverage'] = "N\\A"
    }
    //this defaults to 'not enough data' string if it cant be populated. No need to recheck here
    dbstore['fp_3dchange'] = fp_3dchange

    //if there has been enough data to calculate 7D averages for this collection, store it. Else store N\A
    if (fp_7daverage != 0) {
      dbstore['fp_7daverage'] = pround(fp_7daverage, 2)
    } else {
      dbstore['fp_7daverage'] = 'N\\A'
    }
    if (sol_7daverage != 0) {
      dbstore['sol_7daverage'] = pround(sol_7daverage, 2)
    } else {
      dbstore['sol_7daverage'] = "N\\A"
    }
    //this defaults to 'not enough data' string if it cant be populated. No need to recheck here
    dbstore['fp_7dchange'] = fp_7dchange

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
