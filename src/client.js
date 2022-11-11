const AWS = require('aws-sdk')
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env

const s3Client = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
})

const dynamoDBClient = new AWS.DynamoDB.DocumentClient({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
})

const putItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  }
  return dynamoDBClient.put(params).promise()
}

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

const _appendItemList = async (id, tableName, property, string) => {
  dynamoDBClient.update(
    {
      TableName: tableName,
      Key: { id: id },
      UpdateExpression: 'SET #attrName = list_append(#attrName, :attrValue)',
      ExpressionAttributeNames: {
        '#attrName': property,
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

const putObject = async (id, bucketName, tableName, bucketPath, data) => {
  let params = {
    Bucket: bucketName,
    Key: `${id}/${bucketPath}`,
    Body: data,
  }
  s3Client.putObject(params, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      const url = `https://${bucketName}.s3.amazonaws.com/${id}/${bucketPath}`
      // console.log(id, bucketName, 'urlsS3', url)
      _appendItemList(id, tableName, 'urlsS3', url)
      console.log('Successfully uploaded ' + bucketPath + ' to ' + bucketName)
    }
  })
}
module.exports = {
  putItem,
  updateItem,
  putObject,
}
