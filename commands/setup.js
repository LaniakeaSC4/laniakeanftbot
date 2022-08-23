const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup this server')
		.addStringOption(option =>
		option.setName('action')
			.setDescription('Action Type')
			.setRequired(true)
			.addChoices(
				{ name: 'Start Setup', value: 'start' },
				)),
	async execute(interaction) {
	  
	    //setup command
  //if (command === 'setup') {
    if (interaction.member.user.id === "684896787655557216") {//only me for now
      var action = interaction.options.getString('action')
      if (action === 'start') {

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('beginsetup')
              .setLabel('Let\'s do it')
              .setStyle(ButtonStyle.Primary),
          )

        await interaction.reply({ content: 'Would you like to setup this server?', components: [row], ephemeral: true });

      }//end if start
    }//end if user is laniakea
  //}//end if command is setup
		
		//await interaction.reply('Pong!');
	
	  
	},
};
