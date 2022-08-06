const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] })
const https = require('https')

client.login(process.env.BOTTOKEN)

//main collections array
const collections = []

//import collections
const mpoxdata = require('./monkeypox_nft.json')
const pixelguilddata = require('./pixel_guild_loot_legends.json')
const wanderingnahavidata = require('./wandering_nahavi.json')

//add collections to arrary
collections['monkeypox_nft'] = mpoxdata
collections['pixel_guild_loot_legends'] = pixelguilddata
collections['wandering_nahavi'] = wanderingnahavidata

//================
//====  Setup  ===
//================

//channels and servers
const monkeyserver = '978975057739124767'

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

//what are the requirements? Moonrank data on ME? Anything else? 
const ourcollections = [
  ['monkeypox_nft',[],2400],
  ['crypto_coral_tribe',[],6565]
  ]

var sequences = []
for (var i = 0;i < ourcollections.length;i++) {
  sequences.push(i)
  console.log(sequences)
}

//set rarity threshold percentages
const pmythic = 0.01
const plegendary = 0.05
const pepic = 0.15
const prare = 0.35
const puncommon = 0.6

//=================
//====  Statup  ===
//=================

//test area
client.on('ready', () => {

  console.log('I am ready!')

  //endable to reset commands
  //clearcommands()

});//end client.on Readys

//function to reset slash commands
async function clearcommands() {
  const guild = await client.guilds.fetch(monkeyserver)
  guild.commands.set([]);
}//end function to reset commands

//==========================
//====  ME new listings  ===
//==========================

//check ME API for new listings test
client.on('ready', async () => {

  var initialget = 20//how many will we get initially (max 20)
  var refreshget = 10//how many will we get on each check (max 20) - should be less then initial get or extras will count as new
  var maxlength = 50//how many records will we keep
  var minutes = 1, the_interval = minutes * 60 * 1000//refresh interval

  //get some listings on startup
  
  for (var i = 0;i < ourcollections.length;i++){
  await getnewremotelistings(ourcollections[i][0], initialget).then(async thislistings => {
    ourcollections[i][1] = thislistings//fill tracked listings with the listings we just got
    console.log('added initial ' + initialget + ' Listings for ' + ourcollections[i][0])
    //console.log(listings[0])
  })//end then
  }//end for 



startsniper()

})//end client.on Ready

//===================================
//====  Functions for sniper bot  ===
//===================================

