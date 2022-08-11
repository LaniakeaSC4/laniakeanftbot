var pg = require('pg')
var client

module.exports = {
  getClient: function () {
    console.log('checking if we need to return PG client')
    if (client) return client; // if it is already there, grab it here
    console.log('building new client')
    client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    console.log('connecting client')
    client.connect()
    console.log('returning clinet')
    return client;
  }
} 
