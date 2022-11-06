/*

Gets all NFTs by verified creator address from quiknode (private RPC), then completes metadata (also via quiknode), then saves to DB
autoAddCollection does not save state between each step and instead passes data function to function

*/
const { create, all } = require('mathjs')
const config = {
    precision: 128
  };
const math = create(all, config)



const { Metaplex, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const { Connection, Keypair, PublicKey } = require("@solana/web3.js")
const sql = require('../tools/commonSQL.js')//common sql related commands are in here
const w = require('../tools/winston.js')
const sniper = require('./sniper-main.js')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

//var math = require('mathjs')

//fulladd - do all steps
async function addNewNFT(creatoraddress, meslug, extraBlockList) {
  w.log.info('autoAdd1: starting auto add. Getting metaplex data with JSON')
  var withJSON = await getMetaplexData(creatoraddress)

  w.log.info('autoAdd2: Got metaplex data. Calculating trait percentages')
  var traitPercentages = await calculateTraitPercentages(withJSON)

  w.log.info('autoAdd3: Calculated trait percentages. Combining trait rarities with NFT data')
  var step3data = await combineTraitRarity(withJSON, traitPercentages, meslug, creatoraddress, extraBlockList)
  var unrankedNFTs = step3data.nft
  var collectionSize = step3data.size
  var collectionkey = step3data.key
  w.log.info('autoAdd3: Function returned size: ' + collectionSize + 'for key: ' + collectionkey)


  //w.log.info('autoAdd4: Trait rarity combined. Function also returned collectionsize: ' + collectionSize + ' and collectionkey ' + collectionkey + '. Now ranking NFTs')
  //var ranked = await rankNFTs(unrankedNFTs)

  w.log.info('autoAdd5: NFTs have been ranked. Storing final object. Storing creatoraddress: ' + creatoraddress + ' collectionkey: ' + collectionkey + ' meslug: ' + meslug + ' collectioncount: ' + collectionSize + ' and final nft data')
  await storeCollection(creatoraddress, collectionkey, meslug, collectionSize, unrankedNFTs)

  w.log.info('autoAdd6: Restarting sniper')
  await sniper.stop()
  await sniper.initialise()

}; module.exports.addNewNFT = addNewNFT

//addstep1
var swapper = 0
async function getMetaplexData(creatoraddress) {
  
  //establish connection
  var connection;
  if (swapper === 0){
    w.log.info('autoAdd1: Using RPC connection 1')
    connection = new Connection(process.env.QUICKNODE)
    swapper = 1
  } else {
    w.log.info('autoAdd1: Using RPC connection 2')
    connection = new Connection(process.env.QUICKNODE2)
    swapper = 0
  }
  
  const wallet = Keypair.generate()
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage())

  var creatorkey = new PublicKey(creatoraddress)//make the verified creator address into a public key

  w.log.info('autoAdd1: getting metadata from RPC - should take about 1 minute per 100 NFTs in collection')
  const metadata = await metaplex.nfts().findAllByCreator({ "creator": creatorkey }).run()

  w.log.info('autoAdd1: adding NFT JSON to the ' + metadata.length + ' NFTs we recieved - 1 API request per 65ms')
  var withjson = { "data": [], "fails": [] }
  var heartbeat = 0//start at 0 and count for each NFT. Send log every 50

  for (var i = 0; i < metadata.length; i++) {//for each of the recieved NFTs (without metadata)
    var thisnft = await metaplex.nfts().load({ "metadata": metadata[i] }).run()//request NFT metadata

    if (thisnft.json != null) {//if the response did indeed have metadata
      withjson.data.push(thisnft)//add it to the final object
      heartbeat = heartbeat + 1//count up heartbeat logger
      if ((heartbeat % 50) == 0) { w.log.info('autoAdd1: I\'ve sent ' + heartbeat + ' json load requests') }//console log every 50 requests (so we know process is alive)
      await wait(100)//wait to slow API requests.
    } else {//if recieved NFT didnt have metadata, we can retry is. push it to a fail object.
      w.log.info('autoAdd1: ' + thisnft.name + ' failed to add JSON. Pushing metadata[i] to fail list')
      withjson.fails.push(metadata[i])
    }//end else if no NFT metadata
  }//end for each NFT metadata

  //retry the fails - only one retry, should probably do at least a 2nd retry (or more?)
  w.log.info('autoAdd1: retrying ' + withjson.fails.length + ' fails')
  var heartbeat = 0
  for (var i = 0; i < withjson.fails.length; i++) {//loop hrough fails object
    var thisnft = await metaplex.nfts().load({ "metadata": withjson.fails[i] }).run()//request NFT metadata

    if (thisnft.json != null) {//if we got metadata
      w.log.info('autoAdd1: ' + thisnft.name + ' got data on retry')
      withjson.data.push(thisnft)
      heartbeat = heartbeat + 1
      if ((heartbeat % 5) == 0) { w.log.info('autoAdd1: I\'ve sent ' + heartbeat + ' json load requests') }
      await wait(80)//wait to slow API requests.
    } else {
      w.log.info("autoAdd1: failed to add JSON twice. " + thisnft.name + " will not be in final obj.data")
    }//end else if we got metadata
  }//end for each fail

  w.log.info('autoAdd1: returning metaplex data (with JSON)')
  return (withjson)
}; module.exports.getMetaplexData = getMetaplexData

