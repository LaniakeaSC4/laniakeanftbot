async function getPostgresCollectionSize(collectionID) {
  return new Promise((resolve, reject) => {
    var querystring = "SELECT COUNT(*) FROM (SELECT jsonb_path_query(data, '$.result.data.items[*]') FROM howraredata WHERE collection_id = '" + collectionID + "') AS nftcount"
    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows[0].count)
    })//end query
  })//end promise
}//end getPostgresCollectionSize

module.exports.getPostgresCollectionSize = getPostgresCollectionSize
