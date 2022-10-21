const sql = require('./commonSQL.js')//common sql related commands are in here
const w = require('./winston.js')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const magiceden = require('./magicedenRPC.js')//Magic Eden related commands are in here

async function getCurrentFP() {

//get meslugs
var meslugs = await sql.getRowsForColumn("solanametaplex", "meslug")

for (i = 0;i < meslugs.length;i++){

  var thisfp = await magiceden.getFloorPrice(meslugs[i].meslug)
    w.log.info('Floor price for collection ' + meslugs[i].meslug+ ' is ' + thisfp)
    await wait(2000)

}

} module.exports.getCurrentFP = getCurrentFP
