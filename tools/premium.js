const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


async function updatePremium(serverid, days){
  var sqlpremium = await sql.getPremiumExpiry(serverid)
  w.log.info('sqlpremium is:' + sqlpremium)
  if (sqlpremium) {
    w.log.info('There was an exisiting expiry time')
    var premiumexpire = new Date()
    premiumexpire.setDate(premiumexpire.getDate() + days).toISOString()
    w.log.info('premiumexpire is: ' + premiumexpire) 
//await sql.updateTableColumn('servers', 'serverid', serverid, 'premiumexpire', newexpiry)
  
    
  } else {
    w.log.info('There was no existing expiry time')
    var premiumexpire = new Date()
    premiumexpire.setDate(premiumexpire.getDate() + days).toISOString()
    w.log.info('premiumexpire is: ' + premiumexpire)
    //await sql.updateTableColumn('servers', 'serverid', serverid, 'premiumexpire', expirydate)
  }
  
} module.exports.update = updatePremium
