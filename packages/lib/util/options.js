const metaData = require('read-metadata')
const path = require('path')
const exists = require('fs').existsSync

module.exports = function options (name, dir) {
  const opts = getMetaData(dir)
  return opts
}

function getMetaData (dir) {
  const json = path.join(dir, 'package.json')
  const js = path.join(dir, 'meta.js')

  let opts = {}
  if (exists(json)) {
    opts = metaData.sync(json)
  } else if (exists(js)){
    const req = require(path.resolve(js))
    if (req !== Object(req)) {
      throw new Error('meta.js needs to expose an object')
    }
    opts = req
  }

  return opts
}

