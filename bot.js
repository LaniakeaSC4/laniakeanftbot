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

    if (command === 'checkrarity') {
      
    console.log('args[0] is ' + args[0].value);
    const nftnum = 'nft' + args[0].value;
    console.log('nftnum is ' + nftnum); 
      
    console.log(nftdata['collection1'][nftnum].name) 
      
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            embeds: [
              {
                "title": nftdata['collection1'][nftnum].name,
                "description": "Text message. You can use Markdown here. *Italic* **bold** __underline__ ~~strikeout~~ [hyperlink](https://google.com) `code`",
                "color": 15258703,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": nftdata['collection1'][nftnum].rarity,
                    "inline": true
                    }
                  ],
                "thumbnail": {
                  "url": "https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg"
                },
                "image": {
                  "url": "https://upload.wikimedia.org/wikipedia/commons/5/5a/A_picture_from_China_every_day_108.jpg"
                },
                "footer": {
                  "text": "Rarity data provided by"
                }
                }
              ]
        }
    }})
     
     
   }
  });

client.login(process.env.BOTTOKEN);


var nftdata = {
  
  "collection1" : { 
  
  "nft1" : { name : "MonkeyPoxNFT #1", rarity : "11"}, 
  "nft2" : { name : "MonkeyPoxNFT #2", rarity : "22"}
  
}
} 