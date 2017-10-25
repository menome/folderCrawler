/**
 * Copyright (C) 2017 Menome Technologies.
 *
 * Utilities for copying files
 */
var path = require('path');
var fs = require('fs');

module.exports = {
  copyFilePromise,
  copyMultiFilePromise
};

function copyFilePromise(source, target) {
  console.log("\nCopying File: " + source + "\nDestination: " + target);

  // TODO: There's probably some mkdir -p type thing here. Not sure we need recursion.
  var ensureDirectoryExistence = function (filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

  return new Promise(function (accept, reject) {
    ensureDirectoryExistence(target);
    var rd = fs.createReadStream(source);
    var wr = fs.createWriteStream(target);
    rd.on("error", function (err) {
      rd.close();
      reject(err);
    });
    wr.on("error", function (err) {
      wr.close();
      reject(err);
    });
    wr.on("close", function (ex) {
      accept();
    });
    rd.pipe(wr);
  });
}

// Reflect function so we can await all promises, regardless of success of failure.
// https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises
function reflect(promise){
  return promise.then(function(v){ return {v:v, status: "resolved" }},
                      function(e){ return {e:e, status: "rejected" }});
}

function copyMultiFilePromise(srcTgtPairArr, logger) {
  var copyFilePromiseArr = [];
  srcTgtPairArr.forEach(function (srcTgtPair) {
    logger.log("Copying file: " + srcTgtPair[0] + " to: " + srcTgtPair[1])
    copyFilePromiseArr.push(copyFilePromise(srcTgtPair[0], srcTgtPair[1]));
  });

  // We reflect the promises so a single failure doesn't kill the app. 
  return Promise.all(copyFilePromiseArr.map(reflect)).then(function(results) {
    var success = results.filter(x => x.status === "resolved");
    results.forEach((itm) => {
      if(itm.status === "rejected") // Log all failures.
        logger.log("Failed to copy file: " + itm.e.toString())
    })

    return results;
  });
}