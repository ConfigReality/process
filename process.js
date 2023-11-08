const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process')
require('dotenv').config();

const queue = require('fastq')(worker, 1)

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dir = __dirname
const libDir = `${dir}/src/lib`

const processor = ({ imgDir, outDir, filename, detail = 'medium', order = 'unordered', feature = 'normal' }) =>
  new Promise((res, rej) => exec(
    `cd ${libDir} && ./HelloPhotogrammetry ${imgDir} ${outDir}/${filename}.usdz -d ${detail} -o ${order} -f ${feature}`,
    error => {
      if (error) {
        console.error(`exec error: ${error}`)
        rej(error)
        return
      }
      res('ok')
    })
  )

async function worker ({ file_location, detail, ordering, feature }) {
  console.log('worker')
  try { await processor({ imgDir: file_location, outDir: file_location, filename: 'test', detail, order: ordering, feature }) }
  catch (error) { console.log(error) }
}

const handleRealtime = async (payload) => {
  // 1 Get the new record
  console.log(payload)
  const { new: newRecord } = payload.new;
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
  queue.push({ file_location, detail, ordering, feature })
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
  .subscribe((status, err) => console.log(status, err))