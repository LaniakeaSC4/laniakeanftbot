require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv
process.title = 'nftbot'
const fs = require('node:fs')
const path = require('node:path')

const w = require('./tools/winston.js')

/*
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.login(process.env.BOTTOKEN)*/

var discord = require('../clients/discordclient.js')
const client = discord.getClient()
module.exports.client = client

//setup commands - this adds them to the client at client.commands
client.commands = new Collection()//collection is discord fancy arrary with extended functionality
const commandsPath = path.join(__dirname, 'commands')//all commands are at ./commands/
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))//only .js files

for (const file of commandFiles) {//for each command file
  const filePath = path.join(commandsPath, file)//join all the files
  const command = require(filePath)//import each one with requrie
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command)
}//end for each command file

//send interactions back to thier respective command file
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return//if this interaction isnt a slash command
  const command = client.commands.get(interaction.commandName)//get name
  if (!command) return//if no name stop

  try {
    await command.execute(interaction)//execute in command file
  } catch (error) {
    w.log.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }//end catch
})//end on interactionCreate

//button interactions
const setup = require('./tools/serversetup.js')
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'beginsetup') {
    var setupstatus = await setup.start(interaction)
    w.log.info('setup status was: ' + setupstatus)
  }//end if button is 'beginsetup'
})//end on interactionCreate

const sql = require('./tools/commonSQL.js')//common sql related commands are in here
const howrare = require('./sniper/v1/howrareRPC.js')//Howrare.is related commands are in here
const nfttools = require('./tools/nfttools.js')//generic nft tools like get rarity description from rank in here
const raritychecker = require('./raritychecker/raritychecker.js')//rarity checker functions

//======================
//==== Sniper Setup  ===
//======================

const sniper = require('./sniper/v1/sniper-v1.js')
const sniperv2 = require('./sniper/v2/sniper-v2.js')
const metaplex = require('./sniper/v2/addCollection.js')//metaplex RPC

//channels and servers
const servers = {
  "monkeypox":
  {
    'id': '978975057739124767', 'snipeschannel': '996130357260845156', 'v2snipechannel': '1010818537272660090'
  },
  "secretsnake":
  {
    'id': '901885313608200302', 'snipeschannel': '1004682983036428308', 'v2snipechannel': '1010818705002864701'
  }
}; module.exports.servers = servers


//start services
client.on('ready', async () => {
  
  


  w.log.info('I am ready!')
  // Writes some log entries
  w.log.error('warp nacelles offline');
  w.log.info('shields at 99%');
  sniperv2.initialise()



  //endable/disable sniper v1
  //sniper.initialise()
  //sniper.start()

  //limit of 50 per day. Disabled rebuilding.
  //clearcommands()
  //await wait(300)
  //await rebuildCommands()

})//end client.on Ready
/*


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
  //w.log.info(interaction)

  const command = interaction.commandName.toLowerCase()
  var replytext = ''

  
  //rarity checker v1
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

//setup/rebuild discord slash commands
async function rebuildCommands() {

  //add supported collections from sqlDB to the slash command
  var collections = await sql.getColletionList()
  var choices = []; for (var i = 0; i < collections.length; i++) { choices.push({ "name": collections[i], "value": collections[i] }) }

  var serverkeys = Object.keys(servers)
  serverkeys.forEach((key, index) => {

    //build rarity v1 command
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
*/

const pround = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
module.exports.pround = pround
module.exports.wait = wait
