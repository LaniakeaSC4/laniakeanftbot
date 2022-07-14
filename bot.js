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
      
    //set nftnum equal to the command argument value. This is a key in the data object
    const nftnum = 'nft' + args[0].value;
    
const pmythic = 0.05;
const plegendary = 0.1;
const pepic = 0.2;
const prare = 0.3;
const puncommon = 0.5; 

    //mythic range
    var mythicstart = 0;
    var mythicend = Math.floor(nftdata['collection1'].nftcount*pmythic);
    
    //legendary range
    var legendarystart = Math.ceil(nftdata['collection1'].nftcount*pmythic);
    if (legendarystart === mythicend) {legendarystart = legendarystart + 1} 
    var legendaryend = Math.floor(nftdata['collection1'].nftcount*plegendary);
    
    //epic range
    var epicstart = Math.ceil(nftdata['collection1'].nftcount*plegendary);
    if (epicstart === legendaryend) {epicstart = epicstart + 1} 
    var epicend = Math.floor(nftdata['collection1'].nftcount*pepic);
    
    //rare range
      var rarestart = Math.ceil(nftdata['collection1'].nftcount*pepic);
    if (rarestart === epicend) {rarestart = rarestart + 1} 
    var rareend = Math.floor(nftdata['collection1'].nftcount*prare);
    
    //uncommon range
    var uncommonstart = Math.ceil(nftdata['collection1'].nftcount*prare);
    if (uncommonstart === rareend) {uncommomstart = uncommonstart + 1} 
    var uncommonend = Math.floor(nftdata['collection1'].nftcount*puncommon);
  
   //common range
    var commonstart = Math.ceil(nftdata['collection1'].nftcount*puncommon);
    if (commonstart === uncommonend) {commomstart = commonstart + 1} 
    var commonend = nftdata['collection1'].nftcount;
    
    console.log('mythic ' + mythicstart + ' - ' + mythicend)
    console.log('legendary ' + legendarystart + ' - ' + legendaryend)
    console.log('epic ' + epicstart + ' - ' + epicend)
    console.log('rare ' + rarestart + ' - ' + rareend)
    console.log('uncommon ' + uncommonstart + ' - ' + uncommonend)
    console.log('common ' + commonstart + ' - ' + commonend)
      
      var raritydescription = "";
      var emoji = "";
      var embedcolor = "";
      
      if (nftdata['collection1'][nftnum].rarity >= mythicstart && nftdata['collection1'][nftnum].rarity <= mythicend) {
        
        console.log('mythic!')
        raritydescription = 'Mythic'
        emoji = '<:mythic:997191007932268555>'
        embedcolor = '#ed2839';
        
      } 
      
      else if (nftdata['collection1'][nftnum].rarity >= legendarystart && nftdata['collection1'][nftnum].rarity <= legendaryend) {
        
        console.log('legendary!')
        raritydescription = 'Legendary'
               embedcolor = '#ed2839';
        
      } 
      
      else if (nftdata['collection1'][nftnum].rarity >= epicstart && nftdata['collection1'][nftnum].rarity <= epicend) {
      
        console.log('epic!')
        raritydescription = 'Epic'
               embedcolor = '#ed2839';
      
      
      }
      
      else if (nftdata['collection1'][nftnum].rarity >= rarestart && nftdata['collection1'][nftnum].rarity <= rareend) {
      
        console.log('Rare!')
        raritydescription = 'Rare'
               embedcolor = '#ed2839';
      
      }
      
      else if (nftdata['collection1'][nftnum].rarity >= uncommonstart && nftdata['collection1'][nftnum].rarity <= uncommonend) {
      
        console.log('uncommmon!')
        raritydescription = 'Uncommom'
               embedcolor = '#ed2839';
      
      }
      
       else if (nftdata['collection1'][nftnum].rarity >= commonstart && nftdata['collection1'][nftnum].rarity <= commonend) {
      
         console.log('Common')
         raritydescription = 'Common'
                embedcolor = '#ed2839';
      
       }
      
      else {
        
        console.log('not ranked')
        raritydescription = 'not ranked'
               embedcolor = '#ed2839';
        
      }
      
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            embeds: [
              {
                "title": nftdata['collection1'][nftnum].name,
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": emoji + emoji + ' ' + nftdata['collection1'][nftnum].rarity + '/' + nftdata['collection1'].nftcount + ' ' + raritydescription + ' '+ emoji + emoji,
                    "inline": true
                    }
                  ],
                      "image": {
        "url": `https://igvzgsmvdzfq4nhxlmbegcppryqucc6ar3amxhg6b4r5ndm6.arweave.net/QauTSZUeSw4091sCQwnvjiFBC8COwMuc3g8j1_o2_eI?ext=png`,
        "height": 75,
        "width": 75
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
  
  "nftcount" : 2500,
  
  "nft1" : { name : "MonkeyPoxNFT #1", rarity : "11"}, 
  "nft2" : { name : "MonkeyPoxNFT #2", rarity : "222"}, 
  
  "nft3" : { name : "MonkeyPoxNFT #3", rarity : "1560"} 
  
}
} 