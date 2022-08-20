/* this block is for https://github.com/metaplex-foundation/js/ @metaplex-foundation/js */
/* Gets all NFTs by verified creator address from quiknode (private RPC), then completes metadata (also via quiknode), then saves to DB*/

const { Metaplex, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const { Connection, clusterApiUrl, Keypair, PublicKey } = require("@solana/web3.js")
const postgress = require('./postgres.js')//postgress related commands are in here
var db = require('./pgclient.js')//the PG client
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function getMetaplexData(creator) {
  //establish connection
  const connection = new Connection(process.env.QUICKNODE)
  const wallet = Keypair.generate()
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage())

  var creatorkey = new PublicKey(creator)//make the verified creator address into a public key

  console.log('Metaplex: getting metadata from RPC - should take about 1 minute per 100 NFTs in collection')
  const metadata = await metaplex.nfts().findAllByCreator({ "creator": creatorkey }).run()

  console.log('Metaplex: adding NFT JSON to the ' + metadata.length + ' NFTs we recieved - 1 API request per 50ms')
  var withjson = { "data": [] }
  var heartbeat = 0
  for (var i = 0; i < metadata.length; i++) {
    var thisnft = await metaplex.nfts().load({ "metadata": metadata[i] }).run()
    withjson.data.push(thisnft)
    heartbeat = heartbeat + 1
    if ((heartbeat % 50) == 0) {console.log('I\'ve sent ' + heartbeat + ' json load requests')} 
    await wait(50)//wait to slow API requests.
  }//end for each NFT metadata

  console.log('Metaplex: storing metaplex data in DB')
  await postgress.createTableRow("solanametaplex", "creatoraddress", creator, "withmeta", JSON.stringify(withjson))
}; module.exports.getMetaplexData = getMetaplexData

//gets the metaplex data and caculates the percentages of each trait. Stores as seperate object in DB
async function calculateTraitPercentages(creatoraddress) {

  console.log('Metaplex: Calculating trait percentages')
  const metaplexdata = await postgress.getData("solanametaplex", "creatoraddress", creatoraddress, "withmeta")//get data from DB
  var traitPercentages = {}//establish output object

  for (var i = 0; i < metaplexdata.data.length; i++) {//for each nft in the metaplex data
    for (var j = 0; j < metaplexdata.data[i].json.attributes.length; j++) { //for each attribute of this NFT
      var maintype = metaplexdata.data[i].json.attributes[j].trait_type.replace(/[^0-9a-z]/gi, '')//clean the key
      var subtype = metaplexdata.data[i].json.attributes[j].value.replace(/[^0-9a-z]/gi, '')//clean the key

      if (maintype in traitPercentages) {//if maintype is already a key in the object
        if (subtype in traitPercentages[maintype]) {//if maintype and subtype already exist, +1 to timesSeen and +1 to total count for that maintype
          traitPercentages[maintype][subtype]['timesSeen'] = traitPercentages[maintype][subtype]['timesSeen'] + 1
          traitPercentages[maintype]['totalcount'] = traitPercentages[maintype]['totalcount'] + 1
        } else {//maintype exists, but subtype does not. Create new subtype object and start at 1 timesSeen
          traitPercentages[maintype][subtype] = {}
          traitPercentages[maintype][subtype]['timesSeen'] = 1
          traitPercentages[maintype]['totalcount'] = traitPercentages[maintype]['totalcount'] + 1//maintype already existed, so we can add 1 to it
        }
      } else {//if maintype isnt already a key, subtype won't exist either first create the objects, then start at 1 timesSeen and totalcount
        traitPercentages[maintype] = {}
        traitPercentages[maintype][subtype] = {}
        traitPercentages[maintype][subtype]['timesSeen'] = 1
        traitPercentages[maintype]['totalcount'] = 1
      }//end else
    }//end for each trait
  }//end for each nft

  //work out percentages
  Object.keys(traitPercentages).forEach(maintype => {//for each maintype
    Object.keys(traitPercentages[maintype]).forEach(subtype => {//go into each subtype
      if (traitPercentages[maintype][subtype] != 'timesSeen') {//for all except the 'timesSeen' key
        traitPercentages[maintype][subtype]['percentage'] = traitPercentages[maintype][subtype]['timesSeen'] / traitPercentages[maintype]['totalcount']
      }//end if not 'timesSeen'
    })//end for each subtype
  })//end for each maintype

  //store in DB
  console.log('Metaplex: Storing trait percentages in DB')
  postgress.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "traitrarity", traitPercentages)
}; module.exports.calculateTraitPercentages = calculateTraitPercentages

