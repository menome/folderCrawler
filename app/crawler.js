/**
 * Copyright (C) 2017 Menome Technologies.
 *
 * Crawls a file tree, copies it, and turns it into graph nodes.
 */
var dir = require('node-dir');
var queryBuilder = require('./queryBuilder');
var db = require('./database');
var conf = require('./config');
var crypto = require('crypto');
var async = require('async');
var mime = require('mime-types');
var copier = require('./copier')
var logger = new(require('caterpillar').Logger)();
var path = require('path');
module.exports = {
  CrawlFolder
}

// Crawls a folder. Runs queries to put the folder structure in the graph.
// Copies the successfully merged files into a directory.
function CrawlFolder(line, destPrefix,cb) {
  line = path.normalize(line);
  console.log("Starting folder crawler on: " + line);
  var filesToCopy = [];
  logger.pipe(require('fs').createWriteStream('./debug.log'));
  var minioUploader = require('./minioUploader');

  var whitelist = new RegExp(conf.regex.match);

  dir.files(line, function(err, files) {
    if(err) {
      console.log("ERROR LOGGED" + err.toString());
      files = [];
    }

    // Iterate through one at a time. Don't keep going until we run our query.
    async.eachSeries(files, (file, next) => {
      if(!file.match(whitelist)) return next();

      // Process file here.
      file = path.normalize(file);
      var rootDir = line.split(path.sep).pop();
      var toTrim = line.replace(rootDir,"");

      // If we have a preservedDepth
      if(!!conf.dir.preservedDepth && conf.dir.preservedDepth > 0) {
        var pathList = line.split(path.sep);
        toTrim = pathList.slice(0,conf.dir.preservedDepth).join(path.sep);
      }

      var destFilePath = file.replace(toTrim,""); //Path relative to our folder.
      var folderStructure = destFilePath.split(path.sep).filter(itm=>!!itm) // Path split into an array of names.

      // Run the query to add the file to the graph.
      var query = queryBuilder.mergeFileAndSubdirQuery(folderStructure, file);
      // console.log(query)
      //console.log(path.join(destPrefix, destFilePath))

      db.query(query.compile(), query.params()).then((itm) => {
        // console.log("Added file", file)
        fileObj = {
          dest: destFilePath.substr(1, destFilePath.length).replace(/\\/g,"/"),
          loc: file,
          mime: mime.lookup(file)
        };
        filesToCopy.push(fileObj);
        //filesToCopy.push([file, path.join(destPrefix, destFilePath)])
        return next();
      }).catch((err) => {
        //console.log("Failed to add file", err.toString())
        logger.log("ERROR: Error merging subdirectory with graph: " + err.toString());
        return next();
      })
    }, function() {
      console.log("Done graphing: " + line + "\nCopying " + filesToCopy.length + " files to minio");
      // Copy the files that worked.
      async.eachSeries(filesToCopy, (fileToCopy, next) => {
        minioUploader.copyFilePromise(fileToCopy, logger)
        .then(function (res) {
          logger.log("copy file finished: " + res);
          return next();
        })
      },function (res) {
        db.closeDriver();
        logger.log("Copy complete, received no errors copying " + filesToCopy.length + " files");
        console.log("File Copy Complete. Check log for errors");
        logFile = {
          loc: "./debug.log",
          dest: "logs/"+line.replace(/\\/g,"_").replace(path.sep,"_").replace(":","")+"-debug.log", // You're welcome ;)
          mime: mime.lookup("./debug.log")
        }
        minioUploader.copyFilePromise(logFile).then((itm) => {
          console.log("Log copied into destination.");
          cb();
        }).catch((err) => {
          console.log("Log file not copied:", err.toString());
          cb();
        })
      });
    });
  });
}
