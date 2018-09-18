const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const { getPromptModules } = require('./util/createTools')
const { stopSpinner } = require('./util/spinner')
const Creator = require('./Creator')

async function create (projectName, options) {
  const cwd = options.cwd || process.cwd()
  const inCurrent = projectName === '.'
  const name = inCurrent ? path.relative('../', cwd) : projectName
  const targetDir = path.resolve(cwd, projectName || '.')

  if (fs.existsSync(targetDir)) {
    if (inCurrent) {
      const { ok } = await inquirer.prompt([
        {
          name: 'ok',
          type: 'confirm',
          message: `generate project in current directory?`
        }
      ])
      if (!ok) {
        return
      }
    } else {
      // const { action } = await inquirer.prompt([
      //   {
      //     name: 'action',
      //     type: 'list',

      //   }
      // ])
    }
  }

  const creator = new Creator(name, targetDir, getPromptModules())
  await creator.create(options)
}

module.exports = (...args) => {
  return create(...args).catch(err => {
    stopSpinner(false)
  })
}