//addstep2 - gets the metaplex data and caculates the percentages of each trait. Stores as seperate object in DB
async function calculateTraitPercentages(metaplexdata) {

 w.log.info('autoAdd2: Calculating trait percentages')
 
 //build initial trait percentages objects to see what traits we have
 var preTraitPercentages = {}//establish output object
for (var i = 0; i < metaplexdata.data.length; i++) { //for each nft in the metaplex data

  try {
    if (metaplexdata.data[i].json) { //if there is JSON metadata. This shouldnt happen now we retry fails.
      for (var j = 0; j < metaplexdata.data[i].json.attributes.length; j++) { //for each attribute of this NFT
        var maintype = metaplexdata.data[i].json.attributes[j].trait_type
        var subtype = ''
        if (metaplexdata.data[i].json.attributes[j].value.toString()) { //if the atribute has a value (not sure why it wouldn't or why I added this!)
          subtype = metaplexdata.data[i].json.attributes[j].value //set subtype to it
        } else { subtype = 'none' } //else set it to "none" which essentially adds a count for it

        if (maintype in preTraitPercentages) { //if maintype is already a key in the object
          if (subtype in preTraitPercentages[maintype]) { //if maintype and subtype already exist, +1 to timesSeen and +1 to total count for that maintype
            preTraitPercentages[maintype][subtype]['timesSeen'] = preTraitPercentages[maintype][subtype]['timesSeen'] + 1
            preTraitPercentages[maintype]['totalcount'] = preTraitPercentages[maintype]['totalcount'] + 1
          } else { //maintype exists, but subtype does not. Create new subtype object and start at 1 timesSeen
            preTraitPercentages[maintype][subtype] = {}
            preTraitPercentages[maintype][subtype]['timesSeen'] = 1
            preTraitPercentages[maintype]['totalcount'] = preTraitPercentages[maintype]['totalcount'] + 1 //maintype already existed, so we can add 1 to it
          }
        } else { //if maintype isnt already a key, subtype won't exist either first create the objects, then start at 1 timesSeen and totalcount
          preTraitPercentages[maintype] = {}
          preTraitPercentages[maintype][subtype] = {}
          preTraitPercentages[maintype][subtype]['timesSeen'] = 1
          preTraitPercentages[maintype]['totalcount'] = 1
        } //end else
      } //end for each trait
    } else { throw 'autoAdd2: var i = ' + i + ' var j = ' + j + ' maintype is: ' + maintype + 'subtype is: ' + subtype + ' for ' + metaplexdata.data[i].name }
  } catch (err) {
    w.log.info('autoAdd2: Error finding traits: ' + err)
  } //end catch error
} //end for each nft




/*

go through all nfts and collect all the maintypes

go through again and check all nfts have each maintype if not inject that maintype with value 'none'

*/

//loop through nfts to add missing traits to nfts as 'none''
  for (var i = 0; i < metaplexdata.data.length; i++) {//for each nft in the metaplex data

    try {
      
      for (var j = 0; j < preTraitPercentages.length; j++) { //for each preTraitPercentages maintype - hat
        
        for (var k = 0;k < metaplexdata.data[i].json.attributes;k++) {//for each nft maintype find same maintype in nft data
          
          if (preTraitPercentages[j] == metaplexdata.data[i].json.attributes[k]) {//if we found the matching maintype check if all the preTraitPercentages subtypes exist in this nft. Otherwise add as 'none'
          
          //preTraitPercentages[j] and metaplexdata.data[i].json.attributes[k] should be the same maintype
          
          for (var l = 0;preTraitPercentages[j].length;l++){//for each subtype of this preTraitPercentages maintype
          
          //preTraitPercentages[j][l] is a particular subtype. Loop through nft subtypes for
          
          if (metaplexdata.data[i].json.attributes[k]?.[preTraitPercentages[j][l]] === undefined){//if this subtype in the matched maintype in preTraitPercentages is not in thr matched maintype [k] in thr nft
          
          w.log.info(preTraitPercentages[j][l]+' was not found in ' + metaplexdata.data[i].name)
          
          //push into attributes
          var missingAtt = { "trait_type" : preTraitPercentages[j][l], "value" : 'none'} 
          metaplexdata.data[i].json.attributes[k].push(missingAtt)
            
          }
            
          }
            
            
          }
        } 
      
        
        
        
        }//end
   
    } catch (err) {
      w.log.info('autoAdd2: Error finding traits: ' + err)
    }//end catch error
  }//end for each nft
w.log.info('logging preTrait')
w.log.info(JSON.stringify(preTraitPercentages))

//rebuild trait percentages now we have the nones
 var traitPercentages = {}//establish output object
for (var i = 0; i < metaplexdata.data.length; i++) { //for each nft in the metaplex data

  try {
    if (metaplexdata.data[i].json) { //if there is JSON metadata. This shouldnt happen now we retry fails.
      for (var j = 0; j < metaplexdata.data[i].json.attributes.length; j++) { //for each attribute of this NFT
        var maintype = metaplexdata.data[i].json.attributes[j].trait_type
        var subtype = ''
        if (metaplexdata.data[i].json.attributes[j].value.toString()) { //if the atribute has a value (not sure why it wouldn't or why I added this!)
          subtype = metaplexdata.data[i].json.attributes[j].value //set subtype to it
        } else { subtype = 'none' } //else set it to "none" which essentially adds a count for it

        if (maintype in traitPercentages) { //if maintype is already a key in the object
          if (subtype in traitPercentages[maintype]) { //if maintype and subtype already exist, +1 to timesSeen and +1 to total count for that maintype
            traitPercentages[maintype][subtype]['timesSeen'] = traitPercentages[maintype][subtype]['timesSeen'] + 1
            traitPercentages[maintype]['totalcount'] = traitPercentages[maintype]['totalcount'] + 1
          } else { //maintype exists, but subtype does not. Create new subtype object and start at 1 timesSeen
            traitPercentages[maintype][subtype] = {}
            traitPercentages[maintype][subtype]['timesSeen'] = 1
            traitPercentages[maintype]['totalcount'] = traitPercentages[maintype]['totalcount'] + 1 //maintype already existed, so we can add 1 to it
          }
        } else { //if maintype isnt already a key, subtype won't exist either first create the objects, then start at 1 timesSeen and totalcount
          traitPercentages[maintype] = {}
          traitPercentages[maintype][subtype] = {}
          traitPercentages[maintype][subtype]['timesSeen'] = 1
          traitPercentages[maintype]['totalcount'] = 1
        } //end else
      } //end for each trait
    } else { throw 'autoAdd2: var i = ' + i + ' var j = ' + j + ' maintype is: ' + maintype + 'subtype is: ' + subtype + ' for ' + metaplexdata.data[i].name }
  } catch (err) {
    w.log.info('autoAdd2: Error finding traits: ' + err)
  } //end catch error
} //end for each nft



//add per collection blocks

  //work out percentages
  Object.keys(traitPercentages).forEach(maintype => {//for each maintype
    Object.keys(traitPercentages[maintype]).forEach(subtype => {//go into each subtype
      if (traitPercentages[maintype][subtype] != 'timesSeen') {//for all except the 'timesSeen' key
        traitPercentages[maintype][subtype]['percentage'] = traitPercentages[maintype][subtype]['timesSeen'] / traitPercentages[maintype]['totalcount']
      }//end if not 'timesSeen'
    })//end for each subtype
  })//end for each maintype


//for traits that exist in the collection but are not on all nfts add 'none'












  //store in DB
  w.log.info(JSON.stringify(traitPercentages))
  return (traitPercentages)
}; module.exports.calculateTraitPercentages = calculateTraitPercentages

