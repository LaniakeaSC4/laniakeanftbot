/*
* setup command to create server channels for snipes
*/

//import discord parts we need
const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

//build the slash command
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

//when command is triggered, do this
	async execute(interaction) {
    if (interaction.member.user.id === "684896787655557216") {//only me for now
      var action = interaction.options.getString('action')
      if (action === 'start') {

        //build a new button row for the command reply
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('beginsetup')
              .setLabel('Let\'s do it')
              .setStyle(ButtonStyle.Primary),
          )//end add components

        //send the reply (including button row)
        await interaction.reply({ content: 'Would you like to setup this server?', components: [row], ephemeral: true });

      }//end if start
    }//end if user is laniakea
	},//ennld execute block
}//end module.exports
