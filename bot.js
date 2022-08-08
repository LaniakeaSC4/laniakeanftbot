const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] })
const https = require('https')

client.login(process.env.BOTTOKEN)

//==============================
//==== Rarity checker Setup  ===
//==============================

const rarityCollections = [
  ['monkeypox_nft', [], 2400],
  ['pixel_guild_loot_legends', [], 8888]
]

var raritySequencer = []
for (var i = 0; i < rarityCollections.length; i++) { raritySequencer.push(i) }

//old vars

//main collections array
const collections = []

//import collections
const mpoxdata = require('./monkeypox_nft.json')
const pixelguilddata = require('./pixel_guild_loot_legends.json')


//add collections to arrary
collections['monkeypox_nft'] = mpoxdata
collections['pixel_guild_loot_legends'] = pixelguilddata

//======================
//==== Sniper Setup  ===
//======================

//channels and servers
const servers = {
  "monkeypox":
  {
    'id': '978975057739124767', 'snipeschannel': '996130357260845156', 'emoji': {
      "Mythic": '<:mythic:997639717665386586>',
      "Legendary": '<:legendary:997639764943585421>',
      "Epic": '<:epic:997639797558497421>',
      "Rare": '<:rare:997639830844477471>',
      "Uncommon": '<:uncommon:997639865065799770>',
      "Common": '<:common:997639893306064997>'
    }
  },
  "secretsnake":
  {
    'id': '901885313608200302', 'snipeschannel': '1004682983036428308', 'emoji': {
      "Mythic": '<:mythic:1005118725189546164>',
      "Legendary": '<:legendary:1005118646038822962>',
      "Epic": '<:epic:1005118595765907466>',
      "Rare": '<:rare:1005118544377290762>',
      "Uncommon": '<:uncommon:1005118460596060242>',
      "Common": '<:common:1005118380988178542>'
    }
  }
}

//Collections the sniper bot will watch. Must be on moonrank.app
const sniperCollections = [
  ['monkeypox_nft', [], 2400],
  ['crypto_coral_tribe', [], 6565],
  ['yeah_tigers', [], 10000],
  ['sphynx_underground_society', [], 7777]
]

//build array of [0,1,2,etc] for each collection we have. These integers can be used to key access to sniperCollections arrary to loop other functions through all supported collections
var sniperSequencer = []
for (var i = 0; i < sniperCollections.length; i++) { sniperSequencer.push(i) }

var initialget = 20//how many listings will sniper get initially (max 20)
var refreshget = 10//how many will sniper get on each check (max 20) - should be less then initial get or extras will count as new
var maxlength = 50//how many records history will we keep for each collection
var minutes = 1, the_interval = minutes * 60 * 1000//refresh interval for sniper bot

//set rarity threshold percentages
const pmythic = 0.01
const plegendary = 0.05
const pepic = 0.15
const prare = 0.35
const puncommon = 0.6

//set multipliers above floor price at which listings become snipes
var mythiclimit = 50
var legendarylimit = 25
var epiclimit = 5
var rarelimit = 2.5

//start sniper bot
client.on('ready', async () => {
  initaliseSniperCollections()
  startsniper()
})//end client.on Ready

//=================
//====  Statup  ===
//=================

//test area
client.on('ready', () => {

  console.log('I am ready!')

  initaliseRarityCollections()

  //enable to reset commands
  //clearcommands()

});//end client.on Readys

//function to reset slash commands
async function clearcommands() {
  var serverkeys = Object.keys(servers)
  serverkeys.forEach((key, index) => {
    console.log(servers[key].id)
    const guild = client.guilds.cache.get(servers[key].id)
    guild.commands.set([])
  })
}//end function to reset commands

//===================================
//====  Functions for sniper bot  ===
//===================================