//returns x number of recent listings from Magic Eden
function getnewremotelistings(collection, number) {
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
}//end getnewremotelistings function

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
    return ('not ranked')
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
    console.log('testing for snipe with ' + raritydescription + thisprice + floorprice)

    //make calculation of if this is a snipe using rarity, floor price and nft price
    var hotrarities = ['Mythic', 'Legendary', 'Epic', 'Rare']

    if (hotrarities.includes(raritydescription)) {

      //set multipliers above floor price at which listings become snipes
      var mythiclimit = 100
      var legendarylimit = 50
      var epiclimit = 10
      var rarelimit = 5

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

async function sendsnipes(server, snipeschannel, nftname, embedcolour, thisemoji, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage,listinglink) {
  return new Promise((resolve, reject) => {
    client.guilds.cache.get(server).channels.cache.get(snipeschannel).send({
      "content": "@everyone",
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
              "name": "Snipe Price",
              "value": 'For ' + raritydescription + ': ' + thislimit + 'x floor price of ' + floorprice + 'SOL (' + thissnipeprice + 'SOL)',
              "inline": true
            },
            {
              "name": "List Price",
              "value": thisprice + ' SOL',
              "inline": true
            },
            {
              "name": "Floor Price",
              "value": floorprice + ' SOL',
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

//main sniper function
async function startsniper() {
  
  await Promise.all(sequences.map(async value => {
    var thisinterval = the_interval + (value*1100)//interval for each collection is 1.1 seconds longer to avoid more than 2 ME API requests per second
    console.log('executing a function. Value is: ' + value + '. Setting interval to: ' + thisinterval)

  await setInterval(async function (k) {//do this every X minutes
    console.log("I am doing my " + minutes + " minute check for " + ourcollections[k][0])

    await getnewremotelistings(ourcollections[k][0], refreshget).then(async thislistings => {//get latest X listings from Magic Eden

      console.log(ourcollections[k][0] + 'listings arrary length at start: ' + ourcollections[k][1].length)

      var rebuildarrary = ourcollections[k][1]//save all the acquired listings in a temporary arrary

      for (var i = 0; i < thislistings.length; i++) {//for all listings recieved from getnewremotelistingsfunction

        if (ourcollections[k][1].some(e => (e.tokenAddress === thislistings[i].tokenAddress && e.price === thislistings[i].price))) {
          //actions if token address and price match (i.e. we've seen this one before)
          //console.log('matched ' + thislistings[i].tokenAddress + ' at price ' + thislistings[i].price)

        } else {
          //actions if token address or price does not match one we have seen before
          console.log('New/updated ' + ourcollections[k][0] + ' entry ' + thislistings[i].tokenAddress + ' at price ' + thislistings[i].price)
          rebuildarrary.unshift(thislistings[i])//add the new entry to the start of the rebuild arrary so we can remember this one if we see it later

          //set price of this lisitng
          var thistoken = {}
          var thisprice = thislistings[i].price
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

          console.log('getting ' +  ourcollections[k][0] + ' token details from magic eden')
          getremotetokendetails(thislistings[i].tokenMint)
            .then((recievedtoken) => {
              
              thistoken = recievedtoken
              thisname = thistoken.name
              thisimage = thistoken.image
              thislistinglink = 'https://magiceden.io/item-details/' + thistoken.mintAddress
console.log(thislistinglink)
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
              for (var i = 0; i < ourcollections[k][1].length; i++) {

                if (thistoken.mintAddress == ourcollections[k][1][i].tokenMint) {
                  thisrarity = ourcollections[k][1][i].rarity.moonrank.rank//end moonrank data from ME
                  break
                }
              }

              return calculateranges(ourcollections[k][2])

            })//end .then
            .then((ranges) => {

              var mythicstart = ranges[0]; var mythicend = ranges[1]
              var legendarystart = ranges[2]; var legendaryend = ranges[3]
              var epicstart = ranges[4]; var epicend = ranges[5]
              var rarestart = ranges[6]; var rareend = ranges[7]
              var uncommonstart = ranges[8]; var uncommonend = ranges[9]
              var commonstart = ranges[10]; var commonend = ranges[11]

              thisranges = ranges//store outside subsection so we can access it
console.log('epicstart is:' + epicstart)
              return getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, thisrarity)
            })//end .then
            .then((raritydescription) => {

              thisraritydescription = raritydescription//store outside subsection so we can access it

              return getremotefloorprice(ourcollections[k][0])
            })//end .then
            .then((floorprice) => {

              thisfloorprice = floorprice//store outside subsection so we can access it
              console.log('Floor price is: ' + thisfloorprice)

              return testifsnipe(thisraritydescription, thisprice, thisfloorprice)
            })//end .then
            .then((snipe) => {

//store outside subsection so we can access it
              thissnipe = snipe[0]
              thissnipeprice = snipe[1]
              thislimit = snipe[2]

              if (thissnipe != "false") {
                console.log('we have a ' + ourcollections[k][0] + ' snipe!')
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
                  sendsnipes(thisserverid,thissnipechannel,thisname,thisembedcolour,thisemoji,thisrarity,thisraritydescription,thislimit,thisfloorprice,thissnipeprice,thisprice,thisimage,thislistinglink)

                })//end for each server
              }//end if this is a snipe
            })//end .then

        }//end else for a token we havnt seen before

      }//end for loop of each listing recieved

      console.log(ourcollections[k][0] + ' listings arrary length at end: ' + ourcollections[k][1].length)

      //for each collection we store a max history. Clear the oldest ones if it's longer than that. 
      if (rebuildarrary.length > maxlength) {
        var numbertoremove = rebuildarrary.length - maxlength
        console.log('number to remove is: ' + numbertoremove)
        for (var i = 0; i < numbertoremove; i++) {
          console.log("1 removal loop - popping here")
          rebuildarrary.pop()//remove oldest entry
        }//end for number to remove
      }//end if rebuildarrary is longer than max length

      ourcollections[k][1] = rebuildarrary//overwrite main listings arrary with the temp rebuild one

    })//end then after getting 

  }, thisinterval, value)//end recheck listing loop
  })
)
}//end startsniper

//=========================
//==== Other Functions  ===
//=========================

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
      console.log('not ranked'); raritydescription = 'not ranked'; emoji = '<:common:997639893306064997>'; embedcolor = 0x939394
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

//respond to slash command
client.ws.on('INTERACTION_CREATE', async interaction => {
  const command = interaction.data.name.toLowerCase()
  const args = interaction.data.options//array of the provided data after the slash

  if (command === 'checkrarity') {

    var nftproperties = checklocalrarity(args[1].value, args[0].value)//first argument should be the nft #. Send it to checklocalrarity function. Returns array.

    //split up returned array
    var nftnumber = nftproperties[0]; var raritydescription = nftproperties[1]; var emoji = nftproperties[2]; var embedcolor = nftproperties[3]; var thisrarity = nftproperties[4]; var nftname = nftproperties[5]; var thisimage = nftproperties[6];

    if (raritydescription != 'Not found') {//if NFT number was not found in DB, 'Not found' would be returned. If it was found, proceed
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            embeds: [
              {
                "title": nftname,
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": emoji + emoji + '|  ' + thisrarity + ' - ' + raritydescription + '  |' + emoji + emoji,
                    "inline": true
                  }
                ],
                "image": {
                  "url": thisimage,
                  "height": 75,
                  "width": 75
                },
                "footer": {
                  "text": "Rarity data provided by howrare.is"
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
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": emoji + emoji + '|  ' + ' - ' + raritydescription + '  |' + emoji + emoji,
                    "inline": true
                  }
                ],
                "footer": {
                  "text": "Rarity data provided by howrare.is"
                }
              }
            ]//end embed
          }//end message data
        }//end post data
      })//end post()
    }//end else (if rarity description = 'Not found')
  }//end if command = rarity
})//end response to slash command

//==============================
//====  Setup slash command  ===
//==============================

//setup discord slash command
client.on('ready', () => {
  var serverkeys = Object.keys(servers)
  serverkeys.forEach((key, index) => {
    console.log(servers[key].id);
    client.api.applications(client.user.id).guilds(servers[key].id).commands.post({//adding commmand to our servers
      data: {
        "name": "checkrarity",
        "description": "Check the rarity of an NFT in a collection we support",
        "options": [
          {
            "type": 3,
            "name": "collection",
            "description": "Please select a collection",
            "choices": [
              {
                "name": "MonkeyPox NFT",
                "value": "monkeypox_nft"
              },
              {
                "name": "Pixel Guild",
                "value": "pixel_guild_loot_legends"
              }
            ],
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
