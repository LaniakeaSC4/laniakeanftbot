const sql = require('./postgreSQL.js')//sql related commands are in here
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
