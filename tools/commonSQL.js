/*
This file is for functions which connect to the sql database

Postgress client established and connected in pgclint.js

If postgress client is already established and connected, it's returned.
Otherwise, a new clinet is established and connected, then returned.

Get the connected client in each function with - var pgclient = db.getClient()
Then query databse with - pgclient.query()
*/
var db = require('../clients/pgclient.js')

/*enable if needed and edit query
async function createTable() {
  var pgclient = db.getClient()
  return new Promise((resolve, reject) => {
    //add supported collections from sqlDB to the slash command
    pgclient.query('CREATE TABLE solanametaplex(collection_id TEXT PRIMARY KEY, data JSONB)', (err, res) => {
      if (err) throw err
      resolve()
    })//end query
  })
};module.exports.createTable = createTable*/

//get the number of items (NFTs) in the local howrare.is data. This becomes collection size, used for determining rarity thresholds.
async function getSQLCollectionSize(collectionID) {
  var pgclient = db.getClient()
  return new Promise((resolve, reject) => {
    var querystring = "SELECT COUNT(*) FROM (SELECT jsonb_path_query(data, '$.result.data.items[*]') FROM howraredata WHERE collection_id = '" + collectionID + "') AS nftcount"
    console.log(querystring)
    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows[0].count)//return count of rows (number of NFTs)
    })//end query
  })//end promise
}; module.exports.getCollectionSize = getSQLCollectionSize

//get NFT properties (rarity, name, image) from local howrare.is data.
async function getPosrgresNFTproperties(collectionstring, nftid) {
  var pgclient = db.getClient()
  return new Promise((resolve, reject) => {
    var querystring = "SELECT jsonb_path_query_first(data #> '{result,data,items}', '$[*] ? (@.id == " + nftid + " || @.id == \"" + nftid + "\")') AS result FROM howraredata WHERE  collection_id = '" + collectionstring + "' "
    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      if (res.rows[0].result != null) {
        var thisnftrarity = res.rows[0].result.all_ranks.statistical_rarity
        var thisnftname = res.rows[0].result.name
        var thisnftimage = res.rows[0].result.image
        resolve([thisnftrarity, thisnftname, thisnftimage])
      } else {
        resolve('NFT not in collection')
      }//end else
    })//end query
  })//end promise
}; module.exports.getNFTproperties = getPosrgresNFTproperties

//get list of all collections we have locally saved from howrare.is. collection_id is a string from the URL of the collection.
async function getColletionList() {
  var pgclient = db.getClient()
  return new Promise((resolve, reject) => {
    //add supported collections from sqlDB to the slash command
    var collectionlist = []
    pgclient.query('SELECT collection_id FROM howraredata', (err, res) => {
      if (err) throw err
      for (var i = 0; i < res.rows.length; i++) {//loop through results and push to collectionlist
        collectionlist.push(res.rows[i].collection_id)
      }//end for each row
      resolve(collectionlist)
    })//end query
  })//end promise
}; module.exports.getColletionList = getColletionList

async function addHowRareCollection(thisdata, collectionstring) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()
    if (thisdata.result.api_code === 200) {//function recieves data blob acquired from howrare. Check if HTTP status was 200
      console.log('Recieved collection: ' + thisdata.result.data.collection + 'from howrare.is with status code:' + thisdata.result.api_code + '. Ready to add to DB')

      //inset into howraredata table, adding a created on and updated date. If already exists, do nothing
      var querystring = 'INSERT INTO howraredata( collection_ID, data, created_on, last_updated ) VALUES ( $1,$2,to_timestamp($3 / 1000.0),to_timestamp($4 / 1000.0) ) ON CONFLICT (collection_ID) DO NOTHING'
      var querydata = [collectionstring, thisdata, Date.now(), Date.now()]

      pgclient.query(querystring, querydata, (err, res) => {
        if (err) throw err
        resolve('success')//return a string 'success' if all worked.
      })//end query
    } else { console.log('Error: collection ' + collectionstring + ' returned status code ' + thisdata.result.api_code + ' from howrare.is.'); resolve('fail')/* Status code wasnt 200 */ }
  })//end promise
}; module.exports.addHowRarecollection = addHowRareCollection

//remove howrare data. Can also be done direct in PG
async function removeHowRareCollection(collectionstring) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = 'DELETE FROM howraredata WHERE collection_id = $1'
    var querydata = [collectionstring]

    pgclient.query(querystring, querydata, (err, res) => {
      if (err) throw err
      resolve('success')//resolve success if this worked.
    })//end query
  })//end promise
}; module.exports.removeHowRareCollection = removeHowRareCollection

