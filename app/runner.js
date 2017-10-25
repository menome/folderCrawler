/**
 * Copyright (C) 2017 Menome Technologies.
 *
 * Top-level application runner.
 */
var async = require('async');
var crawler = require('./crawler');
var queryBuilder = require('./queryBuilder');
var db = require('./database');
var conf = require('./config');

// Hack. Make sure uncaught exceptions don't knock over our entire process.
process.on('uncaughtException', (err) => {
  console.error("Caught Exception",err.toString())
});

module.exports.run = function() {
    // Don't work on blank lines.
  async.eachSeries(require('fs').readFileSync('config/folders.txt').toString().split(/\r?\n/), function(line,next){
    console.log('===========Running on', line, "====================");    
    if(line.trim().length < 1) return next();
    crawler.CrawlFolder(line, conf.dir.destName,next)
  }, function(err) {
    console.log('iterating done');
  }); 
}

// If we're not being imported by the webservice, just run and exit.
if (!module.parent) {
  module.exports.run();
}