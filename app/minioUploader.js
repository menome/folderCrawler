var minioClient = require('./minioClient');
var fs = require('fs');
var conf = require('./config');

module.exports = {
  copyFilePromise,
  copyMultiFilePromise
}

function copyFilePromise(fileObj) {
  // console.log("Copying file: " + fileObj.loc + " to minio");
  return new Promise(function (accept, reject) {
    var fileStream = fs.createReadStream(fileObj.loc);
    fileStream.on('error', (err) => {return reject(err.toString())});

    var fileStat = fs.stat(fileObj.loc, function(err,stats) {
      if(err) return reject(err.toString());
      if(stats.size === 0) return reject("File is empty! Skipping.");
      minioClient.putObject(conf.get("minio.fileBucket"), fileObj.dest, fileStream, fileObj.mime, stats.size, function(err, etag) {
        fileStream.close();
        if (err) return reject(err.toString());
        else return accept(etag);
      })
    })
  })
}

// Reflect function so we can await all promises, regardless of success of failure.
// https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises
function reflect(promise){
    return promise.then(function(v){ return {v:v, status: "resolved" }},
                        function(e){ return {e:e, status: "rejected" }});
}

function copyMultiFilePromise(fileObjSet, logger) {
  var copyFilePromiseArr = [];
  fileObjSet.forEach(function (fileObj) {
    logger.log("Copying file: " + fileObj + " to minio")
    copyFilePromiseArr.push(copyFilePromise(fileObj));
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
