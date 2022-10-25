const w = require('./winston.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

Date.prototype.addDays = function (d) {
  this.setTime(this.getTime() + (d * 24 * 60 * 60 * 1000));
  return this;
}

//function to get (or add) an expiry time to sql database
async function updatePremium(serverid, days, interaction) {
  if (days > 0) {//only want to add a positive number of days
    var sqltime = await getPremiumExpiry(serverid)//get current expirey time. getPremiumExpiry() parses sql result to JS acceptable string
    if (sqltime != "null") {//there was an exisiting time (sql function makes null result a string)
      var today = new Date()//get today's date
      var expiretime = new Date(sqltime)
      if (expiretime < today) {//if sqltime has already passed, start new premium days from today
        var premiumexpire = new Date()//get todays date
        premiumexpire.addDays(days)//add x days to today
        premiumexpire.toISOString()//convert to ISO string to save in SQL
        w.log.info("Updating premium expiry for " + serverid + ". There was an exisiting lapsed expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")")
        await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", premiumexpire)
        await sql.updateTableColumn("servers", "serverid", serverid, "premium", true)//set premium to true since we are adding premium days
        interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")", ephemeral: true })
      } else {//if sql time has not already passed/expired add days to it and store it
        expiretime.addDays(days)//add days to exisiting premiumexpire
        expiretime.toISOString()//convert to ISO string to save in sql
        w.log.info("Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + expiretime)
        await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", expiretime)//save
        await sql.updateTableColumn("servers", "serverid", serverid, "premium", true)//premium should already be true, but let's be sure
        interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was an exisiting expiry time " + sqltime + " and it has been updated to " + expiretime, ephemeral: true })
      }//end else
    } else {//if there wasnt an exisiting time, establish one
      var premiumexpire = new Date()//get todays date
      premiumexpire.addDays(days)//add x days to today
      premiumexpire.toISOString()//convert to ISO string to save in SQL
      w.log.info("Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")")
      await sql.updateTableColumn("servers", "serverid", serverid, "premiumexpire", premiumexpire)
      await sql.updateTableColumn("servers", "serverid", serverid, "premium", true)
      interaction.reply({ content: "Updating premium expiry for " + serverid + ". There was not an exisiting expiry time, so expiry has been set to today plus " + days + " days (" + premiumexpire + ")", ephemeral: true })
    }//end else if no exisiting expiry time
  } else { return null }//return null if 0 days (or negative days) was specified
} module.exports.update = updatePremium

//preiodic cron function to check if servers are still premium and if not, expire them
async function validateServers() {
  var supportedservers = await getServerPremiumStatus()//get current server status
  for (i = 0; i < supportedservers.length; i++) {//for each server
    if (supportedservers[i].premiumexpire) {//if not null (there is an exipry set)
      supportedservers[i].premiumexpire = JSON.stringify(supportedservers[i].premiumexpire).replaceAll('\"', '')//make retrieved date JS friendly
      var expiretime = new Date(supportedservers[i].premiumexpire)
      var now = new Date()//today/now
      if (expiretime < now) {//if expriretime has passed
        if (supportedservers[i].premium === true) {//if server is still premium despite expire time having passed
          w.log.info('Server: ' + supportedservers[i].servername + '\'s premium has just expired. Setting premium status to false.')
          await sql.updateTableColumn("servers", "serverid", supportedservers[i].serverid, "premium", false)
        } else { w.log.info('Server: ' + supportedservers[i].servername + 'is not premium today.') }
      } else {//expire time hasnt passed
        w.log.info(supportedservers[i].servername + ' is still premium. It will expire on: ' + expiretime)
      }//end else expire time hasnt passed
    } else {//if there was no expiry at all for this server, let's set it to today so field isn't empty
      var newpremiumexpire = new Date()//get todays date
      newpremiumexpire.toISOString()//convert to ISO string to save in SQL
      w.log.info('Server: ' + supportedservers[i].servername + 'had no premium expiry time in sql setting it to now so sql is not null.')
      await sql.updateTableColumn("servers", "serverid", supportedservers[i].serverid, "premiumexpire", newpremiumexpire)
    }//end else if there was no expire time
  }//end for each server
} module.exports.validateServers = validateServers 

var db = require('../clients/pgclient.js')
//get premium expiry time of a particular server
async function getPremiumExpiry(serverid) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = "SELECT premiumexpire FROM servers WHERE serverid = \'" + serverid + "\'"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(JSON.stringify(res.rows[0].premiumexpire).replaceAll('\"', ''))//processed so can be used in JS new Date()
    })//end query
  })//end promise 
}

//used by cron job when checking if preium expiry times have passed
async function getServerPremiumStatus() {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = "SELECT serverid,premium,premiumexpire,servername FROM servers WHERE inserver = true"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows)//returned times are unprocessed for JS will need to use .replaceAll('\"', '')) before can be converted to JS date
    }) //end query
  }) //end promise
}