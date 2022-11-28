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
  // Upload files to disk and work with temporary file paths
  // As soon as the response ends all files are removed.
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

  // Upload files to disk and work with temporary file paths
  fastify.post('/upload-files', async function (req, reply) {
    if (!req.isMultipart()) {
      // you can use this decorator instead of checking headers
      reply.code(400).send(new Error('Request is not multipart'))
      return
    }
    const files = req.files()
    const uuid = uuidv4()
    const dir = `./tmp/${uuid}`
    try {
      await mkdir(dir)
      await mkdir(`${dir}/images`)
      await mkdir(`${dir}/models`)
      const _ = []
      for await (const file of files) {
        // req.log.info('storing %s', file.filename)
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
      console.log(`process(${uuid})`)
      console.time('process')
      process(uuid, _)
      reply.statusCode = 201
      return { upload: 'processing', id: uuid, count: _.length, files: _ }
    } catch (err) {
      fastify.log.error(err)
      reply.statusCode = 500
      return { upload: 'failed', message: err.message }
    }
  })

  // Testing endpoint
  // fastify.post('/process', async function (req, reply) {
  //   const { id } = req.body
  //   return process(id)
  // })
  // fastify.post(', async function (req, reply) {
  //   const { id } = req.body
  //   retur(id)
  // })
}) // end fp
