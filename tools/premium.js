const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


async function updatePremium(serverid, days){
  
  var sqltime = await sql.getPremiumExpiry(serverid)
  
  w.log.info('sql time is' + sqltime)
  var oldtime = new Date(sqltime.replace(' ', 'T'))
  var add = new Date()
  
  add.setDate(oldtime.getDate() + days)
  var newtime = add.toISOString()
  
  w.log.info('new premiumexpire is: ' + newtime)
  await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", newtime) 
  
  
  /* put time
    var now = new Date()
    var add = new Date()
    
    add.setDate(now.getDate() + days)
    var premiumexpire = add.toISOString()
    
    w.log.info('premiumexpire is: ' + premiumexpire)
  await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", premiumexpire) 
*/
  
  
} module.exports.update = updatePremium
