const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('ready', () => {
  console.log(`I'm Ready!`);
});

client.on('ready', () => {
  client.api.applications(client.user.id).guilds('828194078113529856').commands.post({
    data: {
      name: "checkrarity",
      description: "Check Rarity Command", 
      
      "options": [
    {
      "type": 4,
      "name": "nftnumber",
      "description": "Enter NFT #",
      "required": true
    }
  ] 
      
    }
  });
});

  client.ws.on('INTERACTION_CREATE', async interaction => {
    const command = interaction.data.name.toLowerCase();
    const args = interaction.data.options;
    console.log('interaction channel ID is')
    console.log(interaction.channel_id);

    if (command === 'checkrarity') {
      // here you could do anything. in this sample
      // i reply with an api interaction
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            embeds: [
              {
                "author": {
                  "name": "MonkeyPoxNFT Rarity Bot"
                },
                "title": "Title",
                "url": "https://google.com/",
                "description": "Text message. You can use Markdown here. *Italic* **bold** __underline__ ~~strikeout~~ [hyperlink](https://google.com) `code`",
                "color": 15258703,
                "fields": [
                  {
                    "name": "Text",
                    "value": "More text",
                    "inline": true
                    },
                  {
                    "name": "Even more text",
                    "value": "Yup",
                    "inline": true
                    },
                  {
                    "name": "Use `\"inline\": true` parameter, if you want to display fields in the same line.",
                    "value": "okay..."
                    },
                  {
                    "name": "Thanks!",
                    "value": "You're welcome :wink:"
                    }
                  ],
                "thumbnail": {
                  "url": "https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg"
                },
                "image": {
                  "url": "https://upload.wikimedia.org/wikipedia/commons/5/5a/A_picture_from_China_every_day_108.jpg"
                },
                "footer": {
                  "text": "Woah! So cool! :smirk:",
                  "icon_url": "https://i.imgur.com/fKL31aD.jpg"
                }
                }
              ]
        }
    }})
     
     
   }
  });

client.login(process.env.BOTTOKEN);


var data = {
  
  "collection1" : { 
  
  "1" : { name : "MonkeyPoxNFT #1", rarity : "11"}, 
  "2" : { name : "MonkeyPoxNFT #2", rarity : "22"}
  
}
} 

console.log(JSON.parse(data))