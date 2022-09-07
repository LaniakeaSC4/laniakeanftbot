require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv
var discord = require('./clients/discordclient.js')
const client = discord.getClient()
const { Collection, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, InteractionType, ChannelType, PermissionFlagsBits, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle} = require('discord.js')

const fs = require('node:fs')
const path = require('node:path')
const w = require('./tools/winston.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const sniperv2 = require('./sniper/v2/sniper-v2.js')

//start services
client.on('ready', async () => {

  w.log.info('Warp drive activated');
  sniperv2.initialise()

})//end client.on Ready

//======================
//==== Command Setup  ===
//======================

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

//=======================
//==== Command reply  ===
//=======================

//send slash interactions back to thier respective command file
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return//if this interaction isnt a slash command
  const command = client.commands.get(interaction.commandName)//get name
  if (!command) return//if no name stop

  try {
    await command.execute(interaction)//execute in command file
  } catch (error) {
    w.log.info(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }//end catch
})//end on interactionCreate

//can these move file? 
//button interactions
const setup = require('./tools/serversetup.js')
const sql = require('./tools/commonSQL.js')


client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'beginsetup') {
    var setupstatus = await setup.start(interaction)//creates category and 4 sniper channels if the ones in database dont already exist.
    if (setupstatus) { w.log.info('setup status was sucessful') } else {w.log.info('there was an error during a setup attempt')}
  }//end if button is 'beginsetup'

 if (interaction.customId === 'homechannelsetup') {
   if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels, true)) {//only if you have manage channels

      //build a new button row for the command reply
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('homechannelsetup2')
            .setLabel('enter collection')
            .setStyle(ButtonStyle.Primary),
        )

var unsortedcollections = await sql.getOurMetaplexCollections() //set from sql
//sort alphabetically
var collections = unsortedcollections.sort((a, b) => (a.collectionkey > b.collectionkey) ? 1 : ((b.collectionkey > a.collectionkey) ? -1 : 0))
//start reply with codeblock markdown and first sorted element
var replystring = '```' + collections[0].collectionkey
for (var i = 1; i < collections.length; i++) { //from second element to the end
  //add each collection and a comma
  replystring = replystring + ', ' + collections[i].collectionkey
} //end for
replystring = replystring + '```' //close the codeblock

      //send the reply (including button row)
      await interaction.reply({ content: replystring, components: [row], ephemeral: true })
    } else { await interaction.reply({ content: 'Sorry, you do not have permissions to run this command (Manage Channels/Admin required)', ephemeral: true }) }//end if user has manage channels
  
 } 

  if (interaction.customId === 'homechannelsetup2') {
    const modal = new ModalBuilder()
        .setCustomId('verification-modal')
        .setTitle('Verify yourself')
        .addComponents([
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('verification-input')
              .setLabel('Answer')
              .setStyle(TextInputStyle.Short)
              .setMinLength(4)
              .setMaxLength(12)
              .setPlaceholder('ABCDEF')
              .setRequired(true),
          ),
        ]);
  }//end if button is 'beginsetup'

      await interaction.showModal(modal);
    
    if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'verification-modal') {
      const response =
        interaction.fields.getTextInputValue('verification-input');
      interaction.reply(`Yay, your answer is submitted: "${response}"`);
    }
  }
  
    //var setupstatus = await setuphomechannel(interaction)//

})//end on interactionCreate 
