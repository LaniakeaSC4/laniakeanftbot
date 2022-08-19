const postgress = require('./postgres.js')//postgress related commands are in here
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function calculateranges(collectionsize) {
  return new Promise((resolve, reject) => {

    //set rarity threshold percentages
    const pmythic = 0.01
    const plegendary = 0.05
    const pepic = 0.15
    const prare = 0.35
    const puncommon = 0.6

    //initialise threshold variables
    var mythicstart = 0; var mythicend = 0
    var legendarystart = 0; var legendaryend = 0
    var epicstart = 0; var epicend = 0
    var rarestart = 0; var rareend = 0
    var uncommonstart = 0; var uncommonend = 0
    var commonend = 0; var commonend = 0

    //mythic range (start of range is 1)
    mythicstart = 1;
    mythicend = Math.floor(collectionsize * pmythic)

    //legendary range
    legendarystart = Math.ceil(collectionsize * pmythic)
    if (legendarystart === mythicend) { legendarystart = legendarystart + 1 }
    legendaryend = Math.floor(collectionsize * plegendary)

    //epic range
    epicstart = Math.ceil(collectionsize * plegendary)
    if (epicstart === legendaryend) { epicstart = epicstart + 1 }
    epicend = Math.floor(collectionsize * pepic)

    //rare range
    rarestart = Math.ceil(collectionsize * pepic)
    if (rarestart === epicend) { rarestart = rarestart + 1 }
    rareend = Math.floor(collectionsize * prare)

    //uncommon range
    uncommonstart = Math.ceil(collectionsize * prare)
    if (uncommonstart === rareend) { Uncommonstart = uncommonstart + 1 }
    uncommonend = Math.floor(collectionsize * puncommon)

    //common range (end of range is same as NFT count)
    commonstart = Math.ceil(collectionsize * puncommon)
    if (commonstart === uncommonend) { commonstart = commonstart + 1 }
    commonend = collectionsize

    resolve([mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend])
  }) //end promise
}; module.exports.calculateranges = calculateranges

//takes the ranges for this collection and returns string of its rarity description
async function getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, thisrarity) {

  //if mythic
  if (thisrarity >= mythicstart && thisrarity <= mythicend) {
    return ('Mythic')
  }
  //if Legendary
  else if (thisrarity >= legendarystart && thisrarity <= legendaryend) {
    return ('Legendary')
  }
  //if epic
  else if (thisrarity >= epicstart && thisrarity <= epicend) {
    return ('Epic')
  }
  //if rare
  else if (thisrarity >= rarestart && thisrarity <= rareend) {
    return ('Rare')
  }
  //if uncommon
  else if (thisrarity >= uncommonstart && thisrarity <= uncommonend) {
    return ('Uncommon')
  }
  //if common
  else if (thisrarity >= commonstart && thisrarity <= commonend) {
    return ('Common')
  }
  else {//this shouldnt trigger if the key is found and the data is complete
    return ('Not found')
  }//end else
}; module.exports.getraritydescription = getraritydescription

//function to get embed color
async function getembedcolour(raritydescription) {
  return new Promise((resolve, reject) => {
    if (raritydescription === 'Mythic') { resolve('0xed2839') }
    else if (raritydescription === 'Legendary') { resolve('0xfe8100') }
    else if (raritydescription === 'Epic') { resolve('0x9901f6') }
    else if (raritydescription === 'Rare') { resolve('0x19aaeb') }
    else if (raritydescription === 'Uncommon') { resolve('0x20d48a') }
    else if (raritydescription === 'Common') { resolve('0x939394') }
    else { resolve('0x939394') }//this shouldnt trigger but if it does, return common grey
  }) //end promise
}; module.exports.getembedcolour = getembedcolour

async function restructureTraitData(baseTraitData) {
  return new Promise((resolve, reject) => {
    var totalcount = 0
    var traitPercentages = {}
    //first get total count of all traits seen
    for (var i = 0; i < baseTraitData.results.availableAttributes.length; i++) {
      totalcount = totalcount + parseFloat(baseTraitData.results.availableAttributes[i].count)
    }//end for loop of all traits

    console.log('the final count is: ' + totalcount)

    for (var i = 0; i < baseTraitData.results.availableAttributes.length; i++) {//then loop through all traits again
      var thispercentage = parseFloat(baseTraitData.results.availableAttributes[i].count) / totalcount//the percantage of this trait
      var maintype = baseTraitData.results.availableAttributes[i].attribute.trait_type.replace(/[^0-9a-z]/gi, '')//main trait type (e.g. "background")
      var subtype = baseTraitData.results.availableAttributes[i].attribute.value.replace(/[^0-9a-z]/gi, '')//trait subtype (e.g. "purple")

      if (maintype in traitPercentages) {//if maintype is already a key in the object add the subtype:percentage object
        traitPercentages[maintype][subtype] = thispercentage
      } else {//if maintype isnt already a key, first create the object, then add to it
        traitPercentages[maintype] = {}
        traitPercentages[maintype][subtype] = thispercentage
      }//end else
    }//end for loop of all traits
    resolve(traitPercentages)
  }) //end promise
}; module.exports.restructureTraitData = restructureTraitData

