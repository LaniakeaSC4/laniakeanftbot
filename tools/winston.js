const winston = require('winston');

// Imports the Google Cloud client library for Winston
const {LoggingWinston} = require('@google-cloud/logging-winston');
const loggingWinston = new LoggingWinston()

//import papertrail logger
const { PapertrailConnection, PapertrailTransport } = require('winston-papertrail-v2');

const papertrailConnection = new PapertrailConnection({
  host: 'logs.papertrailapp.com',
  port: 23324
}) 

// Create a Winston logger that streams to Cloud Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log"
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    // Add Cloud Logging
    loggingWinston,
    new PapertrailTransport(papertrailConnection)
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    // Add Cloud Logging
    loggingWinston,
    new PapertrailTransport(papertrailConnection)
  ]
});

module.exports.log = logger
