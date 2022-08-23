/* Creates connection to postgress DB and returns that connected client to a function that needs it */

var pg = require('pg')
var pgclient

module.exports = {
  getClient: function () {
    if (pgclient) return pgclient; // if it is already there, grab it here
    pgclient = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    pgclient.connect()
    return pgclient
  }//end function
}//end export