/* this block is for https://github.com/metaplex-foundation/js/ @metaplex-foundation/js */
/* Gets all NFTs by verified creator address from quiknode (private RPC), then completes metadata (also via quiknode), then saves to DB*/

const { Metaplex, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const { Connection, clusterApiUrl, Keypair, PublicKey } = require("@solana/web3.js")

async function getMetaplexData(creator) {

  //establish connection
  const connection = new Connection(process.env.QUICKNODE)
  const wallet = Keypair.generate()
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage())

  var creatorkey = new PublicKey(creator)//make the verified creator address into a public key

  console.log('getting metadata from RPC - may take several minutes')
  const metadata = await metaplex.nfts().findAllByCreator({ "creator": creatorkey }).run()

  console.log('adding NFT JSON - 1 API request per 80ms - may take some time')
  var withjson = { "data": [] }
  for (var i = 0; i < metadata.length; i++) {
    var thisnft = await metaplex.nfts().load({ "metadata": metadata[i] }).run()
    withjson.data.push(thisnft)
    await wait(80)//wait to slow API requests.
  }//end for each NFT metadata

  console.log('storing metaplex data in DB')
  postgress.createTableRow("solanametaplex", "creatoraddress", creator, "withmeta", JSON.stringify(withjson))

}; module.exports.getMetaplexData = getMetaplexData

//gets the metaplex data and caculates the percentages of each trait. Stores as seperate object in DB
async function calculateTraitPercentages(creatoraddress) {

  console.log('Calculating trait percentages')
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
  console.log('Storing trait percentages in BD')
  postgress.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "traitrarity", traitPercentages)
}; module.exports.calculateTraitPercentages = calculateTraitPercentages

//get the nft and trait % data from postgres (added with getMetaplexData) and calculate the statistical rarity of each nft
async function combineTraitRarity(creatoraddress) {

  console.log('Building final object with statistical rarity')
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
  output['collectionCommonName'] = nftdata.data[0].name.substring(0, (nftdata.data[0].name.indexOf('#') - 1))
  output['description'] = nftdata.data[0].json.description

  for (var i = 0; i < nftdata.data.length; i++) {//for each NFT
    var thesepercentages = []

    //add the percentage rarity of each attribute of this NFT to an arrary
    for (var j = 0; j < nftdata.data[0].json.attributes.length; j++) { //for each attribute
      var maintype = nftdata.data[i].json.attributes[j].trait_type.replace(/[^0-9a-z]/gi, '')
      var subtype = nftdata.data[i].json.attributes[j].value.replace(/[^0-9a-z]/gi, '')

      var thispercentage = traitdata[maintype][subtype]['percentage']
      thesepercentages.push(thispercentage)
    }//end for each attribute

    //multiply the percentages together to get statistical rarity
    var thisrarity = parseFloat(thesepercentages[0])//first % is the starting point (don't want 1 or 0)
    for (var k = 1; k < thesepercentages.length; k++) {//from k = 1
      thisrarity = thisrarity * parseFloat(thesepercentages[k])
    }//end for percentages

    //now store the NFT with this info into out output object
    output.data[i] = {
      "id": nftdata.data[i].json.edition,
      "name": nftdata.data[i].json.name,
      "statisticalRarity": thisrarity,
      "image": nftdata.data[i].json.image,
      "symbol": nftdata.data[i].json.symbol,
      "attributes": nftdata.data[i].json.attributes,
      "uri": nftdata.data[i].uri,
      "tokenAddress": nftdata.data[i].address,
      "mintAuthorityAddress": nftdata.data[i].mint.mintAuthorityAddress,
      "collectionAddress": nftdata.data[i].collection.address,
      "metadataAddress": nftdata.data[i].metadataAddress
    }//end output data load for this NFT
  }//end for each NFT
  //store new nft arrary in postgres
  console.log('Storing final object')
  postgress.updateTableColumn("solanametaplex", "creatoraddress", creatoraddress, "withrarity", output)
}; module.exports.combineTraitRarity = combineTraitRarity

//get the unranked NFTs with statistical rarity and rank them for the final data
async function rankNFTs(creatoraddress) {

  console.log('Ranking NFTs')
  //get data from DB
  const input = await postgress.getData("solanametaplex", "creatoraddress", creatoraddress, "withrarity")//get data from DB

  //rank NFTs based on statistical rarity
  var sorted = input.sort((a, b) => a.statisticalRarity - b.statisticalRarity)
  console.log('first is')
  console.log(sorted[0])
  console.log('second is')
  console.log(sorted[1])
  console.log('third is')
  console.log(sorted[2])
  console.log('forth is')
  console.log(sorted[3])

}; module.exports.rankNFTs = rankNFTs


