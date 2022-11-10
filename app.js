const fastify = require('fastify')
const app = require('./server')(fastify({ logger: true, port: 3000 }))

if (require.main !== module) {
  // called directly i.e. "node app"
  console.log('asdddd')
  app.listen(3000, err => {
    if (err) console.error(err)
    console.log('server listening on 3000')
  })
} else {
  console.log('asdddd')
  // required as a module => executed on aws lambda
  module.exports = app
}
