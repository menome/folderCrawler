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
var folderConf = require("../config/folders.json")

// Hack. Make sure uncaught exceptions don't knock over our entire process.
// process.on('uncaughtException', (err) => {
//   console.error("Caught Exception",err.toString())
//   throw err
// });

module.exports.run = function({idx, skip}) {
  if(idx !== undefined && idx >= folderConf.folders.length)
    return Promise.reject("No folder configured at index "+idx)

  return mountDirs().then(() => {
    if(idx !== undefined) crawlSingle({idx, skipTo: skip});
    else crawlAll();
    return; // Return to the webservice when we know the crawl has been started and the dirs are mounted.
  })
}

// Mounts directories.
function mountDirs() {
  return new Promise((resolve, reject) => {
    // First thing we do is ensure that our mounts are mounted.
    if (fs.existsSync('./config/mount.sh')) {
      bot.logger.info("Ensuring directories are mounted.")
      exec('/bin/bash ./config/mount.sh', (err,stdout,stderr) => {
        if(err) return reject(err);
        return resolve()
      })
    }
    else {
      return resolve();
    }
  })
}

// Crawls a single folder. Specified by its index in the folder config json file.
function crawlSingle({idx, skipTo}) {
  var folder = folderConf.folders[idx];
  bot.logger.info('===========Running on', folder.localpath, "====================");
  return new Promise((resolve,reject) => {
    crawler.CrawlFolder({
      localCrawlDir: folder.localpath, 
      bucketDest: folder.destpath, 
      originPrefix: folder.originprefix,
      skipTo: skipTo
    },resolve);
  })
}

function crawlAll() {
  return async.eachOfSeries(folderConf.folders, function(entry,idx,next){
    console.log(idx)
    if(!!entry.disabled) return next();
    crawlSingle({idx},next)
  }, function(err) {
    if(err) return bot.logger.error(err.toString())
    bot.logger.info('Finished Crawling all Directories');
  });
}

// If we're not being imported by the webservice, just run and exit.
if (!module.parent) {
  module.exports.run({});
}

