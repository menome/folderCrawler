/**
 * Copyright (c) 2018 Menome Technologies Inc.
 * Bot entrypoint. Initialize, configure, create HTTP endpoints, etc.
 */
"use strict";
var bot = require('@menome/botframework');
var runner = require('./runner');
var config = require('./config.js');

// We only need to do this once. Bot is a singleton.
bot.configure({
  name: "File Crawler",
  desc: "Crawls the filesystem and uploads files to Minio",
  logging: config.get('logging'),
  port: config.get('port'),
  neo4j: config.get('neo4j')
});

// Register our sync endpoint.
bot.registerEndpoint({
  "name": "Crawl",
  "path": "/crawl",
  "method": "POST",
  "desc": "Crawl the filesystem. Upload files to Minio"
}, function(req,res) {
  return runner.run().then(() => {
    res.send(bot.responseWrapper({
      status: "success",
      message: "Starting filesystem crawl"
    }))
  }).catch((err) => {
    console.log(err)
    res.send(bot.responseWrapper({
      status: "failure",
      message: err.toString()
    }))
  });
});

// Start the bot.
bot.start();
bot.changeState({state: "idle"})