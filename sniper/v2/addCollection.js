/* this block is for https://github.com/metaplex-foundation/js/ @metaplex-foundation/js */
/* Gets all NFTs by verified creator address from quiknode (private RPC), then completes metadata (also via quiknode), then saves to DB*/

const { Metaplex, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const { Connection, clusterApiUrl, Keypair, PublicKey } = require("@solana/web3.js")
const sql = require('../../tools/commonSQL.js')//common sql related commands are in here
const w = require('../../tools/winston.js')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

//fulladd - do all steps
async function addNewNFT(creatoraddress, meslug) {

  await getMetaplexData(creatoraddress)
  await calculateTraitPercentages(creatoraddress)
  await combineTraitRarity(creatoraddress)
  await rankNFTs(creatoraddress, meslug)
  await cleanupDatabase(creatoraddress)

}; module.exports.addNewNFT = addNewNFT

//addstep1
async function getMetaplexData(creatoraddress) {
  //establish connection
  const connection = new Connection(process.env.QUICKNODE)
  const wallet = Keypair.generate()
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage())

  var creatorkey = new PublicKey(creatoraddress)//make the verified creator address into a public key

  w.log.info('Metaplex: getting metadata from RPC - should take about 1 minute per 100 NFTs in collection')
  const metadata = await metaplex.nfts().findAllByCreator({ "creator": creatorkey }).run()

  w.log.info('Metaplex: adding NFT JSON to the ' + metadata.length + ' NFTs we recieved - 1 API request per 65ms')
  var withjson = { "data": [], "fails": [] }
  var heartbeat = 0

  for (var i = 0; i < metadata.length; i++) {
    var thisnft = await metaplex.nfts().load({ "metadata": metadata[i] }).run()

    if (thisnft.json != null) {
      withjson.data.push(thisnft)
      heartbeat = heartbeat + 1
      if ((heartbeat % 50) == 0) { w.log.info('Metaplex: I\'ve sent ' + heartbeat + ' json load requests') }
      await wait(80)//wait to slow API requests.
    } else {
      w.log.info('Metaplex: ' + thisnft.name + ' failed to add JSON. Pushing metadata[i] to fail list')
      withjson.fails.push(metadata[i])
    }
  }//end for each NFT metadata

  //retry the fails
  w.log.info('Metaplex: retrying ' + withjson.fails.length + ' fails')
  var heartbeat = 0
  for (var i = 0; i < withjson.fails.length; i++) {
    var thisnft = await metaplex.nfts().load({ "metadata": withjson.fails[i] }).run()

    if (thisnft.json != null) {
      w.log.info('Metaplex: ' + thisnft.name + ' got data on retry')
      withjson.data.push(thisnft)
      heartbeat = heartbeat + 1
      if ((heartbeat % 5) == 0) { w.log.info('Metaplex: I\'ve sent ' + heartbeat + ' json load requests') }
      await wait(80)//wait to slow API requests.
    } else {
      w.log.info("Metaplex: failed to add JSON twice. " + thisnft.name + " will not be in final obj.data")
    }
  }//end for each fail

  w.log.info('Metaplex: storing metaplex data (with JSON) in DB')
  await sql.createTableRow("solanametaplex", "creatoraddress", creatoraddress, "withjson", JSON.stringify(withjson))
}; module.exports.getMetaplexData = getMetaplexData

