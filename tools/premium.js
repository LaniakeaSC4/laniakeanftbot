const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

Date.prototype.addDays = function(d) {
  this.setTime(this.getTime() + (d*24*60*60*1000));
  return this;
}

//function to get (or add) an expiry time to sql database
async function updatePremium(serverid, days, interaction) {
  if (days > 0) {
    var sqltime = await sql.getPremiumExpiry(serverid)
    w.log.info(sqltime)
    if (sqltime != "null") {//there was an exisiting time (sql function makes null result a string)
      var newtime = new Date(sqltime)
      newtime.addDays(days)//add days to exisiting premiumexpire
      newtime.toISOString()//convert to ISO string to save in sql
      w.log.info("Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + newtime)
      await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", newtime)//save
      interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + newtime, ephemeral: true })
    } else {//if there wasnt an exisiting time, establish one
      var premiumexpire = new Date()//get todays date
      premiumexpire.addDays(days)//add x days to today
      premiumexpire.toISOString()//convert to ISO string to save in SQL
      w.log.info("Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")")
      w.log.info('5')
      await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", premiumexpire)
      interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")", ephemeral: true })
      //probably want to set premium = true here also

    }//end else if no exisiting expiry time
  } else { return null }
} module.exports.update = updatePremium
