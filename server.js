'use strict'

module.exports = async function (fastify, opts) {
  // variabili d'ambiente
  // await fastify.register(require('@fastify/env'), {
  //   data: opts.envData,
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       PORT: { type: 'integer', default: 3000 },
  //       NODE_ENV: { type: 'string' },
  //       MONGODB_URI: { type: 'string' },
  //     },
  //   },
  // })

  // multipart - opts --> https://github.com/fastify/busboy#busboy-methods
  await fastify.register(require('@fastify/multipart'), {
    MimeTypeArray: ['image/tiff', 'image/heic', 'text/plain'],
  })
  // cors
  await fastify.register(require('@fastify/cors'), {
    origin: '*',
    methods: ['GET', 'POST'],
  })

  fastify.get('/', async () => {
    return { hello: 'world' }
  })

  fastify.register(require('./src/routes'))
}
