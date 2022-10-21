var db = require('../clients/pgclient.js')
const sql = require('./commonSQL.js')//common sql related commands are in here
const w = require('./winston.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const magiceden = require('./magicedenRPC.js')//Magic Eden related commands are in here

async function getCurrentFP() {

//get meslugs
var meslugs = await getCollectionAverages()

for (i = 0;i < meslugs.length;i++){

  var thisfp = await magiceden.getFloorPrice(meslugs[i].meslug)
    w.log.info('Floor price for collection ' + meslugs[i].meslug+ ' is ' + thisfp)
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