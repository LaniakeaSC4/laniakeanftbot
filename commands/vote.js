/*
* vote command for voting for collections
*/

//import discord parts we need
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js')


//build the slash command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Vote to add or remove a Snipe collection.'),

  //when command is triggered, do this
  async execute(interaction) {
    //build a new button row for the command reply
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('voteUp-button')
          .setLabel('⬆️ Upvote Collection')
          .setStyle(ButtonStyle.Success),
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId('voteDown-button')
          .setLabel('⬇️ Downvote Collection')
          .setStyle(ButtonStyle.Danger),
      )//end add components

    //send the reply (including button row)
    await interaction.reply({ content: 'Add an upvote ⬆️ for a collection you would like **Laniakea Sniper** to add to our database or a downvote ⬇️ a collection you would like removed.\n\nView the current leaderboard with `/leaderboard`. We will periodically review votes and add/remove collections.\n\nYou can vote once per minute. When your done, dismiss this message.', components: [row], ephemeral: true })

  },//end execute block
}//end module.exports
