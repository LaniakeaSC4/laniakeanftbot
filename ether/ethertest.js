require('dotenv').config()//import process environment vars into app engine nodejs environment using dotenv
const w = require('../tools/winston.js')

const ethers = require("ethers")


async function ethertest() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.ETHNODE);
  provider.connection.headers = { "x-qn-api-version": 1 };
  const heads = await provider.send("qn_fetchNFTsByCollection", {
    collection: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
    omitFields: ["imageUrl", "traits"],
    page: 1,
    perPage: 10,
  });
  w.log.info(heads);
}; module.exports.ethertest = ethertest
