const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('ready', () => {
  console.log(`Logged in....`);
});

const options = [
  '🐭',
  'https://media.giphy.com/media/wJZTbXayokOgbCfyQe/giphy.gif',
  'https://media.giphy.com/media/QXh9XnIJetPi0/giphy.gif',
  '🐁',
];

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

if (interaction.commandName === 'randomice') {
    await interaction.reply(
      options[Math.floor(Math.random() * options.length)]
    );
  }
});

client.login(process.env.TOKEN);