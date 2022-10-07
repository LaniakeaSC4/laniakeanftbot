const winston = require('winston');

//import papertrail logger
const { PapertrailConnection, PapertrailTransport } = require('winston-papertrail-v2');

//connect to my papertrail
const papertrailConnection = new PapertrailConnection({
  host: 'logs.papertrailapp.com',
  port: 23324
})

// Create a Winston logger that streams to Papertrail
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    // Add Papertrail
    new PapertrailTransport(papertrailConnection)
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    // Add Papertrail
    new PapertrailTransport(papertrailConnection)
  ]
});

module.exports.log = logger
