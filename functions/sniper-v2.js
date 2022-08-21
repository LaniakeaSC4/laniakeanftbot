const main = require('../bot.js')
const magiceden = require('./magicedenRPC.js')//Magic Eden related commands are in here
const nfttools = require('./nfttools.js')//generic nft tools like get rarity description from rank in here
const postgress = require('./postgres.js')//postgress related commands are in here
const metaplex = require('./metaplexRPC.js')//metaplex RPC. Work with database collections

//get supported collections 

var collections = {} 

//old
/*
const sniperCollections = [
  ['monkeypox_nft', [], 2400],
  ['crypto_coral_tribe', [], 6565],
  ['yeah_tigers', [], 10000],
  ['sphynx_underground_society', [], 7777]
]*/

//build array of [0,1,2,etc] for each collection we have. These integers can be used to key access to sniperCollections arrary to loop other functions through all supported collections
var sniperSequencer = []

var initialget = 20//how many listings will sniper get initially (max 20)
var refreshget = 10//how many will sniper get on each check (max 20) - should be less then initial get or extras will count as new
var maxlength = 50//how many records history will we keep for each collection
var minutes = 0.5, the_interval = minutes * 60 * 1000//refresh interval for sniper bot

//set multipliers above floor price at which listings become snipes
var mythiclimit = 50
var legendarylimit = 25
var epiclimit = 5
var rarelimit = 2.5

const initaliseSniperCollections = async () => {
  collections = await postgress.getSupportedCollections()
  console.log('log collections')
  console.log(collections)
  for (var i = 0; i < collections.length; i++) { sniperSequencer.push(i) }
  
  for (const seq of sniperSequencer) {//for each collection
    //get initial set of listings and store them in the local history arrary for that collection
    await magiceden.getNewListings(collections[seq]['meslug'], initialget).then(async thislistings => {
      collections[seq]['listings'] = thislistings//fill tracked listings with the listings we just got
      console.log('SniperV2: added initial ' + initialget + ' Listings for ' + collections[seq]['meslug'])
    })//end then
    await main.wait(2000)//add delay between API requests
  }//for seq of sniperSequencer
  startsniper()
}//end initaliseSniperCollections
module.exports.initialise = initaliseSniperCollections

