/*
 * Copyright (C) 2017 Menome Technologies Inc.
 *
 * Merges the external config file with environment variables and default config values.
 */
var extConf = require('../config/conf');

var defaults = {
  minio: {
    endPoint: 'minio',
    port: 9000,
    secure: false,
    accessKey: 'abcd123',
    secretKey: 'abcd12345',
    fileBucket: 'filestore'
  },
  neo4j: {
    url: 'bolt://neo4j',
    user: 'neo4j',
    pass: 'neo4j'
  },
  dir: {
    destName: 'output',
    preservedDepth: 3,
    samba: 'true'
  },
  regex: {
    match: ".pdf$|.docx$|.doc$|.pptx$|.txt$"
  },
  stopFolders: [
    "fart"
  ]
}

// Merged external conf and default conf, prioritizing external conf.
var mergedConf = {};
Object.assign(mergedConf, defaults, extConf)

if(process.env.NEO4J_URL) mergedConf.neo4j.url = process.env.NEO4J_URL;
if(process.env.NEO4J_USER) mergedConf.neo4j.user = process.env.NEO4J_USER;
if(process.env.NEO4J_PASS) mergedConf.neo4j.pass = process.env.NEO4J_PASS;

// Export the config.
module.exports = mergedConf;
