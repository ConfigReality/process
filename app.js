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
    fastify.processQueue()
    return { hello: 'world' }
  })

  // register queue to execute every time a file is uploaded
  fastify.register(require('./src/queue-supabase'))
  // register routes
  fastify.register(require('./src/routes'))
}