//main sniper function
async function startsniper() {
  console.log('SniperV2: starting main function')
  console.log('SniperV2: sniperSequencer is')
  console.log(sniperSequencer)
  await Promise.all(sniperSequencer.map(async value => {//this was added to make sure to sequentially initiate the sniper loops. Not sure its working as intended, but loops are spread out
    var thisinterval = the_interval + (value * 1100)//interval for each collection is 1.1 seconds longer to avoid more than 2 ME API requests per second
    console.log('SniperV2: Initialising recheckloop for collection: ' + value + '. Setting interval for this collection to: ' + thisinterval)

    await setInterval(async function (k) {//do this every X minutes
      await magiceden.getNewListings(collections[k]['meslug'], refreshget).then(async thislistings => {//get latest X listings from Magic Eden
        /* heartbeat logging - enable if you want update each minute for each collection */
        //console.log("I am doing my " + minutes + " minute check for " + sniperCollections[k][0] + '. I have this many in my history at start: ' + sniperCollections[k][1].length)

        var rebuildarrary = collections[k]['listings']//save all the acquired listings in a temporary arrary
        
//console.log('SniperV2: logging listings')
//console.log(collections[k]['listings'])

        for (var i = 0; i < thislistings.length; i++) {//for all listings recieved from magiceden.getNewListings function

          if (collections[k]['listings'].some(e => (e.tokenAddress === thislistings[i].tokenAddress && e.price === thislistings[i].price))) {
            //actions if token address and price match (i.e. we've seen this one before)
          } else {
            //actions if token address or price does not match one we have seen before
            console.log('SniperV2: New/updated ' + collections[k]['meslug'] + ' entry ' + thislistings[i].tokenAddress + ' at price ' + thislistings[i].price)
            rebuildarrary.unshift(thislistings[i])//add the new entry to the start of the rebuild arrary so we can remember this one if we see it later

            var thisprice = main.pround(thislistings[i].price, 6)//set price of this lisitng
            var recievedtoken = await magiceden.getTokenDetails(thislistings[i].tokenMint)

            var thistoken = recievedtoken
            var thisname = thistoken.name
            var thisimage = thistoken.image
            var thislistinglink = 'https://magiceden.io/item-details/' + thistoken.mintAddress

            //get nft from nane
            var thisnftid = ''
           
            let namearr = thistoken.name.split(' ')
            for (var i = 0; i < namearr.length; i++) {
              let checkthis = namearr[i]
              if (checkthis.includes('#')) {
                var nlength = checkthis.length
                thisnftid = checkthis.substring(1, nlength)
              }//end if
            }//end for

var NFTdata = await metaplex.getNFTdata(collections[k]['collectionkey'], thisnftid)
	//console.log(NFTdata)
	var collectionSize = await postgress.getData("solanametaplex", "collectionkey", collections[k]['collectionkey'], 'collectioncount') 
	console.log('SniperV2: collectionsize is: ' + collectionSize)
	
	
	var ranges = await nfttools.calculateranges(collectionSize)

      var mythicstart = ranges[0]; var mythicend = ranges[1]
      var legendarystart = ranges[2]; var legendaryend = ranges[3]
      var epicstart = ranges[4]; var epicend = ranges[5]
      var rarestart = ranges[6]; var rareend = ranges[7]
      var uncommonstart = ranges[8]; var uncommonend = ranges[9]
      var commonstart = ranges[10]; var commonend = ranges[11]

      var raritydescription = await nfttools.getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, NFTdata.rarityRank)

      var embedcolour = await nfttools.getembedcolour(raritydescription)
      var thisembedcolour = parseInt(embedcolour, 16)















/*
            //get rarity
            for (var i = 0; i < sniperCollections[k][1].length; i++) {
              if (thistoken.mintAddress == sniperCollections[k][1][i].tokenMint) {
                thisrarity = sniperCollections[k][1][i].rarity.moonrank.rank//end moonrank data from ME
                break
              }//end if
            }//end for

            var ranges = await nfttools.calculateranges(sniperCollections[k][2])

            var mythicstart = ranges[0]; var mythicend = ranges[1]
            var legendarystart = ranges[2]; var legendaryend = ranges[3]
            var epicstart = ranges[4]; var epicend = ranges[5]
            var rarestart = ranges[6]; var rareend = ranges[7]
            var uncommonstart = ranges[8]; var uncommonend = ranges[9]
            var commonstart = ranges[10]; var commonend = ranges[11]

            var raritydescription = await nfttools.getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, thisrarity)
            */
            
            var floorprice = await magiceden.getFloorPrice(collections[k]['collectionkey'])
            var thisfloorprice = main.pround(floorprice, 6)
            var snipe = await testifsnipe(raritydescription, thisprice, thisfloorprice)

            var thissnipe = snipe[0]
            var thissnipeprice = snipe[1]
            var thislimit = snipe[2]

            if (thissnipe != "false") {
              console.log('SniperV2: we have a ' + collections[k]['meslug'] + ' snipe!')

              /*
              var embedcolour = await nfttools.getembedcolour(raritydescription)
              var thisembedcolour = parseInt(embedcolour, 16)//store outside subsection so we can access it
              */

              var thisserver = ''
              var thisserverid = ''
              var thissnipechannel = ''

              if (thissnipe != "false") {//if this is a snipe send messages out to each server
                var serverkeys = Object.keys(main.servers)
                serverkeys.forEach((key, index) => {//for each server

                  //get the snipes channel id from the servers config object
                  thisserver = main.servers[key]
                  thisserverid = main.servers[key].id
                  thissnipechannel = main.servers[key].v2snipechannel

                  //send snipes
                  sendsnipes(thisserverid, thissnipechannel, thisname, thisembedcolour, NFTdata.rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink)

                })//end for each server
              }//end if this is a snipe
            }//end if not false
          }//end else for a token we havnt seen before
        }//end for loop of each listing recieved

        //for each collection we store a max history. Clear the oldest ones if it's longer than that. 
        if (rebuildarrary.length > maxlength) {
          var numbertoremove = rebuildarrary.length - maxlength
          console.log('SniperV2: number to remove is: ' + numbertoremove)
          for (var i = 0; i < numbertoremove; i++) {
            console.log("SniperV2: 1 removal loop - popping here")
            rebuildarrary.pop()//remove oldest entry
          }//end for number to remove
        }//end if rebuildarrary is longer than max length

        collections[k]['listings'] = rebuildarrary//overwrite main listings arrary with the temp rebuild one

      })//end then after getting 
    }, thisinterval, value)//end recheck listing loop
  })//end snipersequencer values
  )//end promise.all
}//end startsniper
module.exports.start = startsniper

async function sendsnipes(server, snipeschannel, nftname, embedcolour, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage, listinglink) {
  return new Promise((resolve, reject) => {
    main.client.guilds.cache.get(server).channels.cache.get(snipeschannel).send({
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
              "value": main.pround(thisprice, 3) + ' SOL',
              "inline": true
            },
            {
              "name": "Floor Price",
              "value": main.pround(floorprice, 3) + ' SOL',
              "inline": true
            },
            {
              "name": "Snipe Price",
              "value": 'For ' + raritydescription + ' NFTs, any price less than ' + thislimit + 'x the floor price of ' + main.pround(floorprice, 3) + ' SOL is a snipe (i.e. less than ' + main.pround(thissnipeprice, 3) + ' SOL)',
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

//returns rarity description (i.e. "Mythic" if its a snipe, else returns 'false') also returns 
async function testifsnipe(raritydescription, thisprice, floorprice) {
  return new Promise((resolve, reject) => {
    console.log('SniperV2: testing for snipe with an ' + raritydescription + ' at a list price of ' + thisprice + ' and the floor price is ' + floorprice)

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
