/*
 * Copyright (C) 2017 Menome Technologies Inc.
 *
 * Store the singleton minio client here.
 */
var Minio = require('minio');
var config = require('./config');

module.exports = new Minio.Client({
  endPoint: config.get("minio.endPoint"),
  port: config.get("minio.port"),
  secure: config.get("minio.useSSL"),
  accessKey: config.get("minio.accessKey"),
  secretKey: config.get("minio.secretKey")
});