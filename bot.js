const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('ready', () => {
  console.log(`I'm Ready!`);
});

client.on('ready', () => {
  client.api.applications(client.user.id).guilds('828194078113529856').commands.post({
    data: {
        "name": "Check Rarity",
        "description": "Check the Rarity of your MonkeyPox NFT",
        "options": [
          {
            "type": 4,
            "name": "Enter NFT #",
            "required": true
          }
        ]
    } 
  });


  client.ws.on('INTERACTION_CREATE', async interaction => {
    const command = interaction.data.name.toLowerCase();
    const args = interaction.data.options;

    if (command === 'Check Rarity') {
      // here you could do anything. in this sample
      // i reply with an api interaction
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            content: "hello world!!!"
          }
        }
      })
    }
  });
});

client.login(process.env.TOKEN);