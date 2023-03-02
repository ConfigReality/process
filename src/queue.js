const async = require('async')
const { spawn } = require('child_process')

class CommandQueue {
  constructor(concurrency) {
    this.queue = async.queue(this.processTask.bind(this), concurrency)
  }

  addTask(command, args) {
    this.queue.push({ command, args }, error => {
      if (error) console.error(error)
      else console.log(`Processo "${command}" in attesa.`)
    })
  }

  processTask(task, callback) {
    console.log(
      `Esecuzione del comando: ${task.command}, ${task.args.join(' ')}`
    )
    const childProcess = spawn(task.command, task.args)

    // Gestione degli eventi del processo
    childProcess.stdout.on('data', data => {
      console.log(`stdout: ${data}`)
    })

    childProcess.stderr.on('data', data => {
      console.error(`stderr: ${data}`)
    })

    childProcess.on('close', code => {
      console.log(`Il comando è terminato con il codice di uscita ${code}`)
      console.log(`Processo "${task.command}" completato.`)
      callback()
    })
  }
}

// Esempio di utilizzo
// const commandQueue = new CommandQueue(1)

// commandQueue.addTask('ls', ['-l', '/'])
// commandQueue.addTask('echo', ['Hello', 'World'])

// In questo esempio, abbiamo creato una classe CommandQueue con un costruttore che accetta una configurazione del pool di connessioni e una dimensione di concorrenza. Abbiamo quindi definito i metodi addTask e processTask che corrispondono alla funzione addProcessToQueue e al callback della coda, rispettivamente.
// Nel costruttore della classe, abbiamo creato un nuovo pool di connessioni utilizzando la configurazione fornita. Abbiamo anche creato una nuova coda utilizzando il modulo async e la funzione processTask come callback.
// Il metodo addTask è simile alla funzione addProcessToQueue, tranne che utilizziamo this.queue invece di queue per accedere alla coda della classe.
// Il metodo processTask è stato modificato in modo da utilizzare this.pool invece di pool per accedere al pool di connessioni della classe.
// Infine, abbiamo creato un'istanza della classe CommandQueue e abbiamo aggiunto due task alla coda utilizzando il metodo addTask.
module.exports = CommandQueue
