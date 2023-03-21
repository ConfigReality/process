import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
// Inizializza il client Supabase con le tue credenziali
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Funzione per aggiungere un nuovo task alla coda
async function addToQueue(task, params) {
  const { data: lastTask } = await supabase
    .from('queue')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
  const newTask = {
    task: task,
    params: params,
    completed: false,
  }
  await supabase.from('queue').insert(newTask)
  return lastTask ? lastTask[0].id : 0
}

// Funzione per eseguire un singolo task dalla coda
async function processQueue() {
  // Inizia una transazione per evitare che più processi eseguano lo stesso task
  const { data: task, error: taskError } = await supabase.rpc(
    'lock_task_for_processing'
  )
  if (taskError) {
    console.error(taskError)
    return
  }
  if (!task) {
    console.log('Nessun task disponibile.')
    return
  }

  // Esegui il task
  try {
    await eseguiTask(task.task, task.params)
  } catch (err) {
    console.error(err)
  }

  // Aggiorna lo stato del task nella coda
  const { error: updateError } = await supabase
    .from('queue')
    .update({ completato: true, aggiornato_a: new Date().toISOString() })
    .match({ id: task.id })
  if (updateError) {
    console.error(updateError)
  }

  // Termina la transazione
  const { error: unlockError } = await supabase.rpc(
    'unlock_task_after_processing',
    { id: task.id }
  )
  if (unlockError) {
    console.error(unlockError)
  }

  console.log(`Task ${task.id} completato.`)
}

// Funzione per eseguire un singolo task
async function eseguiTask(task, params) {
  // Implementazione del tuo task
  await new Promise(resolve => setTimeout(resolve, 5000))
}

// Esegui i task nella coda
async function runQueue() {
  while (true) {
    await processQueue()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Aspetta 1 secondo prima di eseguire il prossimo task
  }
}

runQueue() // Avvia l'esecuzione della coda

// add a 5 nre task to the queue
const task1 = await addToQueue('task1', { param1: 'value1' })
const task2 = await addToQueue('task2', { param1: 'value1' })
const task3 = await addToQueue('task3', { param1: 'value1' })
const task4 = await addToQueue('task4', { param1: 'value1' })
const task5 = await addToQueue('task5', { param1: 'value1' })
