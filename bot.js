const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] })
module.exports.client = client

const sql = require('./functions/postgreSQL.js')//sql related commands are in here
const db = require('./functions/pgclient.js')//if we need to interact with the client directly in here. Rember to use var pgclient = db.getClient() to get/establish client
const magiceden = require('./functions/magicedenRPC.js')//Magic Eden related commands are in here
const howrare = require('./functions/howrareRPC.js')//Magic Eden related commands are in here
const sniper = require('./functions/sniper.js')
const sniperv2 = require('./functions/sniper-v2.js')
const nfttools = require('./functions/nfttools.js')//generic nft tools like get rarity description from rank in here
const metaplex = require('./functions/metaplexRPC.js')//metaplex RPC. Work with database collections
const raritychecker = require('./functions/raritychecker.js')//rarity checker functions

client.login(process.env.BOTTOKEN)

//======================
//==== Sniper Setup  ===
//======================

//channels and servers
const servers = {
  "monkeypox":
  {
    'id': '978975057739124767', 'snipeschannel': '996130357260845156', 'v2snipechannel' : '1010818537272660090'
  },
  "secretsnake":
  {
    'id': '901885313608200302', 'snipeschannel': '1004682983036428308', 'v2snipechannel' : '1010818705002864701'
  }
}; module.exports.servers = servers

//start services
client.on('ready', async () => {
  console.log('I am ready!')
  sniperv2.initialise()
  
  sniper.initialise()
  sniper.start()

  //limit of 50 per day. Disabled rebuilding.
  //clearcommands()
  //await rebuildCommands()

})//end client.on Ready

//function to reset slash commands (enable if needed)
async function clearcommands() {
  return new Promise((resolve, reject) => {
    var serverkeys = Object.keys(servers)
    serverkeys.forEach(async (key, index) => {
      const guild = client.guilds.cache.get(servers[key].id)
      guild.commands.set([])
      await wait(1000)
      resolve()
    })//end for each server
  })//end promise
}//end function to reset commands

