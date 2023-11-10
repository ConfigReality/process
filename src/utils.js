const { readdir, stat, readFile } = require('fs/promises')
const path = require('path')
const mime = require('mime-types')

const walkSync = (currentDirPath, callback) => {
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

const walk = async (currentDirPath, callback) => {
  const ret = []
  const files = await readdir(currentDirPath)
  for await (const file of files) {
    const filepath = path.join(currentDirPath, file)
    const _stat = await stat(filepath)
    const _path = path.extname(file);

    if (_stat.isFile())
      ret.push({
        file: readFile(filepath),
        filename: file,
        contentType: mime.extension(_path),
        path: filepath.substring(currentDirPath.length + 1),
      })
    else if (_stat.isDirectory()) ret.push(...(await walk(filepath, callback)))
  }
  return ret
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
  walk, // unused
}
