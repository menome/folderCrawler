/**
 * Copyright (c) 2017 Menome Technologies Inc.
 * Configuration for the bot
 */
"use strict";
var convict = require('convict');
var fs = require('fs');
var bot = require('@menome/botframework')

var config = convict({
  minio: {
    endPoint: {
      doc: "The URL of the Minio instance",
      format: "*",
      default: "minio",
      env: "MINIO_HOSTNAME"
    },
    port: {
      doc: "The Port of the Minio instance",
      format: "port",
      default: 9000,
      env: "MINIO_PORT"
    },
    secure: {
      doc: "Do we use SSL to connect to Minio?",
      format: "Boolean",
      default: false,
      env: "MINIO_SECURE"
    },
    accessKey: {
      doc: "S3-Style Access Key for Minio",
      format: "*",
      default: 'abcd123',
      env: "MINIO_ACCESS_KEY"
    },
    secretKey: {
      doc: "S3-Style Secret Key for Minio",
      format: "*",
      default: 'abcd12345',
      env: "MINIO_SECRET_KEY",
      sensitive: true
    },
    fileBucket: {
      doc: "The name of the bucket we'll crawl on full sync",
      format: "*",
      default: 'filestore'
    }
  },
  crawler: {
    matchRegex: {
      doc: "Only extract data from files that match this regex. Javascript-style regex.",
      format: "*",
      default: ".pdf$|.docx$|.doc$|.pptx$|.txt$"
    },
    matchRegex: {
      doc: "Only find files that match this regex. Grep-type regex. (Gets piped into the UNIX find command)",
      format: "*",
      default: ".pdf$|.docx$|.doc$|.pptx$|.txt$"
    }
  },
  port: bot.configSchema.port,
  logging: bot.configSchema.logging,
  neo4j: bot.configSchema.neo4j,
})

// Load from file.
if (fs.existsSync('./config/config.json')) {
  config.loadFile('./config/config.json');
}

// Export the config.
module.exports = config;