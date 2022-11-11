'use strict'

const { readdir, stat, readFile } = require('fs/promises')
const path = require('path')
const { putItem, updateItem, putObject } = require('./client')
const { AWS_S3_BUCKET, AWS_DYNAMO_DB } = process.env

const createProcessing = (id, count, files) => {
  const _ = {
    id,
    count,
    files,
    status: 'Processing',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    urlsS3: [],
  }
  putItem(AWS_DYNAMO_DB, _)
}

const _uploadDir = function (id, s3Path, bucketName, tableName) {
  // console.log(s3Path, bucketName)
  function walkSync(currentDirPath, callback) {
    readdir(currentDirPath).then(files => {
      // console.log('files', files.length)
      files.forEach(function (name) {
        var filePath = path.join(currentDirPath, name)
        stat(filePath).then(_stat => {
          if (_stat.isFile()) {
            // console.log('_stat.isFile()')
            callback(filePath, _stat)
          } else if (_stat.isDirectory()) {
            // console.log('_stat.isDirectory()')
            walkSync(filePath, callback)
          }
        })
      })
    })
  }

  walkSync(s3Path, function (filePath, stat) {
    let bucketPath = filePath.substring(s3Path.length + 1)
    readFile(filePath).then(data => {
      // _putObject(id, bucketName, bucketPath, data)
      putObject(id, bucketName, tableName, bucketPath, data)
    })
  })
}

const updateProcessing = (tmpDir, id) => {
  // 1. update dynamoDB
  const _ = {
    id: id,
    status: 'Processed',
    finishedAt: new Date().toISOString(),
  }
  updateItem(AWS_DYNAMO_DB, _)
  // 2. retrieve and upload files to s3
  const dir = `${tmpDir}/${id}/models`
  _uploadDir(id, dir, AWS_S3_BUCKET, AWS_DYNAMO_DB)
}

module.exports = { createProcessing, updateProcessing }
