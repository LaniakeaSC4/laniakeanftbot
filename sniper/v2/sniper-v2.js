var discord = require('../../clients/discordclient.js')
const client = discord.getClient()
const w = require('../../tools/winston.js')
const magiceden = require('../magicedenRPC.js')//Magic Eden related commands are in here
const nfttools = require('../../tools/nfttools.js')//generic nft tools like get rarity description from rank in here
const sql = require('../../tools/commonSQL.js')//sql related commands are in here
const snipersender = require('./snipersender.js')

const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

var collections = {}

//build array of [0,1,2,etc] for each collection we have. These integers can be used to key access to sniperCollections arrary to loop other functions through all supported collections
var sniperSequencer = []

var initialget = 20//how many listings will sniper get initially (max 20)
var refreshget = 10//how many will sniper get on each check (max 20) - should be less then initial get or extras will count as new
var maxlength = 50//how many records history will we keep for each collection
var minutes = 2.5, the_interval = minutes * 60 * 1000//refresh interval for sniper bot

//set multipliers above floor price at which listings become snipes
var mythiclimit = 15
var legendarylimit = 7.5
var epiclimit = 2.5
var rarelimit = 1.25

var supportedservers = []

const initaliseSniperCollections = async () => {
  //reset globals incase this is a restart
  supportedservers = []; sniperSequencer = []; collections = {}

  collections = await sql.getSupportedCollections()

  var currentcollections = ""
  for (var i = 0; i < collections.length; i++) { sniperSequencer.push(i); currentcollections = (currentcollections + "| " + collections[i].collectionkey + " |") }
  w.log.info('Starting sniper with: ' + currentcollections)

  for (const seq of sniperSequencer) {//for each collection
    //get initial set of listings and store them in the local history arrary for that collection
    await magiceden.getNewListings(collections[seq]['meslug'], initialget).then(async thislistings => {
      collections[seq]['listings'] = thislistings//fill tracked listings with the listings we just got
      //w.log.info('SniperV2: added initial ' + initialget + ' Listings for ' + collections[seq]['meslug'])
    })//end then
    await wait(2000)//add delay between API requests
  }//for seq of sniperSequencer

  //get servers and load into supported servers var
  supportedservers = await sql.getSupportedServers()

  startsniper()
}//end initaliseSniperCollections
module.exports.initialise = initaliseSniperCollections

//store the setInterval ids for the sniper recheck loops we start so we can retrieve and kill them later.
var currentloops = []
var serversinitalized = false

