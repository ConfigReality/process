'use strict'

const { readdir, stat, readFile } = require('fs/promises')
const path = require('path')
const {
  s3: { putItem, updateItem, putObject },
  supabase: { insertRow, updateRow, uploadFile },
} = require('./client')
const { walkSync, generate, walk } = require('./utils')
const { BUCKET, DB_TABLE } = process.env

const _uploadDir = function ({ id, tableId, dirpath, s3, supabase }) {
  // console.log('uploading dir', dirpath)
  // walkSync(dirpath, async (filePath, stat) => {
  //   console.log('Uploading file:', filePath)
  //   let bucketPath = filePath.substring(dirpath.length + 1)
  //   const data = await readFile(filePath)
  //   s3 && putObject(id, BUCKET, DB_TABLE, bucketPath, data)
  //   if (supabase)
  //     await uploadFile(tableId, BUCKET, DB_TABLE, bucketPath, data)
  //   console.log('Uploaded file:', bucketPath)
  // })
  walk(dirpath).then(async files => {
    console.log('Uploading files:', files.length)
    Promise.all(files).then(async files => {
      // files.forEach(async ({ file, path }, i) => {
      for await (const { file, path } of files) {
        console.log('Uploading file:')
        s3 && putObject(id, BUCKET, DB_TABLE, path, await file)
        if (supabase)
          await uploadFile(tableId, BUCKET, DB_TABLE, path, await file)
        console.log('Uploaded file:', path)
      }
    })
  })
}

const createProcessing = async ({
  id,
  count,
  files,
  supabase = false,
  s3 = false,
  userId,
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
    userId,
  }
  s3 && putItem(DB_TABLE, _)
  if (supabase) {
    delete _.id
    _['finished_at'] = _.finishedAt
    delete _.finishedAt
    _['started_at'] = _.startedAt
    delete _.startedAt
    _['models_url'] = _.urlsS3
    delete _.urlsS3
    return insertRow(DB_TABLE, _)
  }
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
  s3 && updateItem(DB_TABLE, _)
  if (supabase) {
    _.id = tableId
    _.finished_at = _.finishedAt
    delete _.finishedAt
    updateRow(DB_TABLE, _)
  }
  // 2. retrieve and upload files to s3
  const dirpath = `${tmpDir}/${id}/models`
  _uploadDir({ id, tableId, dirpath, s3, supabase })
}

module.exports = { createProcessing, updateProcessing }
