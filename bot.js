//const Discord = require('discord.js');
//const client = new Discord.Client({ allIntents });

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('ready', () => {
  console.log(`Logged in....`);
});

client.on('message', msg => {
  msg.reply('pong');
});

client.login(process.env.TOKEN);