//returns x number of recent listings from Magic Eden
function getnewremoteMElistings(collection, number) {
  return new Promise((resolve, reject) => {
    var thiscollection = 'https://api-mainnet.magiceden.dev/v2/collections/' + collection + '/listings?offset=0&limit=' + number//build collection URL

    https.get(thiscollection, (resp) => {
      let data = ''
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk
      })

      // The whole response has been received.
      resp.on('end', () => {
        var thislistings = JSON.parse(data)
        resolve(thislistings)//return the recieved X listings
      })
    }).on("error", (err) => { console.log("Error: " + err.message) })
  }) //end promise
}//end getnewremoteMElistings function

//returns token details from Magic Eden
async function getremotetokendetails(mintaddress) {
  return new Promise((resolve, reject) => {
    var thisurl = 'https://api-mainnet.magiceden.dev/v2/tokens/' + mintaddress//build token URL

    https.get(thisurl, (resp) => {
      let data = ''
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk
      })

      // The whole response has been received.
      resp.on('end', () => {
        var thistoken = JSON.parse(data)
        resolve(thistoken)//return the recieved tokendetails
      })
    }).on("error", (err) => { console.log("Error: " + err.message) })
  }) //end promise
}//end getremotetokendetails function

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

//returns floor price from Magic Eden API
async function getremotefloorprice(collection) {
  return new Promise((resolve, reject) => {

    //build collection URL
    var thiscollection = 'https://api-mainnet.magiceden.dev/v2/collections/' + collection + '/stats'

    https.get(thiscollection, (resp) => {
      let data = ''
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk
      });
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        var rawFP = parseFloat(JSON.parse(data).floorPrice)//get FP in Sol
        var thisFP = rawFP / 1000000000
        resolve(thisFP)
      })
    }).on("error", (err) => { console.log("Error: " + err.message) })
  }) //end promise
}//end getremotefloorprice function

//returns rarity description (i.e. "Mythic" if its a snipe, else returns 'false') also returns 
async function testifsnipe(raritydescription, thisprice, floorprice) {
  return new Promise((resolve, reject) => {
    console.log('testing for snipe with an ' + raritydescription + ' at a list price of ' + thisprice + ' and the floor price is ' + floorprice)

    //make calculation of if this is a snipe using rarity, floor price and nft price
    var hotrarities = ['Mythic', 'Legendary', 'Epic', 'Rare']

    if (hotrarities.includes(raritydescription)) {

      //calculate snipe limits of x*fp
      var mythicsnipe = mythiclimit * floorprice
      var legendarysnipe = legendarylimit * floorprice
      var epicsnipe = epiclimit * floorprice
      var raresnipe = rarelimit * floorprice

      if ((raritydescription === 'Mythic') && (thisprice <= mythicsnipe)) {
        resolve([raritydescription, mythicsnipe, mythiclimit])

      } else if ((raritydescription === 'Legendary') && (thisprice <= legendarysnipe)) {
        resolve([raritydescription, legendarysnipe, legendarylimit])

      } else if ((raritydescription === 'Epic') && (thisprice <= epicsnipe)) {
        resolve([raritydescription, epicsnipe, epiclimit])

      } else if ((raritydescription === 'Rare') && (thisprice <= raresnipe)) {
        resolve([raritydescription, raresnipe, rarelimit])

      } else {
        resolve('false')
      }
    }//end if hotrarities
  }) //end promise
}//end testifsnipe function

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
}//end testifsnipe function

async function sendsnipes(server, snipeschannel, nftname, embedcolour, thisemoji, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage, listinglink) {
  return new Promise((resolve, reject) => {
    console.log('thissnipeprice (' + thissnipeprice + ') type is this type:' + typeof thissnipeprice)
    client.guilds.cache.get(server).channels.cache.get(snipeschannel).send({
      embeds: [
        {
          "title": 'Snipe Opportunity: ' + nftname,
          "color": embedcolour,
          "description": 'Buy at: ' + listinglink,
          "fields": [
            {
              "name": "Rarity",
              "value": thisrarity + ' - ' + raritydescription,
              "inline": true
            },
            {
              "name": "List Price",
              "value": pround(thisprice, 3) + ' SOL',
              "inline": true
            },
            {
              "name": "Floor Price",
              "value": pround(floorprice, 3) + ' SOL',
              "inline": true
            },
            {
              "name": "Snipe Price",
              "value": 'For ' + raritydescription + ' NFTs, any price less than ' + thislimit + 'x the floor price of ' + pround(floorprice, 3) + ' SOL is a snipe (i.e. less than ' + pround(thissnipeprice, 3) + ' SOL)',
              "inline": true
            }
          ],
          "image": {
            "url": thisimage,
            "height": 75,
            "width": 75
          },
          "footer": {
            "text": "Bot by Laniakea#3683"
          }
        }
      ]//end embed
    })//end message send
  }) //end promise
}//end sendsnipes function

