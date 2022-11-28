'use strict'

const { readdir, stat, readFile } = require('fs/promises')
const path = require('path')
const {
  s3: { putItem, updateItem, putObject },
  supabase: { insertRow, updateRow, uploadFile },
} = require('./client')
const { walkSync, generate } = require('./utils')
const { AWS_S3_BUCKET, AWS_DYNAMO_DB } = process.env

const _uploadDir = function ({ id, tableId, dirpath, s3, supabase }) {
  walkSync(dirpath, function (filePath, stat) {
    let bucketPath = filePath.substring(dirpath.length + 1)
    readFile(filePath).then(data => {
      console.log('uploadFile', bucketPath)
      s3 && putObject(id, AWS_S3_BUCKET, AWS_DYNAMO_DB, bucketPath, data)
      supabase &&
        uploadFile(tableId, AWS_S3_BUCKET, AWS_DYNAMO_DB, bucketPath, data)
    })
  })
}

const createProcessing = async ({
  id,
  count,
  files,
  supabase = false,
  s3 = false,
}) => {
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

const updateProcessing = ({
  tmpDir,
  id,
  tableId,
  supabase = false,
  s3 = false,
}) => {
  // 1. update dynamoDB
  const _ = {
    id: id,
    status: 'Processed',
    finishedAt: new Date().toISOString(),
  }
  s3 && updateItem(AWS_DYNAMO_DB, _)
  if (supabase) {
    _.id = tableId
    _.finished_at = _.finishedAt
    delete _.finishedAt
    updateRow(AWS_DYNAMO_DB, _)
  }
  // 2. retrieve and upload files to s3
  const dirpath = `${tmpDir}/${id}/models`
  _uploadDir({ id, tableId, dirpath, s3, supabase })
}

module.exports = { createProcessing, updateProcessing }
