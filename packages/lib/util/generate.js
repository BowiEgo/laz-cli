const path = require('path')
const async = require('async')
const Metalsmith = require('metalsmith')
const render = require('consolidate').handlebars.render
const getOptions = require('./options')
const ask = require('./ask')

module.exports = function generate (name, src, dest, done) {
  const opts = getOptions(name, src)
  const metalsmith = Metalsmith(path.join(src, 'template'))
  metalsmith.use(askQuestions(opts.prompts))
  metalsmith.use(renderTemplateFiles())

  metalsmith.clean(false)
    .source('.')
    .destination(dest)
    .build((err, files) => {
      done(err)
    })
}

function askQuestions (prompts) {
  return (files, metalsmith, done) => {
    ask(prompts, metalsmith.metadata(), done)
  }
}

function renderTemplateFiles () {
  // skipInterpolation = typeof skipInterpolation === 'string'
  //   ? [skipInterpolation]
  //   : skipInterpolation
  return (files, metalsmith, done) => {
    const keys = Object.keys(files)
    const metalsmithMetadata = metalsmith.metadata()
    // console.log('keys', keys)
    // console.log('metalsmithMetadata', metalsmithMetadata)
    async.each(keys, (file, next) => {
      // skipping files with skipInterpolation option
      // if (skipInterpolation && multimatch([file], skipInterpolation, { dot: true }).length) {
      //   return next()
      // }
      const str = files[file].contents.toString()
      // do not attempt to render files that do not have mustaches
      if (!/{{([^{}]+)}}/g.test(str)) {
        return next()
      }
      render(str, metalsmithMetadata, (err, res) => {
        if (err) {
          err.message = `[${file}] ${err.message}`
          return next(err)
        }
        files[file].contents = new Buffer.from(res)
        next()
      })
    }, done)
  }
}