//addstep2 - gets the metaplex data and caculates the percentages of each trait. Stores as seperate object in DB
async function calculateTraitPercentages(creatoraddress) {

  w.log.info('Metaplex: Calculating trait percentages')
  const metaplexdata = await sql.getData("solanametaplex", "creatoraddress", creatoraddress, "withjson")//get data from DB
  var traitPercentages = {}//establish output object

  for (var i = 0; i < metaplexdata.data.length; i++) {//for each nft in the metaplex data

    try {
      if (metaplexdata.data[i].json) {
        for (var j = 0; j < metaplexdata.data[i].json.attributes.length; j++) { //for each attribute of this NFT
          //var maintype = metaplexdata.data[i].json.attributes[j].trait_type.toString().replace(/[^0-9a-z]/gi, '')//clean the key
          var maintype = metaplexdata.data[i].json.attributes[j].trait_type

          /*var subtype = ''
          if (metaplexdata.data[i].json.attributes[j].value.toString().replace(/[^0-9a-z]/gi, '')) {
            subtype = metaplexdata.data[i].json.attributes[j].value.toString().replace(/[^0-9a-z]/gi, '')//clean the key
          } else { subtype = 'none' }*/
          
          var subtype = ''
          if (metaplexdata.data[i].json.attributes[j].value.toString()) {
            subtype = metaplexdata.data[i].json.attributes[j].value
          } else { subtype = 'none' }

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
      } else { throw 'Metaplex: var i = ' + i + ' var j = ' + j + ' maintype is: ' + maintype + 'subtype is: ' + subtype + ' for ' + metaplexdata.data[i].name }
    } catch (err) {
      w.log.info('Metaplex: Error finding traits: ' + err)
    }
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
  w.log.info('Metaplex: Storing trait percentages in DB')
  sql.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "traitrarity", traitPercentages)
}; module.exports.calculateTraitPercentages = calculateTraitPercentages

//addstep3 - get the nft and trait % data from SQL (added with getMetaplexData) and calculate the statistical rarity of each nft
async function combineTraitRarity(creatoraddress) {

  w.log.info('Metaplex: Building final object with statistical rarity')
  var traitdata = {}; var nftdata = {}//establish objects

  //load NFT and trait data and 
  const loaddata = Promise.all([sql.getData("solanametaplex", "creatoraddress", creatoraddress, "traitrarity"), sql.getData("solanametaplex", "creatoraddress", creatoraddress, "withjson")])
  try {
    const thisdata = await loaddata
    traitdata = thisdata[0]
    nftdata = thisdata[1]
  } catch (error) { w.log.info('Metaplex: Error getting data') }

  var output = { "data": [] }//establish output object

  //save some collection specific data into the top level of the output object
  output['collectionSymbol'] = nftdata.data[0].json.symbol
  output['verifiedCreator'] = creatoraddress
  output['totalNFTs'] = nftdata.data.length
  output['collectionCommonName'] = nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1))
  output['collectionKey'] = nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).toString().replace(/[^0-9a-z]/gi, '')
  output['description'] = nftdata.data[0].json.description

  for (var i = 0; i < nftdata.data.length; i++) {
    if (nftdata.data[i].json == null) {
      w.log.info('Metaplex: there was a null json')
      w.log.info(nftdata.data[i])
    }
  }

  var jsonerrors = 0
  for (var i = 0; i < nftdata.data.length; i++) {//for each NFT
    var thesepercentages = []

    //add the percentage rarity of each attribute of this NFT to an arrary
    try {
      if (nftdata.data[i].json) {
        for (var j = 0; j < nftdata.data[i].json.attributes.length; j++) { //for each attribute
          //w.log.info(nftdata.data[i].json.attributes[j] )

          try {
            if (nftdata.data[i].json.attributes[j]) {
              /*var maintype = nftdata.data[i].json.attributes[j].trait_type.toString().replace(/[^0-9a-z]/gi, '')

              var subtype = ''
              if (nftdata.data[i].json.attributes[j].value.toString().replace(/[^0-9a-z]/gi, '')) {
                subtype = nftdata.data[i].json.attributes[j].value.toString().replace(/[^0-9a-z]/gi, '')//clean the key
              } else { subtype = 'none' }*/
              
              var maintype = nftdata.data[i].json.attributes[j].trait_type

              var subtype = ''
              if (nftdata.data[i].json.attributes[j].value.toString()) {
                subtype = nftdata.data[i].json.attributes[j].value
              } else { subtype = 'none' } 

              var thispercentage = traitdata[maintype][subtype]['percentage']
              thesepercentages.push(thispercentage)
            } else { throw 'Metaplex: var i = ' + i + ' var j = ' + j + '.  maintype is a ' + typeof maintype + ': ' + maintype + '. subtype is a ' + typeof subtype + ': ' + subtype }
          } catch (err) {
            w.log.info('Metaplex: Error finding traits: ' + err)
          }
        }//end for each attribute

        //multiply the percentages together to get statistical rarity
        var thisrarity = (parseFloat(thesepercentages[0]) * 10)//first % is the starting point (don't want 1 or 0)
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
        /*
        var thisnftid = 0
        let namearr = nftdata.data[i].json.name.split(' ')
        for (var m = 0; m < namearr.length; m++) {
          let checkthis = namearr[m]
          if (checkthis.includes('#')) {
            var nlength = checkthis.length
            thisnftid = parseFloat(checkthis.substring(1, nlength))
          }//end if
        }//end for
        */
        thisnftid = parseFloat(nftdata.data[i].json.name.match(/(\d+)(?=[^\d]+$)/g))

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
      } else { jsonerrors = jsonerrors + 1 }
    } catch (err) {

    }
  }//end for each NFT
  w.log.info('Metaplex: ' + jsonerrors + '/' + nftdata.data.length + ' gave JSON errors')
  //store new nft arrary in SQL
  w.log.info('Metaplex: Storing object with ' + output.data.length + ' NFTs + Statistical Rarity + collectionkey ' + nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).toString().replace(/[^0-9a-z]/gi, ''))
  await sql.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "withrarity", output)
  w.log.info('Metaplex: storing collection count of: ' + parseFloat(output.data.length))
  await sql.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "collectioncount", parseFloat(output.data.length))
  w.log.info('Metaplex: storing collection key: ' + nftdata.data[10].json.name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).toString().replace(/[^0-9a-z]/gi, '').toLowerCase())
  await sql.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "collectionkey", nftdata.data[10].json.name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).toString().replace(/[^0-9a-z]/gi, '').toLowerCase())
}; module.exports.combineTraitRarity = combineTraitRarity

