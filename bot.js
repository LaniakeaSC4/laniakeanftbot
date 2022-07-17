const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });

//channels and servers
const monkeyserver = '978975057739124767'
const floorchannel = '992114091374157926'
const snipeschannel = '997778592517865512'
const listingschannel = '992439605569790072'
const mebotid = '980154113637646346' 

//set rarity thresholds
const pmythic = 0.01;
const plegendary = 0.05;
const pepic = 0.15;
const prare = 0.35;
const puncommon = 0.6; 

var mythicstart = 0; var mythicend = 0;
var legendarystart = 0; var legendaryend = 0;
var epicstart = 0; var epicend = 0;
var rarestart = 0; var rareend = 0;
var uncommomstart = 0; var uncommonend =0;
var commonend = 0; var commonend = 0;

//establish ranges for collection(s)
client.on('ready', () => {
    
    //mythic range
    mythicstart = 0;
    mythicend = Math.floor(nftdata['collection1'].nftcount*pmythic);
    
    //legendary range
    legendarystart = Math.ceil(nftdata['collection1'].nftcount*pmythic);
    if (legendarystart === mythicend) {legendarystart = legendarystart + 1} 
    legendaryend = Math.floor(nftdata['collection1'].nftcount*plegendary);
    
    //epic range
    epicstart = Math.ceil(nftdata['collection1'].nftcount*plegendary);
    if (epicstart === legendaryend) {epicstart = epicstart + 1} 
    epicend = Math.floor(nftdata['collection1'].nftcount*pepic);
    
    //rare range
      rarestart = Math.ceil(nftdata['collection1'].nftcount*pepic);
    if (rarestart === epicend) {rarestart = rarestart + 1} 
    rareend = Math.floor(nftdata['collection1'].nftcount*prare);
    
    //uncommon range
    uncommonstart = Math.ceil(nftdata['collection1'].nftcount*prare);
    if (uncommonstart === rareend) {uncommomstart = uncommonstart + 1} 
    uncommonend = Math.floor(nftdata['collection1'].nftcount*puncommon);
  
   //common range
    commonstart = Math.ceil(nftdata['collection1'].nftcount*puncommon);
    if (commonstart === uncommonend) {commomstart = commonstart + 1} 
    commonend = nftdata['collection1'].nftcount;
  
  console.log('Mythic: ' + mythicstart + ' - ' + mythicend + '. Legendary: ' + legendarystart + ' - ' + legendaryend + '. Epic: ' + epicstart + ' - ' + epicend + '. Rare: ' + rarestart + ' - ' + rareend + '. Uncommon: ' + uncommomstart + ' - ' + uncommonend + '. Common: ' + commonend + ' - ' + commonend + '.')
  console.log(`I'm Ready!`);
});

//setup slash command
client.on('ready', () => {
  client.api.applications(client.user.id).guilds(monkeyserver).commands.post({
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

//get rarity rank by nft#
function checkrarity(nftnumber) {
  
            //set nftnum equal to the command argument value. This is a key in the data object
var nftkey = 'nft' + nftnumber;
var raritydescription = "";
var emoji = "";
var embedcolor = ""; 

if (nftdata['collection1'].hasOwnProperty(nftkey)) {
  
  console.log('this key was found in the object')
     //if this nft is mythic rarity
      if (nftdata['collection1'][nftkey].rarity >= mythicstart && nftdata['collection1'][nftkey].rarity <= mythicend) {
        
        console.log('mythic!')
        raritydescription = 'Mythic'
        emoji = '<:mythic:997639717665386586>'
        embedcolor = 0xed2839;
        
      } 
      
      else if (nftdata['collection1'][nftkey].rarity >= legendarystart && nftdata['collection1'][nftkey].rarity <= legendaryend) {
        
        console.log('legendary!')
        raritydescription = 'Legendary'
        emoji = '<:legendary:997639764943585421>'
               embedcolor = 0xfe8100;
        
      } 
      
      else if (nftdata['collection1'][nftkey].rarity >= epicstart && nftdata['collection1'][nftkey].rarity <= epicend) {
      
        console.log('epic!')
        raritydescription = 'Epic'
        emoji = '<:epic:997639797558497421>'
               embedcolor = 0x9901f6;
      
      }
      
      else if (nftdata['collection1'][nftkey].rarity >= rarestart && nftdata['collection1'][nftkey].rarity <= rareend) {
      
        console.log('Rare!')
        raritydescription = 'Rare'
        emoji = '<:rare:997639830844477471>'
               embedcolor = 0x19aaeb;
      
      }
      
      else if (nftdata['collection1'][nftkey].rarity >= uncommonstart && nftdata['collection1'][nftkey].rarity <= uncommonend) {
      
        console.log('uncommmon!')
        raritydescription = 'Uncommom'
        emoji = '<:uncommon:997639865065799770>'
               embedcolor = 0x20d48a;
      
      }
      
       else if (nftdata['collection1'][nftkey].rarity >= commonstart && nftdata['collection1'][nftkey].rarity <= commonend) {
      
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

var nftproperties = [nftkey, raritydescription, emoji, embedcolor, nftdata['collection1'][nftkey].rarity]
return(nftproperties)   
} else {
 var nftproperties = [nftkey, 'Not found', '<:common:997639893306064997>', 0x3b0202, 'Not Found']
return(nftproperties)    
}//end if nft is in object

 
}

//respond to slash command
  client.ws.on('INTERACTION_CREATE', async interaction => {
    const command = interaction.data.name.toLowerCase();
    const args = interaction.data.options;
    

    if (command === 'rarity') {
      
      var nftproperties = checkrarity(args[0].value);
      
      console.log(nftproperties)
      
var nftkey = nftproperties[0];
var raritydescription = nftproperties[1];
var emoji = nftproperties[2];
var embedcolor = nftproperties[3]; 

if (raritydescription != 'Not found') {

      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            embeds: [
              {
                "title": nftdata['collection1'][nftkey].name,
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": emoji + emoji + '|  ' + nftdata['collection1'][nftkey].rarity + ' - ' + raritydescription + '  |'+ emoji + emoji,
                    "inline": true
                    }
                  ],
                      "image": {
        "url": nftdata['collection1'][nftkey].imgurl,
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
   } else {//end if rarity description != not found
   
   client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            embeds: [
              {
                "title": 'Token not found in database',
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": emoji + emoji + '|  ' + ' - ' + raritydescription + '  |'+ emoji + emoji,
                    "inline": true
                    }
                  ],
                "footer": {
                  "text": "Rarity data provided by"
                }
                }
              ]
        }//end data
    }})//end post()
   }
   }//end if command = rarity
  });