const initaliseSniperCollections = async () => {
  for (const seq of sniperSequencer) {//for each collection
    //get initial set of listings and store them in the local history arrary for that collection
    await getnewremoteMElistings(sniperCollections[seq][0], initialget).then(async thislistings => {
      sniperCollections[seq][1] = thislistings//fill tracked listings with the listings we just got
      console.log('added initial ' + initialget + ' Listings for ' + sniperCollections[seq][0])
    })
    await wait(2000)//add delay between API requests
  }//for seq of sniperSequencer
}//end initaliseSniperCollections

//main sniper function
async function startsniper() {

  await Promise.all(sniperSequencer.map(async value => {
    var thisinterval = the_interval + (value * 1100)//interval for each collection is 1.1 seconds longer to avoid more than 2 ME API requests per second
    console.log('Initialising recheckloop for collection: ' + value + '. Setting interval for this collection to: ' + thisinterval)

    await setInterval(async function (k) {//do this every X minutes

      await getnewremoteMElistings(sniperCollections[k][0], refreshget).then(async thislistings => {//get latest X listings from Magic Eden

        console.log("I am doing my " + minutes + " minute check for " + sniperCollections[k][0] + '. I have this many in my history at start: ' + sniperCollections[k][1].length)

        var rebuildarrary = sniperCollections[k][1]//save all the acquired listings in a temporary arrary

        for (var i = 0; i < thislistings.length; i++) {//for all listings recieved from getnewremoteMElistingsfunction

          if (sniperCollections[k][1].some(e => (e.tokenAddress === thislistings[i].tokenAddress && e.price === thislistings[i].price))) {
            //actions if token address and price match (i.e. we've seen this one before)

          } else {
            //actions if token address or price does not match one we have seen before
            console.log('New/updated ' + sniperCollections[k][0] + ' entry ' + thislistings[i].tokenAddress + ' at price ' + thislistings[i].price)
            rebuildarrary.unshift(thislistings[i])//add the new entry to the start of the rebuild arrary so we can remember this one if we see it later

            //set price of this lisitng
            var thistoken = {}
            var thisprice = pround(thislistings[i].price, 6)
            var thisname = ''
            var thisnftid = ''
            var thisrarity = ''
            var thisranges = []
            var thisraritydescription = ''
            var thisfloorprice = 0
            var thissnipe = ''
            var thisembedcolour = ''
            var thissnipeprice = 0
            var thislimit = 0
            var thisimage = ''
            var thislistinglink = ''

            getremotetokendetails(thislistings[i].tokenMint)
              .then((recievedtoken) => {

                thistoken = recievedtoken
                thisname = thistoken.name
                thisimage = thistoken.image
                thislistinglink = 'https://magiceden.io/item-details/' + thistoken.mintAddress

                //get nft ID
                let namearr = thistoken.name.split(' ')
                for (var i = 0; i < namearr.length; i++) {
                  let checkthis = namearr[i]
                  if (checkthis.includes('#')) {

                    var nlength = checkthis.length
                    thisnftid = checkthis.substring(1, nlength)

                  }//end if
                }//end for

                //get rarity
                for (var i = 0; i < sniperCollections[k][1].length; i++) {

                  if (thistoken.mintAddress == sniperCollections[k][1][i].tokenMint) {
                    thisrarity = sniperCollections[k][1][i].rarity.moonrank.rank//end moonrank data from ME
                    break
                  }
                }

                return calculateranges(sniperCollections[k][2])

              })//end .then
              .then((ranges) => {

                var mythicstart = ranges[0]; var mythicend = ranges[1]
                var legendarystart = ranges[2]; var legendaryend = ranges[3]
                var epicstart = ranges[4]; var epicend = ranges[5]
                var rarestart = ranges[6]; var rareend = ranges[7]
                var uncommonstart = ranges[8]; var uncommonend = ranges[9]
                var commonstart = ranges[10]; var commonend = ranges[11]

                thisranges = ranges//store outside subsection so we can access it

                return getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, thisrarity)
              })//end .then
              .then((raritydescription) => {

                thisraritydescription = raritydescription//store outside subsection so we can access it

                return getremotefloorprice(sniperCollections[k][0])
              })//end .then
              .then((floorprice) => {

                thisfloorprice = pround(floorprice, 6)//store outside subsection so we can access it

                return testifsnipe(thisraritydescription, thisprice, thisfloorprice)
              })//end .then
              .then((snipe) => {

                //store outside subsection so we can access it
                thissnipe = snipe[0]
                thissnipeprice = snipe[1]
                thislimit = snipe[2]

                if (thissnipe != "false") {
                  console.log('we have a ' + sniperCollections[k][0] + ' snipe!')
                  return getembedcolour(thisraritydescription)
                }
              })//end .then
              .then((embedcolour) => {

                thisembedcolour = embedcolour//store outside subsection so we can access it
                var thisserver = ''
                var thisserverid = ''
                var thissnipechannel = ''
                var thisemoji = ''

                if (thissnipe != "false") {//if this is a snipe get emoji and send messages out to each server
                  var serverkeys = Object.keys(servers)
                  serverkeys.forEach((key, index) => {//for each server

                    //get the snipes channel id from the servers config object
                    var emojis = Object.keys(servers[key].emoji)
                    thisserver = servers[key]
                    thisserverid = servers[key].id
                    thissnipechannel = servers[key].snipeschannel

                    emojis.forEach((key, index) => {//loop through each potential emoji
                      if (key === thisraritydescription) { thisemoji = thisserver.emoji[key] }//end if key matches emoji we are looking for
                    })//end for each potential emoji loop

                    //send snipes
                    sendsnipes(thisserverid, thissnipechannel, thisname, thisembedcolour, thisemoji, thisrarity, thisraritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink)

                  })//end for each server
                }//end if this is a snipe
              })//end .then

          }//end else for a token we havnt seen before

        }//end for loop of each listing recieved

        //for each collection we store a max history. Clear the oldest ones if it's longer than that. 
        if (rebuildarrary.length > maxlength) {
          var numbertoremove = rebuildarrary.length - maxlength
          console.log('number to remove is: ' + numbertoremove)
          for (var i = 0; i < numbertoremove; i++) {
            console.log("1 removal loop - popping here")
            rebuildarrary.pop()//remove oldest entry
          }//end for number to remove
        }//end if rebuildarrary is longer than max length

        sniperCollections[k][1] = rebuildarrary//overwrite main listings arrary with the temp rebuild one

      })//end then after getting 

    }, thisinterval, value)//end recheck listing loop
  })
  )
}//end startsniper

