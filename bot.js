const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] })
module.exports.client = client

const postgress = require('./functions/postgres.js')//postgress related commands are in here
const db = require('./functions/pgclient.js')//if we need to interact with the client directly in here. Rember to use var pgclient = db.getClient() to get/establish client

const magiceden = require('./functions/magiceden.js')//Magic Eden related commands are in here
const howrare = require('./functions/howrare.js')//Magic Eden related commands are in here

const sniper = require('./functions/sniper.js')

client.login(process.env.BOTTOKEN)

const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
module.exports.pround = pround
module.exports.wait = wait

//======================
//==== Sniper Setup  ===
//======================

//channels and servers
const servers = {
  "monkeypox":
  {
    'id': '978975057739124767', 'snipeschannel': '996130357260845156'
  },
  "secretsnake":
  {
    'id': '901885313608200302', 'snipeschannel': '1004682983036428308'
  }
}
module.exports.servers = servers

//set rarity threshold percentages
const pmythic = 0.01
const plegendary = 0.05
const pepic = 0.15
const prare = 0.35
const puncommon = 0.6

/*//set multipliers above floor price at which listings become snipes
var mythiclimit = 50
var legendarylimit = 25
var epiclimit = 5
var rarelimit = 2.5*/

//=================
//====  Statup  ===
//=================

//start services
client.on('ready', async () => {
  console.log('I am ready!')
  sniper.initialise()
  sniper.start()
  clearcommands()
  await rebuildRarityCommand()
})//end client.on Ready

client.on('ready', async () => {
})

//function to reset slash commands (enable if needed)
async function clearcommands() {
  var serverkeys = Object.keys(servers)
  serverkeys.forEach((key, index) => {
    const guild = client.guilds.cache.get(servers[key].id)
    guild.commands.set([])
  })
}//end function to reset commands

//===================================
//====  Functions for sniper bot  ===
//===================================

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

/*
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
module.exports.testifsnipe = testifsnipe*/


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

//=========================
//====  Rarity checker  ===
//====    Functions     ===
//=========================

//setup/rebuild discord checkrarity slash command
async function rebuildRarityCommand() {

  //add supported collections from postgressDB to the slash command
  var collections = await postgress.getColletionList()
  var choices = []; for (var i = 0; i < collections.length; i++) { choices.push({ "name": collections[i], "value": collections[i] }) }

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
    })//end post
  })//end for each server loop 
}//end rebuildRarityCommand

//=========================
//====  Rarity checker  ===
//====  Slash commands  ===
//=========================

//setup discord add database slash command on bot ready
client.on('ready', async () => {
  var serverkeys = Object.keys(servers)
  serverkeys.forEach((key, index) => {
    client.api.applications(client.user.id).guilds(servers[key].id).commands.post({//adding commmand to our servers
      data: {
        "name": "database",
        "description": "Admin command to add a new rarity checker database",
        "options": [
          {
            "type": 3,
            "name": "action",
            "description": "Action type",
            "choices": [{ "name": "Add", "value": "add" }, { "name": "Update", "value": "update" }, { "name": "Test", "value": "test" }],
            "required": true
          },
          {
            "type": 3,
            "name": "collectionstring",
            "description": "URL identifier of collection",
            "required": true
          }
        ]
      }//end data
    })//end post command
  })//end for each server loop
})//end client on ready

//respond to databse slash command
client.ws.on('INTERACTION_CREATE', async interaction => {
  var pgclient = db.getClient()

  const command = interaction.data.name.toLowerCase()
  const args = interaction.data.options//array of the provided data after the slash

  if (command === 'database') {
    var action = args[0].value
    var collectionstring = args[1].value
    if (interaction.member.user.id === "684896787655557216") {
      if (action === 'add') {
        await howrare.getCollection(collectionstring).then(async thisdata => {
         var result = await postgress.addCollection(thisdata, collectionstring)
         if (result === 'success') {
              clearcommands()
              rebuildRarityCommand()
} 
        })//end then
          .then(() => {
            //reply to interaction with acknowledgement
            client.api.interactions(interaction.id, interaction.token).callback.post({
              data: {
                type: 4,
                data: {
                  embeds: [
                    {
                      "title": 'database command registered',
                      "footer": {
                        "text": "Bot by Laniakea#3683"
                      }
                    }
                  ]//end embed
                }
              }
            })//end callback post
          })//end then
      }//end if action is add

      if (action === 'test') {
        console.log('action is test')
        var testid = 50
        var querystring = "SELECT jsonb_path_query_first(data #> '{result,data,items}', '$[*] ? (@.id == " + testid + ")') AS result FROM howraredata WHERE  collection_id = '" + collectionstring + "' "
        console.log(collectionstring)
        await pgclient.query(querystring, (err, res) => {
          if (err) throw err
          console.log(res.rows[0].result)
          //do I need to close connection? 
          //pgclient.end()
        })

      }
    } else {
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            embeds: [
              {
                "title": 'You do not have permission for this action',
                "footer": {
                  "text": "Bot by Laniakea#3683"
                }
              }
            ]//end embed
          }
        }
      })//end post callback
    }//end else
  }//end if database
})

//respond to checkrarity slash command
client.ws.on('INTERACTION_CREATE', async interaction => {
  const command = interaction.data.name.toLowerCase()
  const args = interaction.data.options//array of the provided data after the slash

  if (command === 'checkrarity') {
    //we dont have to check if collection is in database as list of collections was established from database
    var thiscollection = args[0].value; var thisnftnumber = args[1].value
    var returnedrarity = await postgress.getNFTproperties(thiscollection, thisnftnumber)

    if (returnedrarity != 'NFT not in collection') {//is this check enough? if this is found, will everything else pass?

      var thisrarity = returnedrarity[0]
      var thisname = returnedrarity[1]
      var thisimage = returnedrarity[2]; console.log('this image is: ' + thisimage)

      var collectionsize = await postgress.getCollectionSize(thiscollection)
      var ranges = await calculateranges(collectionsize)

      var mythicstart = ranges[0]; var mythicend = ranges[1]
      var legendarystart = ranges[2]; var legendaryend = ranges[3]
      var epicstart = ranges[4]; var epicend = ranges[5]
      var rarestart = ranges[6]; var rareend = ranges[7]
      var uncommonstart = ranges[8]; var uncommonend = ranges[9]
      var commonstart = ranges[10]; var commonend = ranges[11]

      var raritydescription = await getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, thisrarity)

      var embedcolour = await getembedcolour(raritydescription)
      var thisembedcolour = parseInt(embedcolour, 16)

      client.api.interactions(interaction.id, interaction.token).callback.post({//send the post
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
                    "value": thisrarity + ' - ' + raritydescription,
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
    } else {//if (returnedrarity != 'NFT not in collection')
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            embeds: [
              {
                "title": 'Token not found in database. Are you sure this token # exists in the collection?',
                "color": 15158332,
                "footer": {
                  "text": "Bot by Laniakea#3683"
                }
              }
            ]//end embed
          }//end message data
        }//end post data
      })//end post()
    }//end else//end else (if rarity description = 'Not found')
  }//end if command = rarity
})//end response to slash command