//creates a table row and adds data to one column - use if row dosent already exist
async function createTableRow(table, tableprimarykey, thisprimarykey, column, data) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //insert into thistable a new row with primary key data into primary key column plus thisdata into thiscolumn
    var querystring = 'INSERT INTO ' + table + '( ' + tableprimarykey + ', ' + column + ' ) VALUES ( $1, $2 ) ON CONFLICT (' + tableprimarykey + ') DO NOTHING'
    var querydata = [thisprimarykey, data]

    pgclient.query(querystring, querydata, (err, res) => {
      if (err) throw err
      resolve('success')
    })//end query
  })//end promise
}; module.exports.createTableRow = createTableRow

//adds data to a column in an existing row
async function updateTableColumn(table, tableprimarykey, thisprimarykey, column, data) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //update this table to add this data to this column where this key matches the table's primary key
    var querystring = "UPDATE " + table + " SET " + column + " = $1 WHERE " + tableprimarykey + " = '" + thisprimarykey + "'"
    var querydata = [data]

    pgclient.query(querystring, querydata, (err, res) => {
      if (err) throw err
      resolve('success')
    })//end query
  })//end promise
}; module.exports.updateTableColumn = updateTableColumn

//generic get data from table
async function getData(table, tableprimarykey, thisprimarykey, column) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //select the data in this column for a row which has this primary key
    var querystring = "SELECT " + column + " FROM " + table + " WHERE " + tableprimarykey + " = '" + thisprimarykey + "'"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows[0][column])//rows[0] because single result expected. Data from this particular column is at rows[0][column]
    })//end query
  })//end promise
}; module.exports.getData = getData

//generic delete column data from table
async function deleteColumnData(table, tableprimarykey, thisprimarykey, column) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //select the data in this column for a row which has this primary key
    var querystring = "UPDATE " + table + " SET " + column + " = null WHERE " + tableprimarykey + " = '" + thisprimarykey + "'"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve('success')//rows[0] because single result expected. Data from this particular column is at rows[0][column]
    })//end query
  })//end promise
}; module.exports.deleteColumnData = deleteColumnData

//get a particular column for all rows
async function getRowsForColumn(table, column) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //select the data in this column for a row which has this primary key
    var querystring = "SELECT " + column + " FROM " + table

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows)
    }) //end query
  }) //end promise
};
module.exports.getRowsForColumn = getRowsForColumn

//get a particular column for all rows
async function getSupportedCollections() {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //select the data in this column for a row which has this primary key
    var querystring = "SELECT collectionkey, collectioncount, meslug FROM \"solanametaplex\""

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows)
    }) //end query
  }) //end promise
};module.exports.getSupportedCollections = getSupportedCollections

//get collectionKeys for supported collections
async function getOurMetaplexCollections() {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = "SELECT jsonb_path_query_first(finaldata, '$.collectionKey') FROM solanametaplex"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows)
    })//end query
  })//end promise
}; module.exports.getOurMetaplexCollections = getOurMetaplexCollections

//get verified creator address from collection key
async function getVerifiedCreator(collectionKey) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = "SELECT jsonb_path_query_first(finaldata, '$.verifiedCreator') AS verifiedCreator FROM solanametaplex WHERE jsonb_path_exists(finaldata, '$.collectionKey ? (@[*] == \"" + collectionKey + "\")')"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows[0])
    })//end query
  })//end promise
}; module.exports.getVerifiedCreator = getVerifiedCreator

//get whole NFT collection by collectionKey
async function getAllNFTdata(collectionKey) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = "SELECT jsonb_path_query_first(finaldata, '$.data') AS NFTdata FROM solanametaplex WHERE jsonb_path_exists(finaldata, '$.collectionKey ? (@[*] == \"" + collectionKey + "\")')"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows[0])
    })//end query
  })//end promise
}; module.exports.getAllNFTdata = getAllNFTdata

//get a single NFT collection by collectionKey and NFT ID
async function getNFTdata(collectionKey, nftid) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = 'SELECT jsonb_path_query_first(finaldata, \'$.data[*] ? (@.nftid == ' + parseFloat(nftid) + ' || @.nftid == "' + nftid + '")\') AS nftdata FROM solanametaplex WHERE collectionkey = \'' + collectionKey + '\''

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows[0]['nftdata'])
    })//end query
  })//end promise
}; module.exports.getNFTdata = getNFTdata

//get sniper channels for a particualr server ID
async function getSniperChannels(serverid) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = "SELECT snipecategory,raresnipes,epicsnipes,legenradysnipes,mythicsnipes FROM servers WHERE serverid = '"+ serverid + "'"

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows)
    })//end query
  })//end promise
}; module.exports.getSniperChannels = getSniperChannels
