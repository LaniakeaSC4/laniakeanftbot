const Discord = require('discord.js');
const client = new Discord.Client({ intents: allIntents });

client.on('ready', () => {
  console.log(`Logged in....`);
});

client.on('message', msg => {
  msg.reply('pong');
});

client.login(process.env.TOKEN);