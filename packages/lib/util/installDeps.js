const EventEmitter = require('events')
const execa = require('execa')
const debug = require('debug')('laz-cli:install')

class InstallProgress extends EventEmitter {
  constructor () {
    super()

    this._progress = -1
  }

  get progress () {
    return this._progress
  }

  set progress (value) {
    this._progress = value
    this.emit('progress', value)
  }

  get enabled () {
    return this._progress !== -1
  }

  set enabled (value) {
    this.progress = value ? 0 : -1
  }

  log (value) {
    this.emit('log', value)
  }
}

const progress = exports.progress = new InstallProgress()

function toStartOfLine (stream) {
  if (!chalk.supportsColor) {
    stream.write('\r')
    return
  }
  readline.cursorTo(stream, 0)
}

function renderProgressBar (curr, total) {
  const ratio = Math.min(Math.max(curr / total, 0), 1)
  const bar = ` ${curr}/${total}`
  const availableSpace = Math.max(0, process.stderr.columns - bar.length - 3)
  const width = Math.min(total, availableSpace)
  const completeLength = Math.round(width * ratio)
  const complete = `#`.repeat(completeLength)
  const incomplete = `-`.repeat(width - completeLength)
  toStartOfLine(process.stderr)
  process.stderr.write(`[${complete}${incomplete}]${bar}`)
}

function executeCommand (command, args, targetDir) {
  return new Promise((resolve, reject) => {
    progress.enabled = false

    const child = execa(command, args, {
      cwd: targetDir,
      stdio: ['inherit', 'inherit', command === 'yarn' ? 'pipe' : 'inherit']
    })

    if (command === 'yarn') {
      child.stderr.on('data', buf => {
        const str = buf.toString()
        if (/warning/.test(str)) {
          return
        }

        // progress bar
        const progressBarMatch = str.match(/\[.*\] (\d+)\/(\d+)/)
        if (progressBarMatch) {
          // since yarn is in a child process, it's unable to get the width of
          // the terminal. reimplement the progress bar ourselves!
          renderProgressBar(progressBarMatch[1], progressBarMatch[2])
          return
        }

        process.stderr.write(buf)
      })
    }

    child.on('close', code => {
      if (code !== 0) {
        reject(`command failed: ${command} ${args.join(' ')}`)
        return
      }
      resolve()
    })
  })
}

exports.installDeps = async function installDeps (targetDir, command, cliRegistry) {
  const args = []
  if (command === 'npm') {
    args.push('install', '--loglevel', 'error')
  } else if (command === 'yarn') {
    // do nothing
  } else {
    throw new Error(`Unknown package manager: ${command}`)
  }

  // await addRegistryToArgs(command, args, cliRegistry)

  debug(`command: `, command)
  debug(`args: `, args)

  await executeCommand(command, args, targetDir)
}