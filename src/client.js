const AWS = require('aws-sdk')
const { createClient } = require('@supabase/supabase-js')

const config = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env
  return {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
  }
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const s3Client = new AWS.S3(config())
const dynamoDBClient = new AWS.DynamoDB.DocumentClient(config())

// supabase
const insertRow = async (tableName, item) => {
  const { data, error } = await supabase
    .from(tableName)
    .insert(item)
    .select()
    .single()
  if (error) {
    throw error
  }
  return data
}
// aws
const putItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  }
  return dynamoDBClient.put(params).promise()
}

// supabase
const updateRow = async (tableName, item) => {
  const { id } = item
  const { data, error } = await supabase
    .from(tableName)
    .update(item)
    .eq('id', id)
    .single()
  if (error) {
    throw error
  }
  return data
}

// aws
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
  // console.log(ExpressionAttributeNames)
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

// supabase
const _appendItemArray = async (id, tableName, property, string) => {
  const { data, error } = await supabase
    .from(tableName)
    .select(property)
    .eq('id', id)
    .single()
  if (error) {
    throw error
  }
  const { data: d, error: e } = await supabase
    .from(tableName)
    .update({
      [property]: [...data[property], string],
    })
    .eq('id', id)
    .single()
  if (e) {
    throw e
  }
  return d
}

// aws
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
      }
      // else {
      //   console.log(data)
      // }
    }
  )
}

// supabase
const uploadFile = async (id, bucketName, tableName, bucketPath, data) => {
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(`${id}/${bucketPath}`, data)
  if (error) {
    throw error
  }
  const { data: d } = await supabase.storage
    .from(bucketName)
    .getPublicUrl(`${id}/${bucketPath}`)

  _appendItemArray(id, tableName, 'models_url', d.publicUrl)
}

// aws
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
      // console.log('Successfully uploaded ' + bucketPath + ' to ' + bucketName)
    }
  })
}
module.exports = {
  s3: { putItem, updateItem, putObject },
  supabase: { insertRow, updateRow, uploadFile },
}
