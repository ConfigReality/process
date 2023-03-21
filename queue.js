class ProcessQueue {
  constructor() {
    this.queue = []
    this.busy = false
    this.eventEmitter = new (require('events'))()
    this.eventEmitter.on('jobAdded', this.processQueue.bind(this))
  }

  async processJob(job) {
    console.log(`Processing job ${job.id}...`)
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log(`Job ${job.id} processed.`)
  }

  async processQueue() {
    if (this.busy || this.queue.length === 0) return
    this.busy = true
    const job = this.queue.shift()
    await this.processJob(job)
    this.busy = false
    this.eventEmitter.emit('jobAdded')
  }

  async addJob(job) {
    console.log('Adding job to queue...')
    this.queue.push(job)
    this.eventEmitter.emit('jobAdded')
    console.log('Job added to queue.')
  }
}

module.exports = ProcessQueue

// how to call this class
const queue = new ProcessQueue()

queue.addJob({ id: 1 })
queue.addJob({ id: 2 })
queue.addJob({ id: 3 })
queue.addJob({ id: 4 })
queue.addJob({ id: 5 })
queue.addJob({ id: 6 })
queue.addJob({ id: 7 })
queue.addJob({ id: 8 })
