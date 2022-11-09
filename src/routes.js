'use strict'

const fs = require('fs')
const util = require('util')
const { default: fp } = require('fastify-plugin')
const { v4: uuidv4 } = require('uuid')
const { pipeline } = require('stream')
const { mkdir } = require('fs/promises')
const { process, convert } = require('./process')
const { createProcessing } = require('./lib/client')
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
        req.log.info('storing %s', file.filename)
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
      process(uuid)

      createProcessing(
        uuid,
        _.length,
        _.map(_ => _.filename)
      )

      return { upload: 'completed', id: uuid, count: _.length, files: _ }
    } catch (err) {
      fastify.log.error(err)
      reply.statusCode = 500
      return { upload: 'failed', message: err.message }
    }
  })

  // Upload files to disk and work with temporary file paths
  // As soon as the response ends all files are removed.
  // fastify.post('/upload-tmp-sync', async function (request) {
  //   const files = await request.saveRequestFiles({
  //     tmpdir: './tmp',
  //   })
  //   const _ = []
  //   for (const f of files) {
  //     _.push({
  //       fieldname: f.fieldname,
  //       filename: f.filename,
  //       encoding: f.encoding,
  //       mimetype: f.mimetype,
  //       filepath: f.filepath,
  //     })
  //   }
  //   return { upload: 'completed', files: _ }
  // })
  fastify.post('/process', async function (req, reply) {
    const { id } = req.body
    return process(id)
  })
  fastify.post('/convert', async function (req, reply) {
    const { id } = req.body
    return convert(id)
  })
}) // end fp
