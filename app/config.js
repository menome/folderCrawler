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
    findRegex: {
      doc: "Only find files whose path matches this regex. Grep-type regex. (Gets piped into the UNIX find command. Must be double-escaped.)",
      format: "*",
      default: ".pdf$|.docx$|.doc$|.pptx$|.txt$"
    },
    regexWhitelist: {
      doc: "Array of regexes. File is accepted if its full path matches any of these.",
      default: [],
      format: function check(regexes) {
        regexes.forEach((regex) => {
          if((typeof regex !== 'string'))
            throw new Error('Regexes must be a string.');

          // This will throw errors if it can't be a regex.
          var tmp = new RegExp(regex)
        })
      }
    },
    regexFilenameWhitelist: {
      doc: "Array of regexes. File is accepted if its name matches any of these.",
      default: [],
      format: function check(regexes) {
        regexes.forEach((regex) => {
          if((typeof regex !== 'string'))
            throw new Error('Regexes must be a string.');

          // This will throw errors if it can't be a regex.
          var tmp = new RegExp(regex)
        })
      }
    },
    existsInFilestore: {
      doc: "If true, set ExistsInFilestore=true on the created nodes for all crawled files. Use this if you plan on having theLink hotlink to the existing filestore, rather than host the files itself.",
      format: "Boolean",
      env: "SET_EXISTS_IN_FILESTORE",
      default: false
    }
  },
  port: bot.configSchema.port,
  logging: bot.configSchema.logging,
  neo4j: bot.configSchema.neo4j,
})

// Load from file.
if (fs.existsSync('./config/config.json')) {
  config.loadFile('./config/config.json');
  config.validate();
}

// Export the config.
module.exports = config;