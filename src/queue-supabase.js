'use strict'
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const { default: fp } = require('fastify-plugin')

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const taskQueueTable = 'queue'

async function addTaskToQueue(taskData) {
  const newTask = {
    task_data: taskData,
    status: 'waiting',
    timestamp: new Date().toISOString(),
  }

  await supabase.from(taskQueueTable).insert(newTask)
}

async function processQueue() {
  const { data: nextTask } = await supabase
    .from(taskQueueTable)
    .select('*')
    .eq('status', 'waiting')
    .order('id')
    .limit(1)
    .single()

  if (!nextTask) {
    console.log('No more tasks to process')
    return
  }

  console.log(`Processing task ${nextTask.id}...`)

  try {
    // Process the task here
    await new Promise(res =>
      setTimeout(() => {
        res()
      }, 5000)
    )

    // Update the task status to "completed"
    await supabase
      .from(taskQueueTable)
      .update({
        status: 'completed',
        completed_timestamp: new Date().toISOString(),
      })
      .eq('id', nextTask.id)
  } catch (error) {
    console.error(`Error processing task ${nextTask.id}: ${error.message}`)

    // If there was an error, set the task status back to "waiting" and retry later
    await supabase
      .from(taskQueueTable)
      .update({ status: 'waiting' })
      .eq('id', nextTask.id)
  }

  // Call this function recursively to process the next task in the queue
  await processQueue()
}

module.exports = fp(async function (fastify, opts) {
  fastify.decorate('processQueue', processQueue)
  // decorate fastify with a function to add tasks to the queue
  fastify.decorate('addTaskToQueue', addTaskToQueue)
})
// Example usage:
// ;(async () => {
//   await addTaskToQueue({ foo: 'bar' })
//   await addTaskToQueue({ hello: 'world' })
//   await addTaskToQueue({ some: 'data' })

//   await processQueue()
// })()
