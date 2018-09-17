#!/usr/bin/env node

const chalk = require('chalk')

var program = require('commander');

program
  .version(require('../../package').version, '-v --version')
  .usage('<command> [options]')
  .parse(process.argv)

program
  .command('create <app-name>')
  .description('create a new project powered by laz-cli-service')
  .action((name, cmd) => {
    console.log(name, cmd)
    // const options = cleanArgs(cmd)
    // // --no-git makes commander to default git to true
    // if (process.argv.includes('-g') || process.argv.includes('--git')) {
    //   options.forceGit = true
    // }
    // require('../lib/create')(name, options)
  })


program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log('')
  })

program.on('--help', () => {
  console.log('')
  console.log(`  Run ${chalk.cyan(`vue <command> --help`)} for detailed usage of given command.`)
  console.log('')
})

const enhanceErrorMessages = require('../lib/util/enhanceErrorMessages')

enhanceErrorMessages('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return `Missing required argument for option ${chalk.yellow(option.flags)}` + (
    flag ? `, got ${chalk.yellow(flag)}` : ``
  )
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}