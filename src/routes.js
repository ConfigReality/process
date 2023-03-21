'use strict'

const fs = require('fs')
const util = require('util')
const { default: fp } = require('fastify-plugin')
const { v4: uuidv4 } = require('uuid')
const { pipeline } = require('stream')
const { mkdir } = require('fs/promises')
const { process } = require('./process')
const pump = util.promisify(pipeline)

module.exports = fp(async function (fastify, opts) {
  // create a temporary directory for uploads id it doesn't exist
  fs.mkdir('./tmp', err => {
    if (err) {
      if (err.code === 'EEXIST') {
        console.log('Directory already exists')
      } else {
        console.log('Error creating directory')
      }
    } else {
      console.log('Directory created successfully')
    }
  })

  // main route
  fastify.post('/upload-files', async function (req, reply) {
    // check if request is multipart
    if (!req.isMultipart()) {
      reply.code(400).send(new Error('Request is not multipart'))
      return
    }
    // get user id from request headers
    const { u: userId } = req.headers
    // get files from request
    const files = await req.files()
    // generate a unique id for this upload for each session
    const uuid = uuidv4()
    // create a temporary directory for this upload
    const dir = `./tmp/${uuid}`
    try {
      // create the
      await mkdir(dir)
      await Promise.all([mkdir(`${dir}/images`), mkdir(`${dir}/models`)])
      const _ = []
      // read each file from the generators and store it in the temporary directory
      for await (const file of files) {
        const storedFile = fs.createWriteStream(
          `${dir}/images/${file.filename}`
        )
        await pump(file.file, storedFile)
        _.push({
          filename: file.filename,
          mimetype: file.mimetype,
          fieldname: file.fieldname,
        })
      }
      if (_.length === 0) {
        reply.statusCode = 400
        return { upload: 'failed', message: 'No files uploaded' }
      }
      console.log(`process(${uuid})`)
      console.time('process')
      process({ id: uuid, files: _, userId }) // process asynchronously
      reply.statusCode = 201
      return { upload: 'processing', id: uuid, count: _.length, files: _ }
    } catch (err) {
      fastify.log.error(err)
      reply.statusCode = 500
      return { upload: 'failed', message: err.message }
    }
  })
}) // end fp
