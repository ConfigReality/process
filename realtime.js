const { createClient } = require('@supabase/supabase-js')
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const BUCKET = process.env.BUCKET;
const supabase = createClient(supabaseUrl, supabaseKey);

const handleRealtime = async (payload) => {
  // 1 Get the new record
  console.log(payload)
  const { new: newRecord } = payload.new;
  // 2 Retrieve image from the supabase bucket
  const { data: _dataProcess, error: _errorProcess } = await supabase
    .from('Process')
    .select('*')
    .eq('id', newRecord.project_id)
    .single()
  console.log(_dataProcess, _errorProcess)
  const { data: _dataProject, error: _errorProject } = await supabase
    .from('Project')
    .select('*')
    .eq('id', newRecord.project_id)
    .single()
  console.log(_dataProject, _errorProject)
  // 3 Download file from the bucket
  const { file_location, files } = _dataProject
  for (let i = 0; i < files.length; i++) {
    const { file_name } = files[i];
    const { data: _dataFiles, error: _errorFiles } = await supabase.storage
      .from(BUCKET)
      .download(file_location + file_name)
    console.log(_dataFiles, _errorFiles)
  }
  // 4 Push in queue
  const { data: _dataQueue, error: _errorQueue } = await supabase
    .from('Queue')
    .insert({ project_id: newRecord.project_id, status: 'Pending' })
  // 5 Delete file from the bucket
  for (let i = 0; i < files.length; i++) {
    const { file_name } = files[i];
    const { data: _dataDelete, error: _errorDelete } = await supabase.storage
      .from(BUCKET)
      .remove([file_location + file_name])
    console.log(_dataDelete, _errorDelete)
  }
}

// SUBSCRIPTION
supabase
  .channel('table-db-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'Process',
    },
    handleRealtime
  )
  .subscribe((status, err) => console.log(status, err))