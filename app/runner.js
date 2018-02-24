/**
 * Copyright (C) 2017 Menome Technologies.
 *
 * Top-level application runner.
 */
var async = require('async');
var crawler = require('./crawler');
var queryBuilder = require('./queryBuilder');
var conf = require('./config');
var fs = require('fs');
const { exec } = require('child_process');
var bot = require('@menome/botframework');

// Hack. Make sure uncaught exceptions don't knock over our entire process.
process.on('uncaughtException', (err) => {
  console.error("Caught Exception",err.toString())
  throw err
});

module.exports.run = function() {
  return new Promise((resolve, reject) => {
    // First thing we do is ensure that our mounts are mounted.
    if (fs.existsSync('./config/mount.sh')) {
      bot.logger.info("Ensuring directories are mounted.")
      exec('/bin/bash ./config/mount.sh', (err,stdout,stderr) => {
        if(err) return reject(err);
        runCrawl();
        return resolve()
      })
    }
    else {
      runCrawl()
      return resolve();
    }
  })
}

function runCrawl() {
  var folderConf = require("../config/folders.json")
  return async.eachSeries(folderConf.folders, function(entry,next){
    if(!!entry.disabled) return next();
    
    bot.logger.info('===========Running on', entry.localpath, "====================");
    if(entry.localpath.trim().length < 1) return next();
    else return crawler.CrawlFolder(entry.localpath, entry.destpath, entry.originprefix, next)
  }, function(err) {
    if(err) return bot.logger.error(err.toString())
    bot.logger.info('Finished Crawling all Directories');
  });
}

// If we're not being imported by the webservice, just run and exit.
if (!module.parent) {
  module.exports.run();
}