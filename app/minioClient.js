/*
 * Copyright (C) 2017 Menome Technologies Inc.
 *
 * Store the singleton minio client here.
 */
var Minio = require('minio');
var conf = require('./config');

module.exports = new Minio.Client({
  endPoint: conf.minio.endPoint,
  port: conf.minio.port,
  secure: conf.minio.secure,
  accessKey: conf.minio.accessKey,
  secretKey: conf.minio.secretKey
});