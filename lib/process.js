const { exec } = require('child_process')
const path = require('path')
const { supabase } = require('./supabaseClient')
// const queue = require('fastq')(worker, 1)
const fastq = require('fastq')
const { promises } = require('fs')
const queue = fastq.promise(worker, 1)

const dir = __dirname
const libDir = path.join(dir, '..', 'src', 'lib')
// const libDir = `${dir}/src/lib`
// processor
const processor = async ({ imgDir, outDir, filename, detail = 'medium', order = 'unordered', feature = 'normal' }) => {
  console.log('processor')
  const _outDir = path.join(__dirname, '..', outDir)
  const _imgDir = path.join(__dirname, '..', imgDir)
  return new Promise((res, rej) => exec(
    `cd ${libDir} && ./HelloPhotogrammetry ${_imgDir} ${_outDir}${filename}.usdz -d ${detail} -o ${order} -f ${feature}`,
    error => {
      if (error) {
        rej(error)
        return
      }
      res('ok')
    }))
}
const convert = async ({ file_location }) => {
  console.log('convert')
  return new Promise((res, rej) => exec(
    `cd ${libDir} && ./usdconv ${file_location}models/model.usdz`,
    error => {
      if (error) {
        rej(error)
        return
      }
      res('ok')
    }))
}

// main worker function
async function worker ({ file_location, detail, ordering, feature, project_id, process_id }) {
  console.log('worker')
  try {
    // aggiornare lo stato del processo
    await supabase
      .from('Process')
      .update({ status: 'processing' })
      .eq('id', process_id)

    // process
    await processor({ imgDir: file_location + 'images/', outDir: file_location + 'models/', filename: 'model', detail, order: ordering, feature })
    await supabase.storage
      .from('models')
      .upload(file_location + 'models/model.usdz', 'model.usdz')

    // convert
    await convert({ file_location })

    // salvare il i modelli e i relativi file
    await supabase.storage
      .from(BUCKET)
      .upload(file_location + 'models/model.obj', 'model.obj')

    // cancellare le foto dalla cartella locale
    await promises.rmdir(file_location + 'images/', { recursive: true })
    // aggiornare lo stato del processo
    await supabase
      .from('Process')
      .update({ status: 'done' })
      .eq('id', process_id)

  } catch (error) { console.log(error) }
}

const handleRealtime = async (payload) => {
  // 1 Get the new record
  console.log(payload)
  const { new: newRecord } = payload;
  // 2 Retrieve related data
  const { data: _dataProcess, error: _errorProcess } = await supabase
    .from('Process')
    .select('*')
    .eq('id', newRecord.process_id)
    .single()
  console.log(_dataProcess, _errorProcess)
  const { detail, ordering, feature } = _dataProcess
  const { data: _dataProject, error: _errorProject } = await supabase
    .from('Project')
    .select('*')
    .eq('id', newRecord.project_id)
    .single()
  console.log(_dataProject, _errorProject)
  const { file_location, files } = _dataProject
  // 3 Push in queue (fastq)
  queue.push({ file_location, detail, ordering, feature, files, project_id: newRecord.project_id, process_id: newRecord.id })

}

// SUBSCRIPTION
supabase
  .channel('table-db-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'Queue',
    },
    handleRealtime
  )
  .subscribe((status, err) => console.log('[process.js] QUEUE -->' + status, err))