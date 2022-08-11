var pg = require('pg')
var client

module.exports = {
    getClient: function () {
      if (client) return client; // if it is already there, grab it here
      client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
}) 
      return client;
}
} 
