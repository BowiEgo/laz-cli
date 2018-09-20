const fs = require('fs-extra')
const exists = fs.existsSync
const path = require('path')
const chalk = require('chalk')
const download = require('download-git-repo')
const inquirer = require('inquirer')
const home = require('os-homedir')()
const writeFileTree = require('./util/writeFileTree')
const generate = require('./util/generate')
const { hasYarn } = require('./util/env')
const { logWithSpinner, stopSpinner } = require('./util/spinner')
const { isLocalPath, getTemplatePath} = require('./util/local-path')
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
    this.localTemplate = null
  }

  async create (cliOptions = {}, preset = null) {
    this.cliOptions = cliOptions
    const { name, context } = this

    // logWithSpinner(`✨`, `Creating project in ${chalk.yellow(context)}.`)

    if (!preset) {
      preset = await this.promptAndResolvePreset()
      this.type = preset.type
    }

    const template = this.resolveTemplate()

    if (isLocalPath(template)) {
      if (exists(template)) {
        logWithSpinner(`⚙  Generate local template...`)
        await this.generateTemplate(template)
      } else {
        error(`Local template not found.`)
        return
      }
    } else {
      console.log('isExists', exists(this.localTemplate))
      if (exists(this.localTemplate)) {
        await fs.remove(this.localTemplate)
      }
      await this.downloadAndGenerate(template)
    }

    
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
   * Download and generate from a template repo.
   */
  downloadAndGenerate (template) {
    return new Promise ((resolve, reject) => {
      const to = this.context

      logWithSpinner(`⚙  Downloading template. This might take a while...`)
      log()
      
      download(template, this.localTemplate, err => {
        stopSpinner()
        if (err) {
          error(err)
          reject()
        }
        done('Template download is complete')
        this.generateTemplate()
      })
    })
  }

  resolveTemplate () {
    let tmpFolderName = this.type.replace(' ', '-')
    this.localTemplate = path.join(home, '.laz-templates', tmpFolderName)
    if (this.cliOptions.offline) {
      return this.localTemplate
    }

    const gitRepo = `bowiego/laz-templates`
    const gitBranch = tmpFolderName
    return `${gitRepo}#${gitBranch}`
  }

  async promptAndResolvePreset (answers = null) {
    if (!answers) {
      answers = await inquirer.prompt(this.resolveFinalPrompts())
    }
    return answers
  }

  generateTemplate () {
    stopSpinner()
    return new Promise ((resolve, reject) => {
      generate(this.name, this.localTemplate, this.context, err => {
        if (err) {
          error(err)
          reject()
        }
        log(`Project ${this.name} generate successed`)
        resolve()
      })
    })
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