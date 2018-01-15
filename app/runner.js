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

// Hack. Make sure uncaught exceptions don't knock over our entire process.
process.on('uncaughtException', (err) => {
  console.error("Caught Exception",err.toString())
  throw err
});

module.exports.run = function() {
  // First thing we do is ensure that our mounts are mounted.
  if (fs.existsSync('./config/mount.sh')) {
    console.log("Ensuring directories are mounted.")
    return exec('/bin/bash ./config/mount.sh', (err,stdout,stderr) => {
      if(err) throw err;
      return runCrawl();
    })
  }
  else 
    return runCrawl();
}

function runCrawl() {
  // Don't work on blank lines.
  return async.eachSeries(fs.readFileSync('./config/folders.txt').toString().split(/\r?\n/), function(line,next){
    if(line[0] === '#') return next();
    var lines = line.split(':');
    var dir = lines[0];
    var dest = lines[1];

    console.log('===========Running on', dir, "====================");
    if(line.trim().length < 1) return next();
    else return crawler.CrawlFolder(dir, dest, next)
  }, function(err) {
    if(err) console.error(err.toString())
    console.log('iterating done');
  });
}

// If we're not being imported by the webservice, just run and exit.
if (!module.parent) {
  module.exports.run();
}