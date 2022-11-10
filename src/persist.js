const AWS = require('aws-sdk')
const { readdir, stat, readFile } = require('fs/promises')
const path = require('path')
// create s3Client
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_S3_BUCKET,
  AWS_DYNAMO_DB,
} = process.env
const s3Client = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
})
// create dynamoDBClient
const dynamoDBClient = new AWS.DynamoDB.DocumentClient({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
})

/**
 * @param {string} tableName
 * @param {Object} item JSON object
 * @returns {Promise<AWS.DynamoDB.DocumentClient.PutItemOutput>}
 */
const putItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  }
  return dynamoDBClient.put(params).promise()
}

/**
 * @param {string} tableName
 * @param {Object} item JSON object
 * @returns {Promise<AWS.DynamoDB.DocumentClient.PutItemOutput>}
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
 */
const updateItem = async (tableName, item) => {
  const id = item.id
  delete item.id
  let updateExpression = 'set'
  let ExpressionAttributeNames = {}
  let ExpressionAttributeValues = {}
  for (const property in item) {
    updateExpression += ` #${property} = :${property} ,`
    ExpressionAttributeNames['#' + property] = property
    ExpressionAttributeValues[':' + property] = item[property]
  }
  console.log(ExpressionAttributeNames)

  updateExpression = updateExpression.slice(0, -1)
  const params = {
    TableName: tableName,
    Key: {
      id,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: ExpressionAttributeNames,
    ExpressionAttributeValues: ExpressionAttributeValues,
  }

  return dynamoDBClient.update(params).promise()
}

/**
 * @param {string} id
 * @param {number} count
 * @param {Object} files { filename: string, mimetype: string, fieldname: string }
 */
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
const appendUrlsS3 = async (id, string) => {
  dynamoDBClient.update(
    {
      TableName: AWS_DYNAMO_DB,
      Key: { id },

      UpdateExpression: 'SET #attrName = list_append(#attrName, :attrValue)',
      ExpressionAttributeNames: {
        '#attrName': 'urlsS3',
      },
      ExpressionAttributeValues: {
        ':attrValue': [string],
      },
    },
    function (err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log(data)
      }
    }
  )
}
const uploadDir = function (id, s3Path, bucketName) {
  console.log(s3Path, bucketName)
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
      // astrarre
      let params = {
        Bucket: bucketName,
        Key: `${id}/${bucketPath}`,
        Body: data,
      }
      s3Client.putObject(params, function (err, data) {
        if (err) {
          console.log(err)
        } else {
          const url = `https://${bucketName}.s3.amazonaws.com/${id}/${bucketPath}`
          appendUrlsS3(id, url)
          console.log(
            'Successfully uploaded ' + bucketPath + ' to ' + bucketName
          )
        }
      })
    })
  })
}
/**
 *
 * @param {string} tmpDir
 * @param {string} id
 */
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
  uploadDir(id, dir, AWS_S3_BUCKET)
}

module.exports = { createProcessing, updateProcessing }