//get the nft and trait % data from postgres (added with getMetaplexData) and calculate the statistical rarity of each nft
async function combineTraitRarity(creatoraddress) {

  console.log('Metaplex: Building final object with statistical rarity')
  var traitdata = {}; var nftdata = {}//establish objects

  //load NFT and trait data and 
  const loaddata = Promise.all([postgress.getData("solanametaplex", "creatoraddress", creatoraddress, "traitrarity"), postgress.getData("solanametaplex", "creatoraddress", creatoraddress, "withmeta")])
  try {
    const thisdata = await loaddata
    traitdata = thisdata[0]
    nftdata = thisdata[1]
  } catch (error) { console.log('Error getting data') }

  var output = { "data": [] }//establish output object

  //save some collection specific data into the top level of the output object
  output['collectionSymbol'] = nftdata.data[0].json.symbol
  output['verifiedCreator'] = creatoraddress
  output['totalNFTs'] = nftdata.data.length
  output['collectionCommonName'] = nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1))
  output['collectionKey'] = nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).replace(/[^0-9a-z]/gi, '')
  output['description'] = nftdata.data[0].json.description
  
  for (var i = 0; i < nftdata.data.length; i++) {//for each NFT
    var thesepercentages = []

    //add the percentage rarity of each attribute of this NFT to an arrary
    for (var j = 0; j < nftdata.data[0].json.attributes.length; j++) { //for each attribute
      //console.log(nftdata.data[i].json.attributes[j] )
      try {
        if (nftdata.data[i].json.attributes[j]) {
      var maintype = nftdata.data[i].json.attributes[j].trait_type.replace(/[^0-9a-z]/gi, '')
      var subtype = nftdata.data[i].json.attributes[j].value.replace(/[^0-9a-z]/gi, '')

      var thispercentage = traitdata[maintype][subtype]['percentage']
      thesepercentages.push(thispercentage)} else {throw 'var i = ' + i + ' var j = ' + j} 
      } catch(err) {
        console.log('Error finding traits: ' + err)
      }
    }//end for each attribute

    //multiply the percentages together to get statistical rarity
    var thisrarity = (parseFloat(thesepercentages[0])*10)//first % is the starting point (don't want 1 or 0)
    for (var k = 1; k < thesepercentages.length; k++) {//from k = 1
      thisrarity = thisrarity * (parseFloat(thesepercentages[k]) * 10)//multiplying percentage 10x so we don't loose any resolution off the right side
    }//end for percentages

    var tokenAddress = ''
    try { if (nftdata.data[i].address) { tokenAddress = nftdata.data[i].address } } catch { tokenAddress = 'not found' }

    var mintAuthorityAddress = ''
    try { if (nftdata.data[i].mint.mintAuthorityAddress) { mintAuthorityAddress = nftdata.data[i].mint.mintAuthorityAddress } } catch { mintAuthorityAddress = 'not found' }

    var collectionAddress = ''
    try { if (nftdata.data[i].collection.address) { collectionAddress = nftdata.data[i].collection.address } } catch { collectionAddress = 'not found' }

    var metadataAddress = ''
    try { if (nftdata.data[i].metadataAddress) { metadataAddress = nftdata.data[i].metadataAddress } } catch { metadataAddress = 'not found' }
    
    //get nft ID from name
            var thisnftid = 0
            let namearr = nftdata.data[i].json.name.split(' ')
            for (var m = 0; m < namearr.length; m++) {
              let checkthis = namearr[m]
              if (checkthis.includes('#')) {
                var nlength = checkthis.length
                thisnftid = parseFloat(checkthis.substring(1, nlength))
              }//end if
            }//end for

    //now store the NFT with this info into out output object
    output.data[i] = {
      "nftid": thisnftid,
      "name": nftdata.data[i].json.name,
      "statisticalRarity": thisrarity,
      "image": nftdata.data[i].json.image,
      "symbol": nftdata.data[i].json.symbol,
      "attributes": nftdata.data[i].json.attributes,
      "uri": nftdata.data[i].uri,
      "tokenAddress": tokenAddress,
      "mintAuthorityAddress": mintAuthorityAddress,
      "collectionAddress": collectionAddress,
      "metadataAddress": metadataAddress
    }//end output data load for this NFT
  }//end for each NFT
  //store new nft arrary in postgres
  console.log('Metaplex: Storing object with ' + output.data.length + ' NFTs + Statistical Rarity + collectionkey ' + nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).replace(/[^0-9a-z]/gi, ''))
  postgress.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "withrarity", output)
  postgress.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "collectionkey", nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).replace(/[^0-9a-z]/gi, '').toLowerCase())
}; module.exports.combineTraitRarity = combineTraitRarity

