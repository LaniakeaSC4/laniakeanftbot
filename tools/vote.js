var db = require('../clients/pgclient.js')
const https = require('https')
const w = require('./winston.js')
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js')
const sql = require('./commonSQL.js')//common sql related commands are in here

//when a vote up button is pressed
async function sendVoteUpModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('voteUp-modal')
		.setTitle('Enter Magic Eden Link to collection')
		.addComponents([
			new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('collection-input')
					.setLabel('Link to collection to up vote')
					.setStyle(TextInputStyle.Short)
					.setMinLength(2)
					.setMaxLength(120)
					.setPlaceholder('e.g. https://magiceden.io/marketplace/{your-collection}')
					.setRequired(true),
			),//end actionrow add components
		])//end modal add components
	await interaction.showModal(modal)
} module.exports.sendVoteUpModal = sendVoteUpModal

//when a vote down button is pressed
async function sendVoteDownModal(interaction) {
	const modal = new ModalBuilder()
		.setCustomId('voteDown-modal')
		.setTitle('Enter Magic Eden Link to collection')
		.addComponents([
			new ActionRowBuilder().addComponents(
				new TextInputBuilder()
					.setCustomId('collection-input')
					.setLabel('Link to collection to down vote')
					.setStyle(TextInputStyle.Short)
					.setMinLength(2)
					.setMaxLength(120)
					.setPlaceholder('e.g. https://magiceden.io/marketplace/{your-collection}')
					.setRequired(true),
			),//end actionrow add components
		])//end modal add components
	await interaction.showModal(modal)
} module.exports.sendVoteDownModal = sendVoteDownModal

//function to process the input from sendVoteModal. Do we support this collection? 
async function validateCollection(interaction, updown) {
  voteTimeoutOver(interaction.member.user.id)
	if (updown === 'down') {//if it's a downvote, check if its a valid exisiting collection
		w.log.info("down vote triggered")
		const response = interaction.fields.getTextInputValue('collection-input')//get modal input text
		var meslug = response.substring(response.lastIndexOf('magiceden.io/marketplace/') + 25).replace(/[^0-9a-z]/gi, '')//find the end slug and clean it (same process as cleaning to colleciton key in SQL)

		//get collections and populate global var
		supportedcollections = {}//clear and repopulate in case collections have changed since last time command was run
		supportedcollections = await sql.getOurMetaplexCollections()//set from sql

		w.log.info('validating collection')
		//check if it was a supported collection
		var found = false//start as false
		for (var i = 0; i < supportedcollections.length; i++) {//loop supported collections recieved from SQL
			if (supportedcollections[i].collectionkey === meslug) {//if collection entered by user is found in our supported collections
				found = true
				w.log.info('validated collection. We can register a downvote for ' + meslug)
				//add downvote row
				await addVote(interaction.message.guildId, interaction.member.user.id, "down", meslug)
				await interaction.reply({ content: 'Down vote registered for collection: ' + meslug + ". Thank you for your feedback. You can dismiss this message", ephemeral: true});
				break
			}//end if
		}//end for

		if (found === false) {
			await interaction.reply({ content: 'Collection ' + meslug + 'was not found in our supported collections, so you cannot downvote it. View all supported collections with /supportedcollections. This message will delete in 5 seconds' });
			setTimeout(() => interaction.deleteReply(), 5000)//delete it after 5s
		}//end if !found

	}
	
	if (updown === "up") {//if its an upvote
		w.log.info("vote up triggered")
		
		//validate collection is me link
		const response = interaction.fields.getTextInputValue('collection-input')//get modal input text
		var meslug = response.substring(response.lastIndexOf('magiceden.io/marketplace/') + 25).replace(/[^0-9a-z]/gi, '')//find the end slug and clean it (same process as cleaning to colleciton key in SQL)

		//check if that link gives a valid response from ME
		https.get('https://api-mainnet.magiceden.dev/v2/collections/' + meslug, (resp) => {
			let data = ''
			// A chunk of data has been received.
			resp.on('data', (chunk) => {
				data += chunk
			});
			// The whole response has been received. Print out the result.
			resp.on('end', async () => {
				if (data != "collection not found") {
				  		//register vote for meslug
		          await addVote(interaction.message.guildId, interaction.member.user.id, "up", meslug)

	            	//reply to interaction
                await interaction.reply({ content: 'Up vote registered for collection: ' + meslug + ". Thank you for your feedback. You can dismiss this message.", ephemeral: true });
				} else {
				  await interaction.reply({ content: 'Collection: ' + meslug + " does not seem to be a valid collection. Please make sure you have entered the Magic Eden link correctly. You can dismiss this message.", ephemeral: true });
				}
			})
		}).on("error", (err) => { w.log.info("Error: " + err.message) })

	}

} module.exports.validateCollection = validateCollection

//add vote
async function addVote(server_id, user_id, votetype, votemeslug) {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		var querystring = "INSERT INTO votes(server_id, user_id, votetype, votemeslug,votetime) VALUES ($1,$2,$3,$4,current_timestamp)"
		var querydata = [server_id, user_id, votetype, votemeslug]

		pgclient.query(querystring, querydata, (err, res) => {
			if (err) throw err
			resolve(true)
		}) //end query
	}) //end promise 
}

//check if this user has passed timeout
async function voteTimeoutOver(user_id) {
	return new Promise((resolve, reject) => {
		var pgclient = db.getClient()

		var querystring = 'SELECT max(votetime) FROM "votes" WHERE user_id = \'' + user_id + '\''

		pgclient.query(querystring, (err, res) => {
			if (err) throw err
			var lastvote = new Date(JSON.stringify(res.rows[0].max).replaceAll('\"', ''))
			w.log.info('lastvote: ' + lastvote)
			var onehour = 60 * 1000
			var now = new Date()
			var nextvote = new Date()
			w.log.info('now: ' + nextvote)
			nextvote = new Date(lastvote.getTime() + onehour)
			w.log.info('nextvote: ' + nextvote)
			if (nextvote > now) {
			  w.log.info('Sorry 1h not passed since last vote')
			} else {
			  w.log.info('1h has passed since last vote')
			}
		}) //end query
	}) //end promise 
}
