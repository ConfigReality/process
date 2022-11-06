'use strict'
const { v4: uuidv4 } = require('uuid')
const { default: fp } = require('fastify-plugin')
const dir = __dirname.substring(0, __dirname.lastIndexOf('/'))
const tmpDir = `${dir}/tmp`
const libDir = `${dir}/src/lib`
// Exec generate command
const process = id => {
  const uuid = uuidv4()
  const { exec } = require('child_process')
  exec(
    `cd ${libDir} && ./HelloPhotogrammetry ${tmpDir}/${id}/images/ ${tmpDir}/${id}/models/${id}.usdz`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      // convert usdz to obj and mtl
      // convert(id)
      // se l'esecuzione va a buon fine
      // cancellare le immagini
      // e restituire il modello
      console.log(`stdout: ${stdout}`)
      console.error(`stderr: ${stderr}`)
    }
  )
  return { id, uuid }
}

const convert = id => {
  const { exec } = require('child_process')
  exec(
    `cd ${libDir} && ./usdconv ${tmpDir}/${id}/models/${id}.usdz`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      console.log(`stdout: ${stdout}`)
      console.error(`stderr: ${stderr}`)
    }
  )
  return { id }
}

module.exports = {
  process,
  convert,
}