//=========================
//==== Other Functions  ===
//=========================

const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

//get complete howrare.is dataset
function getRemoteHowRareData(collection) {
  return new Promise((resolve, reject) => {
    var thiscollection = 'https://api.howrare.is/v0.1/collections/' + collection//build collection URL

    https.get(thiscollection, (resp) => {
      let data = ''
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk
      })

      // The whole response has been received.
      resp.on('end', () => {
        var thiscollection = JSON.parse(data)
        resolve(thiscollection)//return the recieved X listings
      })
    }).on("error", (err) => { console.log("Error: " + err.message) })
  }) //end promise
}//end getremoteHowRareData function

const initaliseRarityCollections = async () => {
  await wait(10000)
  for (const seq of raritySequencer) { //for each collection
    //get initial set of listings and store them in the local history arrary for that collection
    await getRemoteHowRareData(rarityCollections[seq][0]).then(async thisdata => {
      rarityCollections[seq][1] = thisdata //fill tracked listings with the listings we just got
      console.log('loaded Howrare.is data for ' + rarityCollections[seq][0])
    })
    await wait(4000)//add delay between API requests
  }//end for each seq of raritySequencer
}//end initaliseRarityCollections

//older functions

//get ranges for this collection (from local data)
function getlocalranges(collection) {

  //initialise threshold variables
  var mythicstart = 0; var mythicend = 0
  var legendarystart = 0; var legendaryend = 0
  var epicstart = 0; var epicend = 0
  var rarestart = 0; var rareend = 0
  var uncommonstart = 0; var uncommonend = 0
  var commonend = 0; var commonend = 0

  //mythic range (start of range is 1)
  mythicstart = 1;
  mythicend = Math.floor(collections[collection].result.data.items.length * pmythic)

  //legendary range
  legendarystart = Math.ceil(collections[collection].result.data.items.length * pmythic)
  if (legendarystart === mythicend) { legendarystart = legendarystart + 1 }
  legendaryend = Math.floor(collections[collection].result.data.items.length * plegendary)

  //epic range
  epicstart = Math.ceil(collections[collection].result.data.items.length * plegendary)
  if (epicstart === legendaryend) { epicstart = epicstart + 1 }
  epicend = Math.floor(collections[collection].result.data.items.length * pepic)

  //rare range
  rarestart = Math.ceil(collections[collection].result.data.items.length * pepic)
  if (rarestart === epicend) { rarestart = rarestart + 1 }
  rareend = Math.floor(collections[collection].result.data.items.length * prare)

  //uncommon range
  uncommonstart = Math.ceil(collections[collection].result.data.items.length * prare)
  if (uncommonstart === rareend) { Uncommonstart = uncommonstart + 1 }
  uncommonend = Math.floor(collections[collection].result.data.items.length * puncommon)

  //common range (end of range is same as NFT count)
  commonstart = Math.ceil(collections[collection].result.data.items.length * puncommon)
  if (commonstart === uncommonend) { commonstart = commonstart + 1 }
  commonend = collections[collection].result.data.items.length

  console.log('Mythic: ' + mythicstart + ' - ' + mythicend + '. Legendary: ' + legendarystart + ' - ' + legendaryend + '. Epic: ' + epicstart + ' - ' + epicend + '. Rare: ' + rarestart + ' - ' + rareend + '. Uncommon: ' + uncommonstart + ' - ' + uncommonend + '. Common: ' + commonstart + ' - ' + commonend + '.')

  var returnranges = [collection, mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend]

  return (returnranges)//return arrary

}//end getlocalranges function

