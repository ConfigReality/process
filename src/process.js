'use strict'

const { exec } = require('child_process')
const { updateProcessing, createProcessing } = require('./persist')
const { Queue } = require('./queue')
const dir = __dirname.substring(0, __dirname.lastIndexOf('/'))
const tmpDir = `${dir}/tmp`
const libDir = `${dir}/src/lib`
console.log('libDir', libDir)
// funzione che inizializza il processo di creazione del modello 3D
const process = ({ id, files, userId }) => {
  _processing(id, files, userId)
}

const _processing = (id, files, userId) => {
  // inserisce nella tabella processing l'id del processo e i file che lo compongono (filename)
  createProcessing({
    id,
    count: files.length,
    files: files.map(_ => _.filename),
    supabase: true,
    userId,
  }).then(a => {
    const tableId = a.id
    // esecuzione del processo di creazione del modello 3D
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
        // console.log(`convert(${id})`)
        console.time('convert')
        // convesione del modello 3D in formato usdz in formato obj e mtl e esportazione mesh
        convert({ id, tableId })
      }
    )
  })
}

const convert = ({ id, tableId }) => {
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
    updateProcessing({ tmpDir, id, tableId, supabase: true })
    console.timeEnd('convert')
    // console.log('CONVERTED')
  })
  return { id }
}

module.exports = {
  process,
}
