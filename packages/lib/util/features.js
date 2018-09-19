const chalk = require('chalk')

exports.getFeatures = (preset) => {
  const features = []
  if (preset.router) {
    features.push('vue-router')
  }
  if (preset.vuex) {
    features.push('vuex')
  }
  if (preset.cssPreprocessor) {
    features.push(preset.cssPreprocessor)
  }
  // console.log('features', preset.plugins)
  // const plugins = Object.keys(preset.plugins).filter(dep => {
  //   return dep !== '@vue/cli-service'
  // })
  // features.push.apply(features, plugins)
  console.log('features', features)
  return features
}

exports.formatFeatures = (preset, lead, joiner) => {
  const features = exports.getFeatures(preset)
  return features.map(dep => {
    // dep = toShortPluginId(dep)
    return `${lead || ''}${chalk.yellow(dep)}`
  }).join(joiner || ', ')
}