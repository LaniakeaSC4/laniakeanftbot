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

module.exports.getPostgresCollectionSize = getPostgresCollectionSize
