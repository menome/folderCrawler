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
const { execFile } = require('child_process');

module.exports = {
  CrawlFolder
}

// Crawls a folder. Runs queries to put the folder structure in the graph.
// Copies the successfully merged files into a directory.
function CrawlFolder(line, bucketDest, originPrefix, cb) {
  line = path.normalize(line);
  bucketDest = path.posix.normalize(bucketDest);
  bot.logger.info("Starting folder crawler on: " + line);
  var filesToCopy = [];
  
  var whitelist = new RegExp(conf.get("crawler.matchRegex"));
  
  // Find all files
  execFile("find", [line, "-type", "f", "-regextype", "grep", "-iregex", conf.get("crawler.findRegex")], (err, stdout, stderr) => {
    if(err) return bot.logger.info(err.toString())
    var files = stdout.split("\n");

    // Iterate through one at a time. Don't keep going until we run our query.
    async.eachSeries(files, (file, next) => {
      if(!file.match(whitelist)) { return next(); }

      // Process file here.
      file = path.normalize(file);
      var originPath = originPrefix + path.posix.normalize(file).replace(line,'');
      var destFilePath = path.join(bucketDest,path.posix.normalize(file).replace(line,''))
      var folderStructure = path.join(conf.get("minio.fileBucket"),destFilePath).split(path.sep).filter(itm=>!!itm) // Path split into an array of names.

      // Run the query to add the file to the graph.
      var query = queryBuilder.mergeFileAndSubdirQuery(folderStructure, file, originPath);
      return bot.query(query.compile(), query.params()).then((itm) => {
        bot.logger.info("Added file", file);
        fileObj = {
          dest: destFilePath,
          loc: file,
          mime: mime.lookup(file)
        };
        filesToCopy.push(fileObj);
        return next();
      }).catch((err) => {
        bot.logger.error("Error merging subdirectory with graph: " + err.toString());
        return next();
      })
    }, () => {
      bot.logger.info("Done graphing: " + line + ". Copying " + filesToCopy.length + " files to minio");
      // Copy the files that worked.
      async.eachSeries(filesToCopy, (fileToCopy, next) => {
        minioUploader.copyFilePromise(fileToCopy, bot.logger)
        .then(function (res) {
          bot.logger.info("copy file finished: " + res);
          return next();
        })
      })
    });
  })
}