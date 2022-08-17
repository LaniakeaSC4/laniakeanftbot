/*
This file is for functions which connect to the postgress database

Postgress client established and connected in pgclint.js

If postgress client is already established and connected, it's returned.
Otherwise, a new clinet is established and connected, then returned.

Get the connected client in each function with - var pgclient = db.getClient()
Then query databse with - pgclient.query()
*/
var db = require('./pgclient.js')

/*enable if needed and edit query
async function createTable() {
  var pgclient = db.getClient()
  return new Promise((resolve, reject) => {
    //add supported collections from postgressDB to the slash command
    pgclient.query('CREATE TABLE solanametaplex(collection_id TEXT PRIMARY KEY, data JSONB)', (err, res) => {
      if (err) throw err
      resolve()
    })//end query
  })
};module.exports.createTable = createTable*/

async function getPostgresCollectionSize(collectionID) {
  var pgclient = db.getClient()
  return new Promise((resolve, reject) => {
    var querystring = "SELECT COUNT(*) FROM (SELECT jsonb_path_query(data, '$.result.data.items[*]') FROM howraredata WHERE collection_id = '" + collectionID + "') AS nftcount"
    console.log(querystring)
    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      console.log('I am in another file')
      resolve(res.rows[0].count)
    })//end query
  })//end promise
}//end getPostgresCollectionSize

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
}//end getPosrgresNFTproperties

async function getColletionList() {
  var pgclient = db.getClient()
  return new Promise((resolve, reject) => {
    //add supported collections from postgressDB to the slash command
    var collectionlist = []
    pgclient.query('SELECT collection_id FROM howraredata', (err, res) => {
      if (err) throw err
      //console.log(res.rows)
      for (var i = 0; i < res.rows.length; i++) {
        collectionlist.push(res.rows[i].collection_id)
      }//end for each row
      resolve(collectionlist)
    })//end query
  })
}

async function addHowRareCollection(thisdata, collectionstring) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()
    if (thisdata.result.api_code === 200) {
      console.log('Recieved collection: ' + thisdata.result.data.collection + 'from howrare.is with status code:' + thisdata.result.api_code + '. Ready to add to SQL')

      var querystring = 'INSERT INTO howraredata( collection_ID, data, created_on, last_updated ) VALUES ( $1,$2,to_timestamp($3 / 1000.0),to_timestamp($4 / 1000.0) ) ON CONFLICT (collection_ID) DO NOTHING'
      var querydata = [collectionstring, thisdata, Date.now(), Date.now()]

      pgclient.query(querystring, querydata, (err, res) => {
        if (err) throw err
        resolve('success')
      })
    } else { console.log('Error: collection ' + collectionstring + ' returned status code ' + thisdata.result.api_code + ' from howrare.is.'); resolve('fail') }
  })
}

async function removeHowRareCollection(collectionstring) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()


    var querystring = 'DELETE FROM howraredata WHERE collection_id = $1'
    var querydata = [collectionstring]

    pgclient.query(querystring, querydata, (err, res) => {
      if (err) throw err
      console.log('logging result')
      console.log(res)
      resolve('success')
    })

  })
}

//creates a table row and adds data to one column
async function createTableRow(table, tableprimarykey, thisprimarykey, column, data) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = 'INSERT INTO ' + table + '( ' + tableprimarykey + ', '+ column + ' ) VALUES ( $1, $2 ) ON CONFLICT ('+ tableprimarykey + ') DO NOTHING'
    var querydata = [thisprimarykey, data]

    pgclient.query(querystring, querydata, (err, res) => {
      if (err) throw err
      resolve('success')
    })
  })
};module.exports.createTableRow = createTableRow

//adds data to a column
async function updateTableColumn(table, tableprimarykey, thisprimarykey, column, data) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    //update this table to add this data to this column where this key matches the table's primary key
    var querystring = 'UPDATE ' + table + ' SET '+ column + ' = $1 WHERE '+ tableprimarykey + ' = '+ thisprimarykey
    var querydata = [data]

    pgclient.query(querystring, querydata, (err, res) => {
      if (err) throw err
      resolve('success')
    })
  })
};module.exports.updateTableColumn = updateTableColumn

//generic get data from table
async function getData(table, tableprimarykey, thisprimarykey, column) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = "SELECT "+ column + " FROM " + table + " WHERE " + tableprimarykey + " = '" + thisprimarykey + "'"
    
      console.log(querystring)

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      console.log(res.rows[0][column][0])
      resolve(res.rows[0][column][0])
    })
  })
};module.exports.getData = getData

module.exports.getCollectionSize = getPostgresCollectionSize
module.exports.getNFTproperties = getPosrgresNFTproperties
module.exports.getColletionList = getColletionList
module.exports.addHowRarecollection = addHowRareCollection
module.exports.removeHowRareCollection = removeHowRareCollection
