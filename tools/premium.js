const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

//function to get (or add) an expiry time to sql database
async function updatePremium(serverid, days, interaction) {
  if (days > 0) {
    var sqltime = await sql.getPremiumExpiry(serverid)
    if (sqltime) {//there was an exisiting time
      var oldtime = new Date(sqltime)//turn ISO8601 into JS Date
      var add = new Date()//case add as date to be used for calculations
      var newtime = new Date()
      add.setDate(oldtime.getDate() + days)//add days to exisiting premiumexpire
      newtime = add.toISOString()//convert to ISO string to save in sql
      w.log.info("Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + newtime)
      await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", newtime)//save
      interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + newtime, ephemeral: true })
    } else {//if there wasnt an exisiting time, establish one
      var now = new Date()//get todays date
      var add = new Date()//cast var to be used for calculations
      add.setDays(now.getDays() + days)//add x days to today
      var premiumexpire = add.toISOString()//convert to ISO string to save in SQL
      w.log.info("Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")")
      await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", premiumexpire)
      interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")", ephemeral: true })
      //probably want to set premium = true here also

    }//end else if no exisiting expiry time
  } else { return null }
} module.exports.update = updatePremium