//addstep4 - get the unranked NFTs with statistical rarity and rank them for the final data
async function rankNFTs(creatoraddress, meslug) {

  w.log.info('Metaplex: Ranking NFTs')
  //get data from DB
  const input = await sql.getData("solanametaplex", "creatoraddress", creatoraddress, "withrarity")//get data from DB
  w.log.info('Metaplex: input.data.length is: ' + input.data.length)

  var filtered = []
  for (var i = 0; i < input.data.length; i++) {
    if (input.data[i] != null) {
      filtered.push(input.data[i])
    }
  }

  //rank NFTs based on statistical rarity
  var sorted = filtered.sort((a, b) => a.statisticalRarity - b.statisticalRarity)

  for (i = 0; i < sorted.length; i++) { sorted[i]['rarityRank'] = (i + 1) }//add a rank value

  var output = input//set output equal to what we got from DB
  output.data = []//clear just the data part (so we keep the other data)
  output.data = sorted//set the NFT data equal to the sorted data.

  /*
  w.log.info('Metaplex: first is')
  w.log.info(sorted[0])
  w.log.info('Metaplex: second is')
  w.log.info(sorted[1])
  w.log.info('Metaplex: third is')
  w.log.info(sorted[2])
  w.log.info('Metaplex: forth is')
  w.log.info(sorted[3])
  */

  w.log.info('Metaplex: Storing final object with ' + output.data.length + ' NFTs')
  sql.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "finaldata", output)
  sql.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "meslug", meslug)

}; module.exports.rankNFTs = rankNFTs

//addstep5 - delete data we no longer need from sql columns
async function cleanupDatabase(creatoraddress) {

  w.log.info('Metaplex: clearing raw metaplex + JSON data')
  await sql.deleteColumnData("solanametaplex", "creatoraddress", creatoraddress, "withjson")
  w.log.info('Metaplex: clearing unranked data with rarity')
  await sql.deleteColumnData("solanametaplex", "creatoraddress", creatoraddress, "withrarity")

}; module.exports.cleanupDatabase = cleanupDatabase