client.on("messageCreate", (message) => {
  
  if (message.channel.id == listingschannel) {

let embed = message.embeds[0]

//if there is an embed, the message was from the right bot and it's a listing rather than a sale...
if (embed != undefined && message.author.id == mebotid && embed.description.includes('listed')) 
{

console.log(embed.description)

//get list price
var thispricestring = ''
var thisprice = 0

let descriptionarr = embed.description.split(' ')

for (var i = 0; i < descriptionarr.length; i++) {
  let checkthis = descriptionarr[i]
  if (checkthis === 'SOL') {
    
    let x = i-1
    thispricestring = descriptionarr[x]
    thisprice = parseFloat(thispricestring)
    console.log('Listed for: ' + thisprice) 
    
  } 
}//end for loop checking each word in the listing description for the list price

//get floor price
var floorprice = 0
var floorchan = client.channels.cache.get(floorchannel)

var floorarr = floorchan.name.split(' ')
var flength = floorarr[1].length
var floorpricestring = floorarr[1].substring(1,flength)

floorprice = parseFloat(floorpricestring)
console.log('Floor price: ' + floorprice)

//get rarity of this listing
var nftid = ''

//get nft ID
for (var i = 0; i < descriptionarr.length; i++) {
  let checkthis = descriptionarr[i]
  if (checkthis.includes('#')) {
    
    var nlength = checkthis.length
    nftid = checkthis.substring(1,nlength)
    console.log('NFT ID is: ' + nftid) 
    
  } 
}

//get rarity of nft with function (need whole rarity database).or handle function returning 0
var checkthisrarity = checkrarity(nftid)
var thisrarity = checkthisrarity[4]
console.log('Rarity is: ' + thisrarity)
var raritydescription = checkrarity[1];

//make calculation of if this is a snipe using rarity, floor price and nft price


//if this is a snipe, send alert to snipe channel
client.guilds.cache.get(monkeyserver).channels.cache.get(snipeschannel).send(embed.title + ' was just listed for ' + thisprice + '. The current floor price is ' + floorprice + ' and given that this ' + raritydescription + ' NFT rarity is ' + thisrarity + ' it could be a snipe!' )

}//end if sender is ME Bot 
}//end if listingschannel


}) 



client.login(process.env.BOTTOKEN);

var nftdata = {
  
  "collection1" : { 
  
  "nftcount" : 2500,
  
  "nft1" : { name : "MonkeyPoxNFT #1", rarity : "1", imgurl : `https://igvzgsmvdzfq4nhxlmbegcppryqucc6ar3amxhg6b4r5ndm6.arweave.net/QauTSZUeSw4091sCQwnvjiFBC8COwMuc3g8j1_o2_eI?ext=png`},
  
  "nft2" : { name : "MonkeyPoxNFT #2", rarity : "50", imgurl : `https://igvzgsmvdzfq4nhxlmbegcppryqucc6ar3amxhg6b4r5ndm6.arweave.net/QauTSZUeSw4091sCQwnvjiFBC8COwMuc3g8j1_o2_eI?ext=png`}, 
  
  "nft3" : { name : "MonkeyPoxNFT #3", rarity : "130", imgurl : `https://igvzgsmvdzfq4nhxlmbegcppryqucc6ar3amxhg6b4r5ndm6.arweave.net/QauTSZUeSw4091sCQwnvjiFBC8COwMuc3g8j1_o2_eI?ext=png`}, 
  
    "nft4" : { name : "MonkeyPoxNFT #4", rarity : "300", imgurl : `https://igvzgsmvdzfq4nhxlmbegcppryqucc6ar3amxhg6b4r5ndm6.arweave.net/QauTSZUeSw4091sCQwnvjiFBC8COwMuc3g8j1_o2_eI?ext=png`}, 
    
      "nft5" : { name : "MonkeyPoxNFT #5", rarity : "900", imgurl : `https://igvzgsmvdzfq4nhxlmbegcppryqucc6ar3amxhg6b4r5ndm6.arweave.net/QauTSZUeSw4091sCQwnvjiFBC8COwMuc3g8j1_o2_eI?ext=png`}, 
      
        "nft766" : { name : "MonkeyPoxNFT #766", rarity : "2027", imgurl : 'https://g2scosbrhsa5mcy2nhucmkbj3inovwjwfnyumxpoz3ttoucbtu.arweave.net/NqQnSDE8gd-YLGmnoJigp2hrq2TYrcUZd7s7nN1BBnY?ext=png '}
  
}
} 
