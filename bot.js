const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] })
const mpoxdata = require('./monkeypox_nft.json')
client.login(process.env.BOTTOKEN)

//================
//====  Setup  ===
//================

//channels and servers
const monkeyserver = '978975057739124767'
const floorchannel = '992114091374157926'
const snipeschannel = '996130357260845156'
const listingschannel = '992439605569790072'
const mebotid = '980154113637646346'

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

//=================
//====  Statup  ===
//=================

//establish ranges for collection(s)
client.on('ready', () => {

  //mythic range (start of range is 1)
  mythicstart = 1;
  mythicend = Math.floor(nftdata['collection1'].nftcount * pmythic)

  //legendary range
  legendarystart = Math.ceil(nftdata['collection1'].nftcount * pmythic)
  if (legendarystart === mythicend) { legendarystart = legendarystart + 1 }
  legendaryend = Math.floor(nftdata['collection1'].nftcount * plegendary)

  //epic range
  epicstart = Math.ceil(nftdata['collection1'].nftcount * plegendary)
  if (epicstart === legendaryend) { epicstart = epicstart + 1 }
  epicend = Math.floor(nftdata['collection1'].nftcount * pepic)

  //rare range
  rarestart = Math.ceil(nftdata['collection1'].nftcount * pepic)
  if (rarestart === epicend) { rarestart = rarestart + 1 }
  rareend = Math.floor(nftdata['collection1'].nftcount * prare)

  //uncommon range
  uncommonstart = Math.ceil(nftdata['collection1'].nftcount * prare)
  if (uncommonstart === rareend) { uncommonstart = uncommonstart + 1 }
  uncommonend = Math.floor(nftdata['collection1'].nftcount * puncommon)

  //common range (end of range is same as NFT count)
  commonstart = Math.ceil(nftdata['collection1'].nftcount * puncommon)
  if (commonstart === uncommonend) { commomstart = commonstart + 1 }
  commonend = nftdata['collection1'].nftcount

  console.log('Mythic: ' + mythicstart + ' - ' + mythicend + '. Legendary: ' + legendarystart + ' - ' + legendaryend + '. Epic: ' + epicstart + ' - ' + epicend + '. Rare: ' + rarestart + ' - ' + rareend + '. Uncommon: ' + uncommonstart + ' - ' + uncommonend + '. Common: ' + commonend + ' - ' + commonend + '.')
  console.log(`I'm Ready!`);
});//end client.on Ready to establish ranges

//====================
//====  Functions  ===
//====================

