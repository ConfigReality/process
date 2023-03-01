const async = require('async')
const { spawn } = require('child_process')

// Coda dei processi
const queue = async.queue((task, callback) => {
  console.log(`Esecuzione del comando: ${task.command}`)
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
    // Aggiorniamo lo stato del processo nel database
    // pool.query(
    //   "UPDATE queue SET status = 'completed' WHERE id = $1",
    //   [task.id],
    //   (error, result) => {
    //     if (error) console.error(error);
    //     else console.log(`Processo "${task.command}" completato.`);
    //     callback();
    //   }
    // );
    callback()
  })
}, 1) // Impostiamo un limite di 1 processo alla volta

// Funzione per aggiungere un nuovo processo alla coda
const addProcessToQueue = (command, args) => {
  // pool.query(
  //   "INSERT INTO queue (command, args, status) VALUES ($1, $2, $3) RETURNING id",
  //   [command, args, "pending"],
  //   (error, result) => {
  //     if (error) console.error(error);
  //     else {
  //       const id = result.rows[0].id;
  queue.push({ command, args }, error => {
    if (error) console.error(error)
    else console.log(`Processo "${command}" completato.`)
  })
  //     }
  //   }
  // );
}

// Esempio di utilizzo
addProcessToQueue('ls', ['-l', '/'])
addProcessToQueue('echo', ['Hello', 'World'])
// In questo esempio, abbiamo creato una coda utilizzando la funzione async.queue. La coda è stata impostata in modo che possa eseguire un solo processo alla volta, in modo sequenziale.
// Abbiamo quindi creato una funzione addProcessToQueue che aggiunge un nuovo processo alla coda. La funzione prende il comando da eseguire come primo argomento e un array di argomenti come secondo argomento. Questa funzione utilizza il metodo queue.push per aggiungere un nuovo processo alla coda.
// Per gestire gli eventi del processo, abbiamo utilizzato i metodi childProcess.stdout.on, childProcess.stderr.on e childProcess.on. Questi metodi ci consentono di gestire la standard output e error del processo e di sapere quando il processo è terminato.
// Infine, abbiamo eseguito un paio di esempi di utilizzo della funzione addProcessToQueue, passando i comandi ls e echo come esempio. Quando i processi sono completati, la funzione di callback viene chiamata con un eventuale errore e viene mostrato un messaggio a console per notificare che il processo è stato completato.
// In questo modo, quando si aggiunge un nuovo processo alla coda, questo viene eseguito in modo sequenziale, uno dopo l'altro. Se altri processi vengono aggiunti alla coda durante l'esecuzione di un processo, questi vengono cumulati e eseguiti quando il processo corrente è completato.
