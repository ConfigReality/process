'use strict'

module.exports = async function (fastify, opts) {
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