//get rarity rank by nft#. NFT # (only) is passed to function.
function checkrarity(nftnumber) {

  //set nftnum equal to the command argument value. This is a key in the data object
  //var nftkey = 'nft' + nftnumber//establish key
  var raritydescription = ""//initalise as string
  var emoji = ""//initalise as string
  var embedcolor = ""//initalise as string
  var thisrarity = ""
  var thisname = ""
  var thisimage = ""

  for (var i = 0; i < mpoxdata.result.data.items.length; i++) {

    if (mpoxdata.result.data.items[i].id == nftnumber) {
      console.log('found ' + mpoxdata.result.data.items[i].name)
      thisrarity = mpoxdata.result.data.items[i].all_ranks.statistical_rarity
      thisname = mpoxdata.result.data.items[i].name
      thisimage = mpoxdata.result.data.items[i].image
      console.log('this rarity is: ' + thisrarity)
    }

  }

  if (thisrarity != null) {

    console.log('NFT found by key in the databse')

    //if mythic
    if (thisrarity >= mythicstart && thisrarity <= mythicend) {
      console.log('mythic!')
      raritydescription = 'Mythic'
      emoji = '<:mythic:997639717665386586>'
      embedcolor = 0xed2839
    }

    //if Legendary
    else if (thisrarity >= legendarystart && thisrarity <= legendaryend) {
      console.log('legendary!')
      raritydescription = 'Legendary'
      emoji = '<:legendary:997639764943585421>'
      embedcolor = 0xfe8100
    }

    //if epic
    else if (thisrarity >= epicstart && thisrarity <= epicend) {
      console.log('epic!')
      raritydescription = 'Epic'
      emoji = '<:epic:997639797558497421>'
      embedcolor = 0x9901f6
    }

    //if rare
    else if (thisrarity >= rarestart && thisrarity <= rareend) {
      console.log('Rare!')
      raritydescription = 'Rare'
      emoji = '<:rare:997639830844477471>'
      embedcolor = 0x19aaeb
    }

    //if uncommon
    else if (thisrarity >= uncommonstart && thisrarity <= uncommonend) {
      console.log('uncommmon!')
      raritydescription = 'Uncommon'
      emoji = '<:uncommon:997639865065799770>'
      embedcolor = 0x20d48a
    }

    //if common
    else if (thisrarity >= commonstart && thisrarity <= commonend) {
      console.log('Common')
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
    var nftproperties = [nftnumber, 'Not found', '<:common:997639893306064997>', 0x3b0202, 'Not Found', 'No Name']
    return (nftproperties)
  }//end if nft is in object
}//end checkrarity function

//==============================
//====  Setup slash command  ===
//==============================

//setup discord slash command
client.on('ready', () => {
  client.api.applications(client.user.id).guilds(monkeyserver).commands.post({//adding commmand sepcificlly to our server
    data: {
      name: "rarity",//defines the slash (e.g. /rarity)
      description: "Check Rarity Command",
      "options": [
        {
          "type": 4,//type 4 is a text input (as oposed to a button or list - https://discord.com/developers/docs/interactions/message-components)
          "name": "nftnumber",
          "description": "Enter MonkeyPoxNFT #",
          "required": true
        }
      ]//end options
    }//end data
  });//end post
});//end client on ready

//respond to slash command
client.ws.on('INTERACTION_CREATE', async interaction => {
  const command = interaction.data.name.toLowerCase()
  const args = interaction.data.options//array of the provided data after the slash

  if (command === 'rarity') {

    var nftproperties = checkrarity(args[0].value)//first argument should be the nft #. Send it to checkrarity function. Returns array.

    //split up returned array
    var nftkey = nftproperties[0]; var raritydescription = nftproperties[1]; var emoji = nftproperties[2]; var embedcolor = nftproperties[3]; var thisrarity = nftproperties[4]; var nftname = nftproperties[5]; var thisimage = nftproperties[6];

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

//========================
//====  Rarity Sniper  ===
//========================

client.on("messageCreate", (message) => {//watch new messages in the listings channel
  if (message.channel.id == listingschannel) {//if channel is the listings channel from the config

    let embed = message.embeds[0]//get the embeds (if any) from the message so we can check it

    //if there is an embed, the message was from the right bot and it's a listing rather than a sale...
    if (embed != undefined && message.author.id == mebotid && embed.description.includes('listed')) {

      console.log(embed.description + " was just listed")

      //get list price
      var thispricestring = ''
      var thisprice = 0

      let descriptionarr = embed.description.split(' ')//split description from embed into array of each word

      for (var i = 0; i < descriptionarr.length; i++) {//loop through description words for SOL then get the word before it which should be the price
        let checkthis = descriptionarr[i]
        if (checkthis === 'SOL') {
          let x = i - 1//get the word before SOL
          thispricestring = descriptionarr[x]
          thisprice = parseFloat(thispricestring)//change string to number
          console.log('Listed for: ' + thisprice)
        }//end if SOL
      }//end for loop checking each word in the listing description for the list price

      //get floor price
      var floorprice = 0
      var floorchan = client.channels.cache.get(floorchannel)//get floor price channel (which is updated by SolMate bot)

      var floorarr = floorchan.name.split(' ')//split it at the space to find the price part - this depends on exact channel layout
      var flength = floorarr[1].length//find the lenght of the substring after the space
      var floorpricestring = floorarr[1].substring(1, flength)//drop the first charter to get just the number

      floorprice = parseFloat(floorpricestring)//change string to number
      console.log('Floor price: ' + floorprice)

      //get rarity of this listing
      var nftid = ''

      //get nft ID
      for (var i = 0; i < descriptionarr.length; i++) {//loop through description words from listing look for the # before the NFT number
        let checkthis = descriptionarr[i]
        if (checkthis.includes('#')) {
          var nlength = checkthis.length
          nftid = checkthis.substring(1, nlength)
          console.log('NFT ID is: ' + nftid)
        }//end if includes #
      }//end for loop

      //get rarity of nft with function (need whole rarity database).or handle function returning 0
      var nftproperties = checkrarity(nftid)
      //split up returned array
      var nftkey = nftproperties[0]; var raritydescription = nftproperties[1]; var emoji = nftproperties[2]; var embedcolor = nftproperties[3]; var thisrarity = nftproperties[4]; var nftname = nftproperties[5]; var thisimage = nftproperties[6];

      //make calculation of if this is a snipe using rarity, floor price and nft price
      var hotrarities = ['Mythic', 'Legendary', 'Epic', 'Rare']//we only want to snipe these ones
      if (hotrarities.includes(raritydescription)) {
        //if this is a snipe, send alert to snipe channel

        //set multipliers. If the currently listed NFT is less than these multipliers of the floor price
        var mythiclimit = 100
        var legendarylimit = 50
        var epiclimit = 10
        var rarelimit = 5
        var thislimit = 0//variable for setting what the limit is for this pariticular round so we can use it in the output

        var mythicsnipe = mythiclimit * floorprice
        var legendarysnipe = legendarylimit * floorprice
        var epicsnipe = epiclimit * floorprice
        var raresnipe = rarelimit * floorprice

        var thissnipeprice = 0

        var issnipe = false

        if (raritydescription == 'Mythic' && thisprice <= mythicsnipe) { issnipe = true; thislimit = mythiclimit; thissnipeprice = mythicsnipe } else if (raritydescription == 'Legendary' && thisprice <= legendarysnipe) { issnipe = true; thislimit = legendarylimit; thissnipeprice = legendarysnipe } else if (raritydescription == 'Epic' && thisprice <= epicsnipe) { issnipe = true; thislimit = epiclimit; thissnipeprice = epicsnipe } else if (raritydescription == 'Rare' && thisprice <= raresnipe) { issnipe = true; thislimit = rarelimit; thissnipeprice = raresnipe }
        if (issnipe == true) {
          client.guilds.cache.get(monkeyserver).channels.cache.get(snipeschannel).send({
            "content": "@everyone",
            embeds: [
              {
                "title": 'Snipe Opportunity: ' + nftname,
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Why is this a snipe opportunity?",
                    "value": 'Listing price is <' + thissnipeprice + ' SOL\n\n' + 'For ' + raritydescription + ' NFTs snipe price is <=' + thislimit + 'x the floor price of ' + floorprice + ' SOL',
                    "inline": false
                  },
                  {
                    "name": "Rarity Rank",
                    "value": thisrarity + ' - ' + raritydescription,
                    "inline": false
                  },
                  {
                    "name": "List Price",
                    "value": thisprice + ' SOL',
                    "inline": false
                  },
                  {
                    "name": "Floor Price",
                    "value": floorprice + ' SOL',
                    "inline": false
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
          }
          )//end message data
        } //if issnipe = true 
      } // if a hot rarity 
    }//end if sender is ME Bot 
  }//end if listingschannel


})