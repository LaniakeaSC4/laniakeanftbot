const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

Date.prototype.addDays = function (d) {
  this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
  return this;
}

//function to get (or add) an expiry time to sql database
async function updatePremium(serverid, days, interaction) {
  if (days > 0) {
    var sqltime = await sql.getPremiumExpiry(serverid)
    w.log.info(sqltime)
    if (sqltime != "null") {//there was an exisiting time (sql function makes null result a string)
      var today = new Date()
      var expiretime = new Date(sqltime)
      if (expiretime < today) {//if sqltime has already passed, start new premium days from today
        var premiumexpire = new Date()//get todays date
        premiumexpire.addDays(days)//add x days to today
        premiumexpire.toISOString()//convert to ISO string to save in SQL
        w.log.info("Updating premium expiry for " + serverid + ". There was an exisiting lapsed expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")")
        await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", premiumexpire)
        interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")", ephemeral: true })
      }
      else {
        expiretime.addDays(days)//add days to exisiting premiumexpire
        expiretime.toISOString()//convert to ISO string to save in sql
        w.log.info("Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + expiretime)
        await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", expiretime)//save
        interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + expiretime, ephemeral: true })
      }
    } else {//if there wasnt an exisiting time, establish one
      var premiumexpire = new Date()//get todays date
      premiumexpire.addDays(days)//add x days to today
      premiumexpire.toISOString()//convert to ISO string to save in SQL
      w.log.info("Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")")
      await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", premiumexpire)
      interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")", ephemeral: true })
      //probably want to set premium = true here also

    }//end else if no exisiting expiry time
  } else { return null }
} module.exports.update = updatePremium

async function validateServers() {
  var supportedservers = await sql.getServerPremiumStatus()
  for (i = 0; i < supportedservers.length; i++) {
    if (supportedservers[i].premiumexpire) {//if not null (there is an exipry set)
      supportedservers[i].premiumexpire = JSON.stringify(supportedservers[i].premiumexpire).replaceAll('\"', '')
      var now = new Date()
      var expiretime = new Date(supportedservers[i].premiumexpire)
      w.log.info(supportedservers[i].serverid + ': now is ' + now + '. expiretime is ' + expiretime + '. supportedservers[i].premiumexpire is: ' + supportedservers[i].premiumexpire)
      if (expiretime < now) {
        if (supportedservers[i].premium === true) {
          w.log.info('Server: ' + supportedservers[i].serverid + '\'s premium has just expired. Setting premium status to false.')
          await sql.updateTableColumn("servers", "serverid", supportedservers[i].serverid, "premium", false)
        }
      } else {
        w.log.info(supportedservers[i].serverid + ' is still premium. It will expire on: ' + expiretime)
      }
    } else {//if there was no expiry at all for this server, let's set it to today so field isn't empty
    var newpremiumexpire = new Date()//get todays date
      newpremiumexpire.toISOString()//convert to ISO string to save in SQL
      w.log.info('Server: ' + supportedservers[i].serverid + 'had no premium expiry time in sql setting it to now so sql is not null.')
      await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", newpremiumexpire)
    } 
  }
} module.exports.validateServers = validateServers 
