'use strict'

const { readdir, stat, readFile } = require('fs/promises')
const path = require('path')
const {
  s3: { putItem, updateItem, putObject },
  supabase: { insertRow, updateRow, uploadFile },
} = require('./client')
const { AWS_S3_BUCKET, AWS_DYNAMO_DB } = process.env

const createProcessing = async (id, count, files) => {
  const _ = {
    id,
    uuid: id,
    count,
    files,
    status: 'Processing',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    urlsS3: [],
  }
  putItem(AWS_DYNAMO_DB, _)
  delete _.id
  _.finished_at = _.finishedAt
  delete _.finishedAt
  _.started_at = _.startedAt
  delete _.startedAt
  _.models_url = _.urlsS3
  delete _.urlsS3
  return await insertRow(AWS_DYNAMO_DB, _)
}

const _uploadDir = function (id, tableId, s3Path, bucketName, tableName) {
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
      uploadFile(tableId, bucketName, tableName, bucketPath, data)
    })
  })
}

const updateProcessing = (tmpDir, id, tableId) => {
  // 1. update dynamoDB
  const _ = {
    id: id,
    status: 'Processed',
    finishedAt: new Date().toISOString(),
  }
  updateItem(AWS_DYNAMO_DB, _)
  _.id = tableId
  _.finished_at = _.finishedAt
  delete _.finishedAt
  updateRow(AWS_DYNAMO_DB, _)
  // 2. retrieve and upload files to s3
  const dir = `${tmpDir}/${id}/models`
  _uploadDir(id, tableId, dir, AWS_S3_BUCKET, AWS_DYNAMO_DB)
}

module.exports = { createProcessing, updateProcessing }
