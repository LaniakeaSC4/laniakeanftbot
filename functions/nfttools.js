const { Metaplex, keypairIdentity, bundlrStorage } = require("@metaplex-foundation/js")
const { Connection, clusterApiUrl, Keypair } = require("@solana/web3.js")

//set rarity threshold percentages
const pmythic = 0.01
const plegendary = 0.05
const pepic = 0.15
const prare = 0.35
const puncommon = 0.6

async function calculateranges(collectionsize) {
  return new Promise((resolve, reject) => {

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
}//end calculate ranges
module.exports.calculateranges = calculateranges


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
}//end getraritydescription function
module.exports.getraritydescription = getraritydescription

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
}//end getembedcolour
module.exports.getembedcolour = getembedcolour

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
      var maintype = baseTraitData.results.availableAttributes[i].attribute.trait_type//main trait type (e.g. "background")
      var subtype = baseTraitData.results.availableAttributes[i].attribute.value//trait subtype (e.g. "purple")

      if (maintype in traitPercentages) {//if maintype is already a key in the object add the subtype:percentage object
        traitPercentages[maintype][subtype] = thispercentage
      } else {//if maintype isnt already a key, first create the object, then add to it
        traitPercentages[maintype] = {}
        traitPercentages[maintype][subtype] = thispercentage
      }//end else
    }//end for loop of all traits
    resolve(traitPercentages)
  }) //end promise
}//end restructureTraitData 
module.exports.restructureTraitData = restructureTraitData

async function getMetaplexData(creatorKey) {

    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const wallet = Keypair.generate();

    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(wallet))
      .use(bundlrStorage())

    const nfts = await metaplex.nfts().findAllByCreator(creatorKey).run();
    return nfts

}; module.exports.getMetaplexData = getMetaplexData

/*const axios = require('axios')
const getHolders = async (creator) => {
  try {
    //let response = await axios.get(` https://public-api.solscan.io/account/${creator}`);
    //if (!response.data?.lamports) return null;
    console.log('getting nft holders')
    await axios({
      method: 'post',
      url: 'https://api.metaplex.solana.com/',
      headers: {
        "Content-Type": "application/json"
      },
      data: { "method": "getProgramAccounts", "jsonrpc": "2.0", "params": ["metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s", { "encoding": "base64", "filters": [{ "memcmp": { "offset": 326, "bytes": creator } }, { "memcmp": { "offset": 358, "bytes": "2" } }] }], "id": "94f5e150-ab04-4f88-a344-d93a57b5df6f" }
    }).then(response1 => {

      console.log('logging status code')
      console.log(response1.status)
      if (response1.status == 200) {
        console.log('logging first result')
        console.log(response1.data.result[0])
      } else { return null }

    })

  } catch (e) {
    return null;
  }
}
module.exports.getholders = getHolders*/
