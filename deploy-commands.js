const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
//const { clientId, guildId, token } = require('./config.json');

const sql = require('./tools/commonSQL.js')//common sql related commands are in here

const getservers = async () => {
  const servers = await sql.getRowsForColumn('servers', 'serverid')
return servers
}


const clientId = '996170261353222219' 
const guildId = '978975057739124767'

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);
 
var thisserver = ""//for log output only
 getservers().then(servers => {
   for (var i = 0;i < servers.length;i++) {
  thisserver = servers[i].serverid//for log output only
  rest.put(Routes.applicationGuildCommands(clientId, servers[i].serverid), { body: commands })
    .then(() => console.log('Successfully registered application commands for: ' + thisserver))
    .catch(console.error);
    
}  
   
   
 })
 
