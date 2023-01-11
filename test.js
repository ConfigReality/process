const proxy = (param, obj) =>
  new Proxy(obj, {
    get: function (target, prop) {
      return `${param} ${target[prop]}`
    },
  })
// "-d","medium", // -d specifies the detail
const details = proxy('-d', {
  preview: 'preview',
  reduced: 'reduced',
  medium: 'medium',
  full: 'full',
  raw: 'raw',
})

// "-o","unordered", // -o specifies the sample ordering
const orders = proxy('-o', {
  unordered: 'unordered',
  sequential: 'sequential',
})

// "-f","normal" // -f specifies the feature sensitivity
const features = proxy('-f', {
  normal: 'normal',
  high: 'high',
})

const { exec } = require('child_process')
const dir = __dirname
const libDir = `${dir}/src/lib`
const tmpDir = `${dir}/tmp`
const imgDir = '/Users/salvatorelaspata/3DObject/francesco/'

// create all combination of detail, order, feature
for (const key in details) {
  if (Object.hasOwnProperty.call(details, key)) {
    const i = details[key]
    // order = sequential and feature = normal
    var d = new Date()
    console.log(
      'exec_sequential_normal',
      d.getHours(),
      d.getMinutes(),
      d.getSeconds()
    )
    exec(
      `cd ${libDir} && ./HelloPhotogrammetry ${imgDir}/ ${tmpDir}/test/models/test${`_${
        i.split(' ')[1]
      }_`}${`_${orders.sequential.split(' ')[1]}_`}${`_${
        features.normal.split(' ')[1]
      }`}.usdz ${i} ${orders.sequential} ${features.normal}`,
      error => {
        const d = new Date()
        console.log(
          'exec_sequential_normal',
          d.getHours(),
          d.getMinutes(),
          d.getSeconds()
        )
        if (error) {
          console.error(`exec error: ${error}`)
          return
        }
      }
    )
    // order = unordered and feature = normal
    d = new Date()
    console.log(
      'exec_unordered_normal',
      d.getHours(),
      d.getMinutes(),
      d.getSeconds()
    )
    exec(
      `cd ${libDir} && ./HelloPhotogrammetry ${imgDir}/ ${tmpDir}/test/models/test${`_${
        i.split(' ')[1]
      }_`}${`_${orders.unordered.split(' ')[1]}_`}${`_${
        features.normal.split(' ')[1]
      }`}.usdz ${i} ${orders.unordered} ${features.normal}`,
      error => {
        const d = new Date()
        console.log(
          'exec_unordered_normal',
          d.getHours(),
          d.getMinutes(),
          d.getSeconds()
        )
        if (error) {
          console.error(`exec error: ${error}`)
          return
        }
      }
    )
    // order = sequential and feature = high
    d = new Date()
    console.log(
      'exec_sequential_high',
      d.getHours(),
      d.getMinutes(),
      d.getSeconds()
    )
    exec(
      `cd ${libDir} && ./HelloPhotogrammetry ${imgDir}/ ${tmpDir}/test/models/test${`_${
        i.split(' ')[1]
      }_`}${`_${orders.sequential.split(' ')[1]}_`}${`_${
        features.high.split(' ')[1]
      }`}.usdz ${i} ${orders.sequential} ${features.high}`,
      error => {
        const d = new Date()
        console.log(
          'exec_sequential_high',
          d.getHours(),
          d.getMinutes(),
          d.getSeconds()
        )
        if (error) {
          console.error(`exec error: ${error}`)
          return
        }
      }
    )
    // order = unordered and feature = high
    d = new Date()
    console.log(
      'exec_unordered_high',
      d.getHours(),
      d.getMinutes(),
      d.getSeconds()
    )
    exec(
      `cd ${libDir} && ./HelloPhotogrammetry ${imgDir}/ ${tmpDir}/test/models/test${`_${
        i.split(' ')[1]
      }_`}${`_${orders.unordered.split(' ')[1]}_`}${`_${
        features.high.split(' ')[1]
      }`}.usdz ${i} ${orders.unordered} ${features.high}`,
      error => {
        const d = new Date()
        console.log(
          'exec_unordered_high',
          d.getHours(),
          d.getMinutes(),
          d.getSeconds()
        )
        if (error) {
          console.error(`exec error: ${error}`)
          return
        }
      }
    )
  }
}
