'use strict'
const { v4: uuidv4 } = require('uuid')
const { exec } = require('child_process')
const { updateProcessing, createProcessing } = require('./persist')
const dir = __dirname.substring(0, __dirname.lastIndexOf('/'))
const tmpDir = `${dir}/tmp`
const libDir = `${dir}/src/lib`

const process = (id, files) => {
  createProcessing(
    id,
    files.length,
    files.map(_ => _.filename)
  ).then(a => {
    const tableId = a.id
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
        convert(id, tableId)
      }
    )
  })
}

const convert = (id, tableId) => {
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
    updateProcessing(tmpDir, id, tableId)
    console.timeEnd('convert')
    console.log('CONVERTED')
  })
  return { id }
}

module.exports = {
  process,
  convert,
}