//get rarity rank by nft# from local data
function checklocalrarity(nftnumber, collection) {

  //initalise some variables as strings
  var raritydescription = ""; var emoji = ""; var embedcolor = ""; var thisrarity = ""; var thisname = ""; var thisimage = ""

  //calculate the ranges for this checklocalrarity test
  var thisranges = getlocalranges(collection)

  //seperate out ranges returned from function
  var mythicstart = thisranges[1]; var mythicend = thisranges[2]
  var legendarystart = thisranges[3]; var legendaryend = thisranges[4]
  var epicstart = thisranges[5]; var epicend = thisranges[6]
  var rarestart = thisranges[7]; var rareend = thisranges[8]
  var uncommonstart = thisranges[9]; var uncommonend = thisranges[10]
  var commonend = thisranges[11]; var commonend = thisranges[12]

  //loop through NFTs in collection looking for NFT ID. If found set thisrarity to statistical rarity
  for (var i = 0; i < collections[collection].result.data.items.length; i++) {

    if (collections[collection].result.data.items[i].id == nftnumber) {
      //console.log('found ' + collections[collection].result.data.items[i].name)
      thisrarity = collections[collection].result.data.items[i].all_ranks.statistical_rarity
      thisname = collections[collection].result.data.items[i].name
      thisimage = collections[collection].result.data.items[i].image
      //console.log('this rarity is: ' + thisrarity)
    }//end if

  }//end for

  if (thisrarity != null) {

    //console.log('NFT rarity found in the databse')

    //if mythic
    if (thisrarity >= mythicstart && thisrarity <= mythicend) {
      //console.log('mythic!')
      raritydescription = 'Mythic'
      emoji = '<:mythic:997639717665386586>'
      embedcolor = 0xed2839
    }

    //if Legendary
    else if (thisrarity >= legendarystart && thisrarity <= legendaryend) {
      //console.log('legendary!')
      raritydescription = 'Legendary'
      emoji = '<:legendary:997639764943585421>'
      embedcolor = 0xfe8100
    }

    //if epic
    else if (thisrarity >= epicstart && thisrarity <= epicend) {
      //console.log('epic!')
      raritydescription = 'Epic'
      emoji = '<:epic:997639797558497421>'
      embedcolor = 0x9901f6
    }

    //if rare
    else if (thisrarity >= rarestart && thisrarity <= rareend) {
      //console.log('Rare!')
      raritydescription = 'Rare'
      emoji = '<:rare:997639830844477471>'
      embedcolor = 0x19aaeb
    }

    //if uncommon
    else if (thisrarity >= uncommonstart && thisrarity <= uncommonend) {
      //console.log('uncommmon!')
      raritydescription = 'Uncommon'
      emoji = '<:uncommon:997639865065799770>'
      embedcolor = 0x20d48a
    }

    //if common
    else if (thisrarity >= commonstart && thisrarity <= commonend) {
      //console.log('Common')
      raritydescription = 'Common'
      emoji = '<:common:997639893306064997>'
      embedcolor = 0x939394
    }

    else {//this shouldnt trigger if the key is found and the data is complete
      console.log('Not found'); raritydescription = 'Not found'; emoji = '<:common:997639893306064997>'; embedcolor = 0x939394
    }

    //set up array to return
    var nftproperties = [nftnumber, raritydescription, emoji, embedcolor, thisrarity, thisname, thisimage]
    return (nftproperties)//return arrary

  } else {//if nftkey was not found in DB
    var nftproperties = [nftnumber, 'Not found', '<:common:997639893306064997>', 0x3b0202, 'Not Found', 'No Name', '']
    return (nftproperties)
  }//end if nft is in object
}//end checklocalrarity function