client.on('interactionCreate', async interaction => {
  //console.log(interaction)

  const command = interaction.commandName.toLowerCase()
  var replytext = ''

  if (command === 'newrarity') {
    
    await interaction.deferReply()

    var collectionKey = interaction.options.getString('collectionkey'); var nftid = interaction.options.getString('nftid')

    if (interaction.member.user.id === "684896787655557216") {

      rarityembed = await raritychecker.check(collectionKey, nftid)
      await interaction.editReply({ embeds: rarityembed }) 

    }//end if user is laniakea
  }//end if command is newrarity

  if (command === 'laniakea') {

    var action = interaction.options.getString('action'); var data = interaction.options.getString('data')

    if (interaction.member.user.id === "684896787655557216") {
      if (action === ('fulladd' || 'addstep1' || 'addstep2' || 'addstep3' || 'addstep4' || 'addstep5' || 'addstep6')) { await interaction.reply({ content: "Command recieved. Adding new collection to database" }) }
      if (action === 'fulladd') { await metaplex.addNewNFT(data) }
      if (action === 'addstep1') { await metaplex.getMetaplexData(data) }
      if (action === 'addstep2') { await metaplex.addMetaData(data) }
      if (action === 'addstep3') { await metaplex.calculateTraitPercentages(data) }
      if (action === 'addstep4') { await metaplex.combineTraitRarity(data) }
      if (action === 'addstep5') { await metaplex.rankNFTs(data) }
      if (action === 'addstep6') { await metaplex.cleanupDatabase(data) }
    }//end if user is laniakea
  }//end if command is laniakea 

  if (command === 'database') {

    await interaction.deferReply({ ephemeral: true })//send placeholder response
    var action = interaction.options.getString('action')
    var collectionstring = interaction.options.getString('collectionstring')

    if (interaction.member.user.id === "684896787655557216") {
      if (action === 'add') {
        await howrare.getCollection(collectionstring).then(async thisdata => {
          //if there is a statistical rarity
          if ('statistical_rarity' in thisdata.result.data.items[0].all_ranks) {
            var result = await sql.addHowRareCollection(thisdata, collectionstring)
            if (result === 'success') {
              replytext = 'Success. Database has been added. Please now restart your discord client to see updated commands.'
              clearcommands()
              rebuildCommands()
            } else { replytext = 'There was an error adding to database' }//if not success on collection add 
          } else { replytext = 'This collection does not have a statistical rarity on howrare.is. Can\'t add it to database' }//if no statistical rarity

        })//end then
          .then(async () => {
            //reply to interaction with acknowledgement
            await interaction.editReply({ content: replytext, ephemeral: true })
          })//end then
      }//end if action is add

      if (interaction.member.user.id === "684896787655557216") {
        if (action === 'remove') {
          await sql.removeHowRareCollection(collectionstring).then(async result => {
            if (result === 'success') {
              replytext = 'Success. Database has been removed. Please now restart your discord client to see updated commands.'
              clearcommands()
              rebuildCommands()
            } else { replytext = 'There was an error removing the database' }//if not success on collection add

          })//end then
            .then(async () => {
              //reply to interaction with acknowledgement
              await interaction.editReply({ content: replytext, ephemeral: true })
            })//end then
        }//end if action is remove
      }

    } else {
      await interaction.editReply({ content: 'You do not have permission to use this command!', ephemeral: true })
    }//end else
  }//end if database

  if (command === 'checkrarity') {

    await interaction.deferReply()//send placeholder response
    //we dont have to check if collection is in database as list of collections was established from database
    var thiscollection = interaction.options.getString('collection')
    var thisnftnumber = interaction.options.getString('nftnumber')
    var returnedrarity = await sql.getNFTproperties(thiscollection, thisnftnumber)

    if (returnedrarity != 'NFT not in collection') {//is this check enough? if this is found, will everything else pass?

      var thisrarity = returnedrarity[0]
      var thisname = returnedrarity[1]
      var thisimage = returnedrarity[2]

      var collectionsize = await sql.getCollectionSize(thiscollection)
      var ranges = await nfttools.calculateranges(collectionsize)

      var mythicstart = ranges[0]; var mythicend = ranges[1]
      var legendarystart = ranges[2]; var legendaryend = ranges[3]
      var epicstart = ranges[4]; var epicend = ranges[5]
      var rarestart = ranges[6]; var rareend = ranges[7]
      var uncommonstart = ranges[8]; var uncommonend = ranges[9]
      var commonstart = ranges[10]; var commonend = ranges[11]

      var raritydescription = await nfttools.getraritydescription(mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend, thisrarity)

      var embedcolour = await nfttools.getembedcolour(raritydescription)
      var thisembedcolour = parseInt(embedcolour, 16)

      var rarityembed = [
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
      await interaction.editReply({ embeds: rarityembed })

    } else {//if (returnedrarity != 'NFT not in collection')
      await interaction.editReply({ content: 'NFT not found in collection!' })
    }//end else//end else (if rarity description = 'Not found')
  }//end if command = rarity
})//end on interaction

//setup/rebuild discord checkrarity slash command
async function rebuildCommands() {

  //add supported collections from sqlDB to the slash command
  var collections = await sql.getColletionList()
  var choices = []; for (var i = 0; i < collections.length; i++) { choices.push({ "name": collections[i], "value": collections[i] }) }

  var serverkeys = Object.keys(servers)
  serverkeys.forEach((key, index) => {

    //build newrarity command
    client.api.applications(client.user.id).guilds(servers[key].id).commands.post({//adding commmand to our servers
      data: {
        "name": "newrarity",
        "description": "New rarity command",
        "options": [
          {
            "type": 3,
            "name": "collectionkey",
            "description": "Which collection?",
            "required": true
          },
          {
            "type": 3,
            "name": "nftid",
            "description": "Which NFT?",
            "required": true
          }
        ]
      }//end data
    })//end post

    //build Laniakea command
    client.api.applications(client.user.id).guilds(servers[key].id).commands.post({//adding commmand to our servers
      data: {
        "name": "laniakea",
        "description": "ADMIN commands",
        "options": [
          {
            "type": 3,
            "name": "action",
            "description": "What action?",
            "required": true
          },
          {
            "type": 3,
            "name": "data",
            "description": "What data?",
            "required": true
          }
        ]
      }//end data
    })//end post

    //build rarity command
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

    //build database command (for howrare data)
    client.api.applications(client.user.id).guilds(servers[key].id).commands.post({//adding commmand to our servers
      data: {
        "name": "database",
        "description": "ADMIN - howrare.is rarity checker database",
        "options": [
          {
            "type": 3,
            "name": "action",
            "description": "Action type",
            "choices": [{ "name": "Add", "value": "add" }, { "name": "Update", "value": "update" }, { "name": "Remove", "value": "remove" }],
            "required": true
          },
          {
            "type": 3,
            "name": "collectionstring",
            "description": "howrare.is URL identifier of collection to add?",
            "required": true
          }
        ]
      }//end data
    })//end post command

  })//end for each server loop 
}//end rebuildCommands

const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
module.exports.pround = pround
module.exports.wait = wait