//addstep3 - get the nft and trait % data from SQL (added with getMetaplexData) and calculate the statistical rarity of each nft
async function combineTraitRarity(nftdata, traitdata, meslug, creatoraddress, extraBlockList) {
  
  w.log.info('autoAdd3: Building final object with statistical rarity')

  var output = { "data": [] }//establish output object

  //save some collection specific data into the top level of the output object
  output['collectionSymbol'] = nftdata.data[0].json.symbol
  output['verifiedCreator'] = creatoraddress
  output['totalNFTs'] = nftdata.data.length
  output['collectionCommonName'] = nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1))
  output['collectionKey'] = nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1)).toString().replace(/[^0-9a-z]/gi, '')
  output['description'] = nftdata.data[0].json.description
  output['traitdata'] = traitdata
  
  //establish blocklist
  var globalblocklist = ['rarity rank',"sequence", "generation", "collection"]
  var blocklist = []
  if (extraBlockList.length > 0) {
  var blocklist = globalblocklist.concat(extraBlockList)
  } else {
    blocklist = globalblocklist
  }
  //push case specific blocks to list

  var jsonerrors = 0
  for (var i = 0; i < nftdata.data.length; i++) {//for each NFT
    var thesepercentages = []

    //add the percentage rarity of each attribute of this NFT to an arrary
    try {
      if (nftdata.data[i].json) {//if there is metadata
        for (var j = 0; j < nftdata.data[i].json.attributes.length; j++) { //for each attribute
          try {
            //if there are any attributes (should be)
            if (nftdata.data[i].json.attributes[j]) {
              var maintype = nftdata.data[i].json.attributes[j].trait_type

              //if the attribute has a value, else set to none. As mentioned in calculate percentages. This may not be needed
              var subtype = ''
              if (nftdata.data[i].json.attributes[j].value.toString()) {
                subtype = nftdata.data[i].json.attributes[j].value
              } else { subtype = 'none' }

              //push percentage into an arrary
              if (blocklist.includes(maintype.toLowerCase()) === false) {
              
              var thispercentage = traitdata[maintype][subtype]['percentage']
              thesepercentages.push(thispercentage)
              }//end if not on blocklist
              
            } else { throw 'autoAdd3: var i = ' + i + ' var j = ' + j + '.  maintype is a ' + typeof maintype + ': ' + maintype + '. subtype is a ' + typeof subtype + ': ' + subtype }
          } catch (err) {
            w.log.info('autoAdd3: Error finding traits: ' + err)
          }
        }//end for each attribute

        //multiply the percentages together to get statistical rarity
        var thisrarity = math.bignumber(thesepercentages[0])
        var therest = thesepercentages.slice(1)
        for (var k = 0; k < therest.length; k++) {//from k = 1
          thisrarity = math.multiply(thisrarity, math.bignumber(therest[k]))
        }//end for percentages
        
        /*
        //get bignumber ready for output
        var multiplier = math.pow(math.abs(math.log10(thisrarity)), 10)
        
        thisrarity = math.multiply(thisrarity, multiplier)
        
        thisrarity = math.number(thisrarity)
        */

        
        //now store the NFT with this info into out output object
        output.data[i] = {
          "name": nftdata.data[i].json.name,
          "statisticalRarity": thisrarity,
          "image": nftdata.data[i].json.image,
          "symbol": nftdata.data[i].json.symbol,
          "attributes": nftdata.data[i].json.attributes,
          "tokenAddress": nftdata.data[i].address
        }//end output data load for this NFT
      } else { jsonerrors = jsonerrors + 1 }
    } catch (err) {
      w.log.info(err)
    }//end catch error
  }//end for each NFT
  w.log.info('finishing adding big numbers to nfts')
  var toSort = output.data
  
  function sortNFT(a, b) {
   return math.subtract(a.statisticalRarity, b.statisticalRarity)
  }
  w.log.info('sorting nfts')
  var sorted = math.sort(toSort, sortNFT)
  
  w.log.info('ranking nfts')
  for (i = 0; i < sorted.length; i++) { sorted[i]['rarityRank'] = (i + 1) 
    //delete bignumber to string
    sorted[i].statisticalRarity = math.number(sorted[i].statisticalRarity)
  }//add a rank value to object which will be output
  
  var newoutput = output//set output equal to what we got from DB
  newoutput.data = []//clear just the data part (so we keep the other data)
  newoutput.data = sorted//set the NFT data equal to the sorted data.
  
  w.log.info('autoAdd3: ' + jsonerrors + '/' + nftdata.data.length + '(input size) gave JSON errors')
  w.log.info('autoAdd3: lenth is: ' + parseFloat(newoutput.data.length) + '(output size) meslug clean is: ' + meslug.replace(/[^0-9a-z]/gi, '').toLowerCase())

  var returnthis = {}
  returnthis['nft'] = newoutput
  returnthis['size'] = parseFloat(output.data.length)
  returnthis['key'] = meslug.replace(/[^0-9a-z]/gi, '').toLowerCase()
  //return [unranked nft object, collection count, collectionkey]
  return returnthis
}; module.exports.combineTraitRarity = combineTraitRarity