//=========================
//====  Rarity checker  ===
//=========================

async function getlocalNFTpoperties(thiscollection, nftid) {
  return new Promise((resolve, reject) => {
    var thisrarity = ''
    var thisname = ''
    var thisimage = ''

    console.log('testing a getlocalNFTpoperties')

    for (var i = 0; i < rarityCollections.length; i++) {//loop through collections to find the one this rarity check is for
      if (rarityCollections[i][0] === thiscollection) {

        console.log('this collections lenght is: ' + rarityCollections[i][1].result.data.items.length)

        for (var j = 0; j < rarityCollections[i][1].result.data.items.length; j++) {

          if (rarityCollections[i][1].result.data.items[j].id == nftid) {
            console.log('found ' + rarityCollections[i][1].result.data.items[j].name)
            thisrarity = rarityCollections[i][1].result.data.items[j].all_ranks.statistical_rarity
            thisname = rarityCollections[i][1].result.data.items[j].name
            thisimage = rarityCollections[i][1].result.data.items[j].image
            console.log('this rarity is: ' + thisrarity)
          }//end if
          resolve([thisrarity, thisname, thisimage])
        }//end for

      }
    }

    //loop through NFTs in collection looking for NFT ID. If found set thisrarity to statistical rarity

  })//end promise
}//end function