//main sniper function
async function startsniper() {
  w.log.info('SniperV2: starting main function')
  await Promise.all(sniperSequencer.map(async value => {//this was added to make sure to sequentially initiate the sniper loops. Not sure its working as intended, but loops are spread out
    var thisinterval = the_interval + (value * 1100)//interval for each collection is 1.1 seconds longer to avoid more than 2 ME API requests per second
    //w.log.info('SniperV2: Initialising recheckloop for collection: ' + collections[value].collectionkey + '. Setting interval for this collection to: ' + thisinterval)

    var thisintervalid = await setInterval(async function (k) {//do this every X minutes
      await magiceden.getNewListings(collections[k]['meslug'], refreshget).then(async thislistings => {//get latest X listings from Magic Eden
        /* heartbeat logging - enable if you want update each minute for each collection */
        //w.log.info("I am doing my " + minutes + " minute check for " + sniperCollections[k][0] + '. I have this many in my history at start: ' + sniperCollections[k][1].length)

        var rebuildarrary = collections[k]['listings']//save all the acquired listings in a temporary arrary

        for (var i = 0; i < thislistings.length; i++) {//for all listings recieved from magiceden.getNewListings function

          if (collections[k]['listings'].some(e => (e.tokenAddress === thislistings[i].tokenAddress && e.price === thislistings[i].price))) {
            //actions if token address and price match (i.e. we've seen this one before)
          } else {
            //actions if token address or price does not match one we have seen before
            w.log.info('SniperV2: New/updated ' + collections[k]['meslug'] + ' entry ' + thislistings[i].tokenMint + ' at price ' + thislistings[i].price)
            rebuildarrary.unshift(thislistings[i])//add the new entry to the start of the rebuild arrary so we can remember this one if we see it later

            var thisprice = pround(thislistings[i].price, 6)//set price of this lisitng
            var recievedtoken = await magiceden.getTokenDetails(thislistings[i].tokenMint)

            if (recievedtoken) {

              var thistoken = recievedtoken
              var thisname = thistoken.name
              var thisimage = thistoken.image
              var thislistinglink = 'https://magiceden.io/item-details/' + thistoken.mintAddress

              /*
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
              */

              var thisnftid = 0
              var regex = /(\d+)(?!.*\d)/
              var matchid = thistoken.name.match(regex)
              thisnftid = parseFloat(matchid[0])

              var NFTdata = await sql.getNFTdata(collections[k]['collectionkey'], thisnftid)
              if (NFTdata) {
                var collectionSize = await sql.getData("solanametaplex", "collectionkey", collections[k]['collectionkey'], 'collectioncount')
                var raritydescription = await nfttools.getraritydescription(collectionSize, NFTdata.rarityRank)
                var thisembedcolour = await nfttools.getembedcolour(raritydescription)
                var floorprice = await magiceden.getFloorPrice(collections[k]['meslug'])
                var thisfloorprice = pround(parseFloat(floorprice), 6)
                var snipe = await testifsnipe(raritydescription, parseFloat(thisprice), parseFloat(thisfloorprice))

                if (snipe) {
                  var thissnipeprice = parseFloat(snipe[1])
                  var thislimit = parseFloat(snipe[2])
                  var hotness = await snipeHotness(parseFloat(thisprice), thisfloorprice, parseFloat(thissnipeprice))

                  w.log.info('SniperV2: we have a ' + collections[k]['collectionkey'] + ' snipe!')

                  //initialise servers if not already - may need to do this periodically in future
                  if (!serversinitalized) {snipersender.initaliseServers();serversinitalized = true}

                  snipersender.sendFilter(thisname, collections[k]['collectionkey'], thisembedcolour, NFTdata.rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness)

                  /*
                  var thisserverid = ''
                  var thissnipechannel = ''
                

                  for (i = 0; i < supportedservers.length; i++) {

                    //get the snipes channel id to send the snipe to
                    thisserverid = supportedservers[i].serverid
                    if (raritydescription === 'Rare') { thissnipechannel = supportedservers[i].raresnipes }
                    if (raritydescription === 'Epic') { thissnipechannel = supportedservers[i].epicsnipes }
                    if (raritydescription === 'Legendary') { thissnipechannel = supportedservers[i].legendarysnipes }
                    if (raritydescription === 'Mythic') { thissnipechannel = supportedservers[i].mythicsnipes }

                    if (thissnipechannel) {//filters out servers which are in pg but not setup yet by checking if the snipe channel is valid for this server
                      //send snipes
                      sendsnipes(thisserverid, thissnipechannel, thisname, thisembedcolour, NFTdata.rarityRank, raritydescription, thislimit, thisfloorprice, thissnipeprice, thisprice, thisimage, thislistinglink, hotness)
                    }//end if snipe channel.

                  }//for each supported server (from SQL)
                  */                

                } else { /* w.log.info('this was not a snipe') */ } //end if not false
              } else {
                w.log.error('error getting nft data')
              }//end else if get nft data failed
            } else { w.log.error('error getting listing at magic Eden for this snipe test') }
          }//end else for a token we havnt seen before
        }//end for loop of each listing recieved

        //for each collection we store a max history. Clear the oldest ones if it's longer than that. 
        if (rebuildarrary.length > maxlength) {
          var numbertoremove = rebuildarrary.length - maxlength
          //w.log.info('SniperV2: number to remove is: ' + numbertoremove)
          for (var i = 0; i < numbertoremove; i++) {
            rebuildarrary.pop()//remove oldest entry
          }//end for number to remove
        }//end if rebuildarrary is longer than max length

        collections[k]['listings'] = rebuildarrary//overwrite main listings arrary with the temp rebuild one

      })//end then after getting 
    }, thisinterval, value)//end recheck listing loop
    //save this interval id so we can kill it in a restart
    currentloops.push(thisintervalid)
  })//end snipersequencer values
  )//end promise.all
}//end startsniper
module.exports.start = startsniper

