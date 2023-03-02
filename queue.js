const async = require('async')
const { spawn } = require('child_process')

// In questo esempio, abbiamo creato una classe CommandQueue con un costruttore che accetta una configurazione del pool di connessioni e una dimensione di concorrenza. Abbiamo quindi definito i metodi addTask e processTask che corrispondono alla funzione addProcessToQueue e al callback della coda, rispettivamente.
// Nel costruttore della classe, abbiamo creato un nuovo pool di connessioni utilizzando la configurazione fornita. Abbiamo anche creato una nuova coda utilizzando il modulo async e la funzione processTask come callback.
// Il metodo addTask è simile alla funzione addProcessToQueue, tranne che utilizziamo this.queue invece di queue per accedere alla coda della classe.
// Il metodo processTask è stato modificato in modo da utilizzare this.pool invece di pool per accedere al pool di connessioni della classe.
// Infine, abbiamo creato un'istanza della classe CommandQueue e abbiamo aggiunto due task alla coda utilizzando il metodo addTask.

class CommandQueue {
  // constructor
  // concurrency: numero di task che possono essere eseguiti in parallelo
  // callback: funzione che viene eseguita quando il task è completato
  constructor(concurrency, callback) {
    this.queue = async.queue(this.processTask.bind(this), concurrency)
    this.callback = callback
  }

  // add task to queue
  addTask(command, args) {
    this.queue.push({ command, args })
  }

  // process task
  processTask(task) {
    const { command, args } = task
    const child = spawn(command, args)
    // manage state of child process
    child.on('error', error => {
      console.error(`child process error: ${error}`)
      this.callback({ error })
    })

    child.stdout.on('data', data => {
      console.log(`stdout: ${data}`)
    })

    child.on('close', code => {
      if (code !== 0) {
        console.error(`child process exited with code ${code}`)
      }
      this.callback('done!')
    })
  }
}

// Esempio di utilizzo
const commandQueue = new CommandQueue(1, a => console.log(a))

commandQueue.addTask('ls', ['-l', '/'])
commandQueue.addTask('ls', ['-l', '/usr'])

module.exports = CommandQueue
