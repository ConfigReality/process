const { promises } = require('fs')
const { supabase, BUCKET } = require('./supabaseClient');

const handleRealtime = async (payload) => {
  // 1 Get the new record
  console.log(payload)
  const { new: _newProcess } = payload;
  // 2 Retrieve image from the supabase bucket
  const { data: _dataProject, error: _errorProject } = await supabase
    .from('Project')
    .select('*')
    .eq('id', _newProcess.project_id)
    .single()
  console.log('project', _dataProject, _errorProject)
  // 3 Download file from the bucket
  const { file_location, files } = _dataProject
  // 3.1 Create folder
  try {
    await promises.mkdir(file_location, { recursive: true })
    for (let i = 0; i < files.length; i++) {
      const { file_name } = files[i];
      const { data: _dataFiles, error: _errorFiles } = await supabase.storage
        .from(BUCKET)
        .download(file_location + file_name)
      console.log('download', _dataFiles, _errorFiles)

      const blob = _dataFiles;
      const buffer = Buffer.from(await blob.arrayBuffer());
      await promises.writeFile(file_location + file_name, buffer);
    }
  } catch (error) {
    console.log(error)
  }
  // 4 Push in queue
  const { data: _dataQueue, error: _errorQueue } = await supabase
    .from('Queue')
    .insert({ project_id: _newProcess.project_id, process_id: _newProcess.id, status: 'Pending' })
  console.log('queue', _dataQueue, _errorQueue)
  // 5 Delete file from the bucket
  for (let i = 0; i < files.length; i++) {
    const { file_name } = files[i];
    const { data: _dataDelete, error: _errorDelete } = await supabase.storage
      .from(BUCKET)
      .remove([file_location + file_name])
    console.log('delete', _dataDelete, _errorDelete)
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
  .subscribe((status, err) => console.log('[realtime.js] PROCESS--> ' + status, err))