async function snipeHotness(thisprice, floorprice, thislimit) {
  var blazinglimit = floorprice+((thislimit - floorprice) * 0.2); //w.log.info('blazing limit is: ' + blazinglimit)
  var redhotlimit = floorprice+((thislimit - floorprice) * 0.4); //w.log.info('redhotlimit limit is: ' + redhotlimit)
  var hotlimit = floorprice+((thislimit - floorprice) * 0.6); //w.log.info('hotlimit limit is: ' + hotlimit)
  var warmlimit = floorprice+((thislimit - floorprice) * 0.8); //w.log.info('warmlimit limit is: ' + warmlimit)
  var coollimit = thislimit; //w.log.info('coollimit limit is: ' + coollimit)

  if (thisprice <= blazinglimit) { return '🔥🔥🔥🔥🔥\n__Blazing Hot' }
  if (thisprice <= redhotlimit && thisprice > blazinglimit) { return '🔥🔥🔥🔥\n__Red Hot' }
  if (thisprice <= hotlimit && thisprice > redhotlimit) { return '🔥🔥🔥\n__Hot' }
  if (thisprice <= warmlimit && thisprice > hotlimit) { return '🔥🔥\n__Warm' }
  if (thisprice <= coollimit && thisprice > warmlimit) { return '🔥\n__Cool' }
}//end fnction snipeHotness

async function sendsnipes(server, snipeschannel, nftname, embedcolour, thisrarity, raritydescription, thislimit, floorprice, thissnipeprice, thisprice, thisimage, listinglink, hotness) {
  return new Promise((resolve, reject) => {
    client.guilds.cache.get(server).channels.cache.get(snipeschannel).send({
      embeds: [
        {
          "title": hotness + ' Snipe Opportunity__\n' + nftname,
          "color": embedcolour,
          "fields": [
            {
              "name": "🎯 __Snipe Details__",
              "value": "**Rarity**: " + thisrarity + ' - ' + raritydescription + "\n**List price**: " + pround(parseFloat(thisprice), 3) + ' SOL\n**Floor price**: ' + pround(parseFloat(floorprice), 3) + ' SOL\n[Buy on Magic Eden](' + listinglink + ')\n',
              "inline": false
            },
            {
              "name": "⚡ __Snipe Price Info__",
              "value": 'For ' + raritydescription + ' NFTs, any price less than ' + parseFloat(thislimit) + 'x the floor price of ' + pround(parseFloat(floorprice), 3) + ' SOL is a snipe (i.e. less than ' + pround(parseFloat(thissnipeprice), 3) + ' SOL)',
              "inline": true
            },
            {
              "name": "🐍 __Laniakea Bot v2.1__",
              "value": "Hand crafted by Laniakea#3683 and brought to you by the Secret Snake Society. Visit us [on Discord](https://discord.gg/Dr2Vb7Rt6u).",
              "inline": false
            }
          ],
          "thumbnail": {
            "url": thisimage,
            "height": 75,
            "width": 75
          }
        }
      ]//end embed
    })//end message send
  }) //end promise
}//end sendsnipes function

//returns rarity description (i.e. "Mythic" if its a snipe, else returns 'false') also returns 
async function testifsnipe(raritydescription, thisprice, floorprice) {
  return new Promise((resolve, reject) => {
    //w.log.info('SniperV2: testing for snipe with an ' + raritydescription + ' at a list price of ' + thisprice + ' and the floor price is ' + floorprice)

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
        resolve(null)
      }
    }//end if hotrarities
  }) //end promise
}//end testifsnipe function

async function stopsniper(loops) {
  w.log.info('stopping sniper bot with clearinterval')
  for (var i = 0; i < currentloops.length; i++) {
    clearInterval(currentloops[i])
  }
  currentloops = []//reset it
} module.exports.stop = stopsniper
