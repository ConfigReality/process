'use strict'
const { v4: uuidv4 } = require('uuid')
const { exec } = require('child_process')
const { updateProcessing } = require('./lib/client')
const dir = __dirname.substring(0, __dirname.lastIndexOf('/'))
const tmpDir = `${dir}/tmp`
const libDir = `${dir}/src/lib`

const process = id => {
  const uuid = uuidv4()
  exec(
    `cd ${libDir} && ./HelloPhotogrammetry ${tmpDir}/${id}/images/ ${tmpDir}/${id}/models/${id}.usdz`,
    error => {
      if (error) {
        console.timeEnd('process')
        console.error(`exec error: ${error}`)
        return
      }
      // convert usdz to obj and mtl
      console.timeEnd('process')
      console.log(`convert(${id})`)
      console.time('convert')
      convert(id)
    }
  )
  return { id, uuid }
}

const convert = id => {
  exec(`cd ${libDir} && ./usdconv ${tmpDir}/${id}/models/${id}.usdz`, error => {
    if (error) {
      console.timeEnd('convert')
      console.error(`exec error: ${error}`)
      return
    }
    exec(`cd ${tmpDir}/${id} && rm -rf images`, error => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
    })
    updateProcessing(tmpDir, id)
    console.timeEnd('convert')
    console.log('CONVERTED')
  })
  return { id }
}

module.exports = {
  process,
  convert,
}
