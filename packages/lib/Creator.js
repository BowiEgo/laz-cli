const chalk = require('chalk')
const download = require('download-git-repo')
const inquirer = require('inquirer')
const writeFileTree = require('./util/writeFileTree')
const { hasYarn } = require('./util/env')
const { logWithSpinner, stopSpinner } = require('./util/spinner')
const { error, done } = require('./util/logger')
const { installDeps } = require('./util/installDeps')

const {
  defaults
} = require('./options')

const { log } = require('./util/logger')

module.exports = class Creator {
  constructor (name, context) {
    this.name = name
    this.context = context
    this.type = null
    this.typePrompt = this.resolveTypePrompt()
  }

  async create (cliOptions = {}, preset = null) {
    console.log('create')
    const { name, context } = this

    // logWithSpinner(`✨`, `Creating project in ${chalk.yellow(context)}.`)

    if (!preset) {
      preset = await this.promptAndResolvePreset()
      this.type = preset.type
    }
    await this.downloadAndGenerate()
    
    // const pkg = {
    //   name,
    //   version: '0.1.0',
    //   private: true,
    //   devDependencies: {}
    // }

    // // write package.json
    // await writeFileTree(context, {
    //   'package.json': JSON.stringify(pkg, null, 2)
    // })
    
    stopSpinner()
    log()
    log(`🎉  Successfully created project ${chalk.yellow(name)}.`)
    log(this.generateInstructions())
    log()
  }

  /**
   * Download a generate from a template repo.
   *
   * @param {String} template
   */
  downloadAndGenerate () {
    return new Promise ((resolve, reject) => {
      const template = this.resolveTemplate()
      logWithSpinner(`⚙  Downloading template. This might take a while...`)
      log()
      download(template, this.context, err => {
        stopSpinner()
        if (err) {
          error(err)
          reject()
        }
        done('Template download is complete')
        resolve()
      })
    })
  }

  resolveTemplate () {
    const gitRepo = `bowiego/laz-templates`
    const gitBranch = this.type.replace(' ', '-')
    const templatePath = `${gitRepo}#${gitBranch}`
    return templatePath
  }

  async promptAndResolvePreset (answers = null) {
    if (!answers) {
      answers = await inquirer.prompt(this.resolveFinalPrompts())
    }
    return answers
  }

  resolveTypePrompt () {
    const typePrompt = {
      name: 'type',
      type: 'list',
      message: `Please choose your project's type:`,
      choices: [
        {
          name: 'node server',
          value: 'node server'
        },
        {
          name: 'vue',
          value: 'vue'
        }
      ]
    }
    return typePrompt
  }

  resolveFinalPrompts () {
    const prompts = [
      this.typePrompt
    ]
    return prompts
  }

  generateInstructions () {
    const packageManager = (
      hasYarn() ? 'yarn' : 'npm'
    )
    let h = ''
    switch (this.type)
    {
    case 'node server':
      h = 'node app.js'
      break
    case 'vue':
      h = `npm run build`
      break
    }

    return `👉  Get started with the following commands:\n\n`
      + (this.context === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${this.name}\n`))
      + chalk.cyan(` ${chalk.gray('$')} ${packageManager === 'yarn' ? 'yarn' : 'npm install'}\n`)
      + chalk.cyan(` ${chalk.gray('$')} ${h}`)
  }
}