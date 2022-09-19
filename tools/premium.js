const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


async function updatePremium(serverid, days){
    var now = new Date()
    var premiumexpire = new Date()
    
    premiumexpire.setDate(now.getDate() + days)
    
    w.log.info('premiumexpire is: ' + premiumexpire)
  await sql.setPremiumExpiry(serverid, premiumexpire)

  
  
} module.exports.update = updatePremium
