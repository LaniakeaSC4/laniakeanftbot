const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`I'm Ready!`);
});

client.on('ready', () => {
  client.api.applications(client.user.id).guilds('978975057739124767').commands.post({
    data: {
      name: "rarity",
      description: "Check Rarity Command", 
      
      "options": [
    {
      "type": 4,
      "name": "nftnumber",
      "description": "Enter MonkeyPoxNFT #",
      "required": true
    }
  ] 
      
    }
  });
});

  client.ws.on('INTERACTION_CREATE', async interaction => {
    const command = interaction.data.name.toLowerCase();
    const args = interaction.data.options;

    if (command === 'rarity') {
      
      if (args[0].value <= nftdata['collection1'].nftcount) {
    //set nftnum equal to the command argument value. This is a key in the data object
    const nftnum = 'nft' + args[0].value;
    
const pmythic = 0.01;
const plegendary = 0.5;
const pepic = 0.15;
const prare = 0.35;
const puncommon = 0.6; 

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
 
 //initialise variables needed to build embed
      var raritydescription = "";
      var emoji = "";
      var embedcolor = "";
      
      //if this nft is mythic rarity
      if (nftdata['collection1'][nftnum].rarity >= mythicstart && nftdata['collection1'][nftnum].rarity <= mythicend) {
        
        console.log('mythic!')
        raritydescription = 'Mythic'
        emoji = '<:mythic:997639717665386586>'
        embedcolor = 0xed2839;
        
      } 
      
      else if (nftdata['collection1'][nftnum].rarity >= legendarystart && nftdata['collection1'][nftnum].rarity <= legendaryend) {
        
        console.log('legendary!')
        raritydescription = 'Legendary'
        emoji = '<:legendary:997639764943585421>'
               embedcolor = 0xfe8100;
        
      } 
      
      else if (nftdata['collection1'][nftnum].rarity >= epicstart && nftdata['collection1'][nftnum].rarity <= epicend) {
      
        console.log('epic!')
        raritydescription = 'Epic'
        emoji = '<:epic:997639797558497421>'
               embedcolor = 0x9901f6;
      
      }
      
      else if (nftdata['collection1'][nftnum].rarity >= rarestart && nftdata['collection1'][nftnum].rarity <= rareend) {
      
        console.log('Rare!')
        raritydescription = 'Rare'
        emoji = '<:rare:997639830844477471>'
               embedcolor = 0x19aaeb;
      
      }
      
      else if (nftdata['collection1'][nftnum].rarity >= uncommonstart && nftdata['collection1'][nftnum].rarity <= uncommonend) {
      
        console.log('uncommmon!')
        raritydescription = 'Uncommom'
        emoji = '<:uncommon:997639865065799770>'
               embedcolor = 0x20d48a;
      
      }
      
       else if (nftdata['collection1'][nftnum].rarity >= commonstart && nftdata['collection1'][nftnum].rarity <= commonend) {
      
         console.log('Common')
         raritydescription = 'Common'
         emoji = '<:common:997639893306064997>'
                embedcolor = 0x939394;
      
       }
      
      else {
        
        console.log('not ranked')
        raritydescription = 'not ranked'
        emoji = '<:common:997639893306064997>'
               embedcolor = 0x939394;
        
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
                    "value": emoji + emoji + '|  ' + nftdata['collection1'][nftnum].rarity + ' - ' + raritydescription + '  |'+ emoji + emoji,
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
        }//end data
    }})//end post()
    }//end if <= nft count else 
   }//end if command = rarity
  });




client.on("messageCreate", (message) => {
  
let embed = message.embeds[0]

console.log(message.author.id)

if (embed != undefined && message.author.id == '980154113637646346') 
{

console.log('logged a me bit post')
console.log(embed.description)
  
} 

}) 



client.login(process.env.BOTTOKEN);

var nftdata = {
  
  "collection1" : { 
  
  "nftcount" : 2500,
  
  "nft1" : { name : "MonkeyPoxNFT #1", rarity : "1"}, 
  "nft2" : { name : "MonkeyPoxNFT #2", rarity : "50"}, 
  
  "nft3" : { name : "MonkeyPoxNFT #3", rarity : "130"}, 
  
    "nft4" : { name : "MonkeyPoxNFT #4", rarity : "300"}, 
    
      "nft5" : { name : "MonkeyPoxNFT #5", rarity : "900"}, 
      
        "nft6" : { name : "MonkeyPoxNFT #6", rarity : "1900"}
  
}
} 