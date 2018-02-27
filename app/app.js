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
  "desc": "Crawl all filesystems. Upload files to Minio"
}, function(req,res) {
  return runner.run({}).then(() => {
    res.send(bot.responseWrapper({
      status: "success",
      message: "Starting filesystem crawl"
    }))
  }).catch((err) => {
    bot.logger.error(err)
    res.send(bot.responseWrapper({
      status: "failure",
      message: err.toString()
    }))
  });
});

// Register our sync endpoint.
bot.registerEndpoint({
  "name": "CrawlSingle",
  "path": "/crawl/:idx",
  "method": "POST",
  "desc": "Crawl only the (idx)th configured filesystem. Upload files to Minio",
  "params": [
    {
      "name": "skip",
      "desc": "Skip this many crawled files before starting to import/process. Can be used as a hacky way to resume interrupted crawl jobs."
    }
  ]
}, function(req,res) {
  var skipVal = Number(req.query.skip) || undefined;
  var idx = Number(req.params.idx);

  if(isNaN(idx)) return res.json(bot.responseWrapper({
    status: "failure",
    message: "Invalid folder index."
  }))

  return runner.run({idx, skip: skipVal}).then(() => {
    res.send(bot.responseWrapper({
      status: "success",
      message: "Starting filesystem crawl"
    }))
  }).catch((err) => {
    bot.logger.error(err)
    res.send(bot.responseWrapper({
      status: "failure",
      message: err.toString()
    }))
  });
});

// Start the bot.
bot.start();
bot.changeState({state: "idle"})