//get the unranked NFTs with statistical rarity and rank them for the final data
async function rankNFTs(creatoraddress) {

  console.log('Metaplex: Ranking NFTs')
  //get data from DB
  const input = await postgress.getData("solanametaplex", "creatoraddress", creatoraddress, "withrarity")//get data from DB

  //rank NFTs based on statistical rarity
  var sorted = input.data.sort((a, b) => a.statisticalRarity - b.statisticalRarity)
  
  for (i = 0;i < sorted.length;i++){sorted[i]['rarityRank'] = (i + 1)}//add a rank value
  
  var output = input//set output equal to what we got from DB
  output.data = []//clear just the data part (so we keep the other data)
  output.data = sorted//set the NFT data equal to the sorted data.

  console.log('first is')
  console.log(sorted[0])
  console.log('second is')
  console.log(sorted[1])
  console.log('third is')
  console.log(sorted[2])
  console.log('forth is')
  console.log(sorted[3])

  console.log('Metaplex: Storing final object with ' + output.data.length + ' NFTs')
  postgress.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "finaldata", output)

}; module.exports.rankNFTs = rankNFTs

//get the unranked NFTs with statistical rarity and rank them for the final data
async function cleanupDatabase(creatoraddress) {

  console.log('Metaplex: clearing raw metaplex data')
  await postgress.deleteColumnData("solanametaplex", "creatoraddress", creatoraddress, "withmeta")
  console.log('Metaplex: clearing unranked data with rarity')
  await postgress.deleteColumnData("solanametaplex", "creatoraddress", creatoraddress, "withrarity")

}; module.exports.cleanupDatabase = cleanupDatabase

async function addNewNFT(creatoraddress) {

  await getMetaplexData(creatoraddress)
  await calculateTraitPercentages(creatoraddress)
  await combineTraitRarity(creatoraddress)
  await rankNFTs(creatoraddress)
  await cleanupDatabase(creatoraddress)

}; module.exports.addNewNFT = addNewNFT

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
    
    var querystring = 'SELECT jsonb_path_query_first(finaldata, \'$.data[*] ? (@.nftid == ' + parseFloat(nftid) + ' || @.nftid == "' + nftid + '")\') AS nftdata FROM solanametaplex WHERE collectionkey = \''  + collectionKey + '\''

    pgclient.query(querystring, (err, res) => {
      if (err) throw err
      resolve(res.rows[0]['nftdata'])
    })//end query
  })//end promise
}; module.exports.getNFTdata = getNFTdata
