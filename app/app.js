/** 
 * Copyright (C) 2017 Menome Technologies Inc.  
 * 
 * A microservice for crawling through file folders.
 */
var express = require("express");
var http = require('http');
var port = process.env.PORT || 4000;
var runner = require('./runner')

function app(testMode=false) {
  var app = express();
  app.testMode = testMode;

  // An echo endpoint.
  app.get('/', function (req, res, next) {
    return res.send("This is a file crawler service");
  });

  app.post('/crawl', function(req,res,next) {
    res.send("Starting filesystem crawl");
    return runner.run();
  })

  return app;
}

///////////////
// Start the App

// If we're not being imported, just run our app.
if (!module.parent) {
  var app = app();
  
  http.createServer(app).listen(port);
  console.log("Listening on " + port);
}

module.exports = app;