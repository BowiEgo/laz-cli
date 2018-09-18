const chalk = require('chalk')
const inquirer = require('inquirer')
const writeFileTree = require('./util/writeFileTree')
const { hasYarn } = require('./util/env')
const { logWithSpinner, stopSpinner } = require('./util/spinner')
const { installDeps } = require('./util/installDeps')
const { log } = require('./util/logger')

module.exports = class Creator {
  constructor (name, context, promptModules) {
    // super()

    this.name = name
    this.context = context
  }

  async create (cliOptions = {}, preset = null) {
    const { name, context } = this

    if (!preset) {
      preset = await this.promptAndResolvePreset()
    }

    const packageManager = (
      hasYarn() ? 'yarn' : 'npm'
    )

    logWithSpinner(`✨`, `Creating project in ${chalk.yellow(context)}.`)

    const pkg = {
      name,
      version: '0.1.0',
      private: true,
      devDependencies: {}
    }

    // write package.json
    await writeFileTree(context, {
      'package.json': JSON.stringify(pkg, null, 2)
    })
    
    stopSpinner()
    log(`⚙  Installing CLI plugins. This might take a while...`)
    log()
    await installDeps(context, packageManager, cliOptions.registry)
    
    log()
    log(`🎉  Successfully created project ${chalk.yellow(name)}.`)
    log(
      `👉  Get started with the following commands:\n\n` +
      (this.context === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${name}\n`)) +
      chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn serve' : 'npm run serve'}`)
    )
    log()
  }

  async promptAndResolvePreset () {
    // prompt
    if (!answers) {
      await clearConsole(true)
      answers = await inquirer.prompt(this.resolveFinalPrompts())
    }

    let preset

    // manual
    preset = {
      useConfigFiles: answers.useConfigFiles === 'files',
      plugins: {}
    }
  }

  resolveFinalPrompts () {
    // patch generator-injected prompts to only show in manual mode
    this.injectedPrompts.forEach(prompt => {
      const originalWhen = prompt.when || (() => true)
      prompt.when = answers => {
        return isManualMode(answers) && originalWhen(answers)
      }
    })
    const prompts = [
      this.presetPrompt,
      this.featurePrompt,
      ...this.injectedPrompts,
      ...this.outroPrompts
    ]
    // debug('vue-cli:prompts')(prompts)
    return prompts
  }
}