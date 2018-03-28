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

// Our list of regexes. Pre-compile them.
const regexWhitelist = conf.get("crawler.regexWhitelist").map(x=>new RegExp(x,"i"));

module.exports = {
  CrawlFolder
}

// Crawls a folder. Runs queries to put the folder structure in the graph.
// Copies the successfully merged files into a directory.
function CrawlFolder({localCrawlDir, bucketDest, originPrefix, skipTo}, cb) {
  localCrawlDir = path.normalize(localCrawlDir);
  bucketDest = path.posix.normalize(bucketDest);
  var parsedLines = 0; //Start the index at 1. We want it to match our uploaded file count.
  var parsedFiles = 0;
  bot.logger.info("Starting folder crawler on: " + localCrawlDir);

  var findcmd = spawn("find", [localCrawlDir, "-type", "f", "-regextype", "grep", "-iregex", conf.get("crawler.findRegex"), "!", "-size", "0"]);
  var rl = readline.createInterface({ input: findcmd.stdout });
  var findFinished = false;

  var workQueue = async.queue((task,callback) => {
    task().then((resp)=>{
      parsedFiles++;
      if(resp === 'skipped') bot.logger.info("Skipped File", parsedFiles) 
      else bot.logger.info("Finished processing item", parsedFiles) 

      callback(); 
    })
  })
  
  findcmd.on("error", (err) => {
    bot.logger.error(err.toString());
  })

  findcmd.on("close", (code) => {findFinished = true})

  rl.on('line', (input) => {
    parsedLines++;
    if(typeof skipTo === 'number' && parsedLines < skipTo) return workQueue.push(()=>{return Promise.resolve('skipped')});
    workQueue.push(processFile.bind(this,{fileName: input, bucketDest, originPrefix, localCrawlDir}));
  })

  // Called when our work queue is empty.
  // If our work queue is empty AND our crawling command has finished, then we're done here.
  workQueue.drain = () => {
    if(findFinished === true) {
      bot.logger.info("Finished crawling",localCrawlDir);
      return cb();
    }
  }
}

// Updates the graph with the new file. Then uploads the file to Minio.
// Returns a promise that resolves when both of these things are done.
function processFile({fileName, bucketDest, originPrefix, localCrawlDir}) {
  // Process file here.
  fileName = path.normalize(fileName);
  var originPath = originPrefix + path.posix.normalize(fileName).replace(localCrawlDir,'');
  var destFilePath = path.join(bucketDest,path.posix.normalize(fileName).replace(localCrawlDir,''))
  var folderStructure = path.join(conf.get("minio.fileBucket"),destFilePath).split(path.sep).filter(itm=>!!itm) // Path split into an array of names.

  // If it doesn't match any of our whitelisted regexes, don't crawl it.
  var shouldCrawl = false;
  for(var i=0;!shouldCrawl && i<regexWhitelist.length;i++) {
    if(!!fileName.match(regexWhitelist[i])) 
      shouldCrawl = true;
  }

  if(!shouldCrawl && regexWhitelist.length > 0) return Promise.resolve(false);

  bot.logger.info("Processing:", fileName);

  // Run the query to add the file to the graph.
  var query = queryBuilder.mergeFileAndSubdirQuery(folderStructure, fileName, originPath);
  return bot.query(query.compile(), query.params()).then((itm) => {
    bot.logger.info("Added file to graph.");

    // Now build our file object for uploading to Minio
    fileObj = {
      dest: destFilePath,
      loc: fileName,
      mime: mime.lookup(fileName)
    };

    return minioUploader.copyFilePromise(fileObj, bot.logger).then(function (res) {
      bot.logger.info("File copied to Minio:", res);
    })
  }).catch((err) => {
    bot.logger.error("Error merging subdirectory with graph:", err.toString());
  })
}