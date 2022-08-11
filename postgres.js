var db = require('./pgclient.js');

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

module.exports.getCollectionSize = getPostgresCollectionSize
module.exports.getNFTproperties = getPosrgresNFTproperties