//addstep4 - get the unranked NFTs with statistical rarity and rank them for the final data
async function rankNFTs(input) {

  //make sure there are no null entries in our ranking. There shouldn't be as preceeding functions should handle this, but best be safe.
  var filtered = []
  for (var i = 0; i < input.data.length; i++) {
    if (input.data[i] != null) {
      filtered.push(input.data[i])
    }//end if not null
  }//end for

  //rank NFTs based on statistical rarity
  var sorted = filtered.sort((a, b) => a.statisticalRarity - b.statisticalRarity)

  for (i = 0; i < sorted.length; i++) { sorted[i]['rarityRank'] = (i + 1) }//add a rank value to object which will be output

  var output = input//set output equal to what we got from DB
  output.data = []//clear just the data part (so we keep the other data)
  output.data = sorted//set the NFT data equal to the sorted data.

  w.log.info('autoAdd4: Returning final object with ' + output.data.length + ' NFTs')
  return (output)

}; module.exports.rankNFTs = rankNFTs

//store everything function
var db = require('../clients/pgclient.js')
async function storeCollection(creatoraddress, collectionkey, meslug, collectioncount, finaldata) {
  return new Promise((resolve, reject) => {
    var pgclient = db.getClient()

    var querystring = 'INSERT INTO solanametaplex (creatoraddress,collectionkey,meslug,collectioncount,finaldata) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (creatoraddress) DO UPDATE SET finaldata = $5,collectioncount = $4'
    var querydata = [creatoraddress, collectionkey, meslug, collectioncount, finaldata]
    w.log.info('autoAdd5: Running storage command to store data in sql')
    pgclient.query(querystring, querydata, (err, res) => {
      if (err) throw err
      resolve('success')
    })//end query
  })//end promise
}//end function
