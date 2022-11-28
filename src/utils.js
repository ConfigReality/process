const { readdir, stat, readFile } = require('fs/promises')
const path = require('path')

const walkSync = async (currentDirPath, callback) => {
  readdir(currentDirPath).then(files => {
    files.forEach(function (name) {
      var filePath = path.join(currentDirPath, name)
      stat(filePath).then(_stat => {
        if (_stat.isFile()) {
          callback(filePath, _stat)
        } else if (_stat.isDirectory()) {
          walkSync(filePath, callback)
        }
      })
    })
  })
}

// function to return a list of files in a directory recursively in a synchronous fashion
const generate = async function (dir) {
  const files = await readdir(dir)
  // return files.map(async file => {
  for await (const file of files) {
    // check if file is directory then recursively call generate
    const _stat = await stat(path.join(dir, file))
    if (_stat.isDirectory()) {
      return generate(path.join(dir, file))
    }
    return readFile(path.join(dir, file))
  }
}

module.exports = {
  walkSync,
  generate, // unused
}
