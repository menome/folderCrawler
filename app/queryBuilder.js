/**
 * Copyright (C) 2017 Menome Technologies.
 *
 * Logic for building database queries.
 */
var Query = require('decypher').Query;

module.exports = {
  mergeFileAndSubdirQuery
};

function mergeFileAndSubdirQuery(folderStructure, line, originPath) {
  var query = new Query();
  var fileIdx = folderStructure.length - 1;

  // Format the filepaths.
  // Now folderStructure contains the names, paths contains the URIs.
  var paths = [];
  folderStructure.forEach((itm, idx) => {
    if (idx === 0)
      paths[idx] = folderStructure[idx];
    else
      paths[idx] = paths[idx - 1] + '/' + folderStructure[idx]
  })

  // Figure out a pattern for each folder. of the form: (fn:Card:Folder {Uri: {folderUri_fn}, Name: {folderName_fn}})
  // Also adds params.
  var folderMergeStmts = [];
  paths.forEach((itm, idx) => {
    if (idx === paths.length - 1) return;
    folderMergeStmts.push("(f" + idx + ":Card:Folder {Uri: $folderUri_" + idx + ", Name: $folderName_" + idx + "})")
    query.param('folderUri_' + idx, paths[idx]);
    query.param('folderName_' + idx, folderStructure[idx]);
  })

  // Merge the folders piece-wise so we don't create duplicate strcutures. This makes a giant chain of MERGE/WITH statements.
  folderMergeStmts.forEach((itm, idx) => {
    if (idx === folderMergeStmts.length - 1) return;
    if (idx === 0) {
      query.merge(itm);
      query.merge("(f0)-[:HasSubDirectory]->" + folderMergeStmts[idx + 1]);
      query.with("f" + (idx + 1));
    } else {
      query.merge("(f" + (idx) + ")-[:HasSubDirectory]->" + folderMergeStmts[idx + 1]);
      query.with("f" + (idx + 1));
    }
  })

  // Finally merge in the file at the end.
  query.merge("(f" + (fileIdx - 1) + ")-[:ContainsFile]->(file:Card:File {Uri: $fileUri, Name: $fileName})")
  query.param('fileUri', paths[fileIdx])
  query.param('fileName', folderStructure[fileIdx])

  //query.with("file")
  query.set("file.DateAdded = $dateAdded")
  query.param('dateAdded', new Date().toUTCString())
  query.set("file.OriginPath = $OriginPath")
  query.set("file.PendingUpload = true")
  query.set("file.ExistsInFilestore = true")
  query.set("file.SourceSystems = ['FolderCrawler']")
  query.param('OriginPath', originPath)
  return query;
}