//respond to slash command
client.ws.on('INTERACTION_CREATE', async interaction => {
  const command = interaction.data.name.toLowerCase()
  const args = interaction.data.options//array of the provided data after the slash

  if (command === 'checkrarity') {

    var thiscollection = args[0].value
    var thisnftnumber = args[1].value

    var thisrarity = ""
    var thisraritydescription = ""
    var thisembedcolour = 0
    var thisname = ""
    var thisimage = ""

    //new
    for (var i = 0; i < rarityCollections.length; i++) {//loop through collections to find the one this rarity check is for
      if (rarityCollections[i][0] === thiscollection) {
        await getlocalNFTpoperties(thiscollection, thisnftnumber).then((returnedrarity) => {

          thisrarity = returnedrarity[0]
          thisname = returnedrarity[1]
          thisimage = returnedrarity[2]

          return calculateranges(rarityCollections[i][2])
        })
          .then((ranges) => {

            var mythicstart = ranges[0]; var mythicend = ranges[1]
            var legendarystart = ranges[2]; var legendaryend = ranges[3]
            var epicstart = ranges[4]; var epicend = ranges[5]
            var rarestart = ranges[6]; var rareend = ranges[7]
            var uncommonstart = ranges[8]; var uncommonend = ranges[9]
            var commonstart = ranges[10]; var commonend = ranges[11]

            return getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, thisrarity)
          })//end .then
          .then((raritydescription) => {

            thisraritydescription = raritydescription//store outside subsection so we can access it

            return getembedcolour(thisraritydescription)
          })
          .then((embedcolour) => {

            thisembedcolour = parseInt(embedcolour, 16)

            if (thisraritydescription != 'Not found') {//if NFT number was not found in DB, 'Not found' would be returned. If it was found, proceed
              client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                  type: 4,
                  data: {
                    embeds: [
                      {
                        "title": thisname,
                        "color": thisembedcolour,
                        "fields": [
                          {
                            "name": "Rarity",
                            "value": thisrarity + ' - ' + thisraritydescription,
                            "inline": true
                          }
                        ],
                        "image": {
                          "url": thisimage,
                          "height": 75,
                          "width": 75
                        },
                        "footer": {
                          "text": "Bot by Laniakea#3683"
                        }
                      }
                    ]//end embed
                  }//end message data
                }//end post data
              })//end post()

            } else {//end if rarity description != not found
              client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                  type: 4,
                  data: {
                    embeds: [
                      {
                        "title": 'Token not found in database',
                        "color": thisembedcolour,
                        "fields": [
                          {
                            "name": "Rarity",
                            "value": thisrarity + ' - ' + thisraritydescription,
                            "inline": true
                          }
                        ],
                        "footer": {
                          "text": "Bot by Laniakea#3683"
                        }
                      }
                    ]//end embed
                  }//end message data
                }//end post data
              })//end post()
            }//end else (if rarity description = 'Not found')
          })//end .then embedcolour
      }//end if matched collection
    }//end loop through rarityCollections.length

  }//end if command = rarity
})//end response to slash command

//==============================
//====  Setup slash command  ===
//==============================

//setup discord slash command
client.on('ready', () => {

  //add supported collections from rarityCollections to the slash command
  var choices = []
  for (var i = 0; i < rarityCollections.length; i++) {
    choices.push({ "name": rarityCollections[i][0], "value": rarityCollections[i][0] })
  }//end for

  var serverkeys = Object.keys(servers)
  serverkeys.forEach((key, index) => {
    client.api.applications(client.user.id).guilds(servers[key].id).commands.post({//adding commmand to our servers
      data: {
        "name": "checkrarity",
        "description": "Check the rarity of an NFT in a collection we support",
        "options": [
          {
            "type": 3,
            "name": "collection",
            "description": "Please select a collection",
            "choices": choices,
            "required": true
          },
          {
            "type": 3,
            "name": "nftnumber",
            "description": "Enter the # of the NFT to check in selected collection",
            "required": true
          }
        ]
      }//end data
    });//end post
  })//end for each server loop
});//end client on ready
