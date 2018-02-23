/**
 * Copyright (C) 2017 Menome Technologies.
 *
 * Crawls a file tree, copies it, and turns it into graph nodes.
 */
var queryBuilder = require('./queryBuilder');
var conf = require('./config');
var crypto = require('crypto');
var async = require('async');
var mime = require('mime-types');
var path = require('path');
var bot = require('@menome/botframework');
var minioUploader = require('./minioUploader');
var fs = require('fs');
const { execFile, spawn } = require('child_process');
const readline = require('readline');
const whitelist = new RegExp(conf.get("crawler.matchRegex"));

module.exports = {
  CrawlFolder
}

// Crawls a folder. Runs queries to put the folder structure in the graph.
// Copies the successfully merged files into a directory.
function CrawlFolder(localCrawlDir, bucketDest, originPrefix, cb) {
  localCrawlDir = path.normalize(localCrawlDir);
  bucketDest = path.posix.normalize(bucketDest);
  bot.logger.info("Starting folder crawler on: " + localCrawlDir);

  var findcmd = spawn("find", [localCrawlDir, "-type", "f", "-regextype", "grep", "-iregex", conf.get("crawler.findRegex")]);
  var rl = readline.createInterface({ input: findcmd.stdout });

  var workQueue = async.queue((task,callback) => {
    task().then(()=>{ callback(); })
  })
  
  findcmd.on("error", (err) => {
    bot.logger.error(err.toString());
  })

  rl.on('line', (input) => {
    workQueue.push(processFile.bind(this,{fileName: input, bucketDest, originPrefix, localCrawlDir}));
  })
}


// Updates the graph with the new file. Then uploads the file to Minio.
// Returns a promise that resolves when both of these things are done.
function processFile({fileName, bucketDest, originPrefix, localCrawlDir}) {
  if(!fileName.match(whitelist)) { return Promise.resolve(false) }

  // Process file here.
  fileName = path.normalize(fileName);
  var originPath = originPrefix + path.posix.normalize(fileName).replace(localCrawlDir,'');
  var destFilePath = path.join(bucketDest,path.posix.normalize(fileName).replace(localCrawlDir,''))
  var folderStructure = path.join(conf.get("minio.fileBucket"),destFilePath).split(path.sep).filter(itm=>!!itm) // Path split into an array of names.

  // Run the query to add the file to the graph.
  var query = queryBuilder.mergeFileAndSubdirQuery(folderStructure, fileName, originPath);
  return bot.query(query.compile(), query.params()).then((itm) => {
    bot.logger.info("Added file to graph. Now uploading to Minio:", fileName);

    // Now build our file object for uploading to Minio
    fileObj = {
      dest: destFilePath,
      loc: fileName,
      mime: mime.lookup(fileName)
    };

    return minioUploader.copyFilePromise(fileObj, bot.logger).then(function (res) {
      bot.logger.info("Copy file finished: " + res);
    })
  }).catch((err) => {
    bot.logger.error("Error merging subdirectory with graph:", err.toString());
  })
}