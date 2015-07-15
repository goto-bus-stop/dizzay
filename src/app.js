import login from 'plug-login'
import socket from 'plug-socket'
import request from 'request'
import program from 'commander'

const debug = require('debug')('dizzay:cli')

const modules = [ 'vlc-player', 'now-playing', 'mplayer' ]

program
  .description('play music from a plug.dj room in VLC')
  .option('-u, --user [email]',
          'email address of your plug.dj account. (optional, for login)')
  .option('-p, --password [password]',
          'password of your plug.dj account. (optional, for login)')
  .option('-r, --room <room>',
          'room url or slug to join.')
  .option('-q, --quality [quality]',
          'video quality for YouTube videos. (low|medium|high) [medium]',
          'medium')
  .option('-m, --modules [modules]',
          'modules to use, comma-separated. [vlc-player]',
          'vlc-player')
  .option('-M, --list-modules',
          'show a list of available modules.')
  .parse(process.argv)

main(program)

function main(args) {

  if (args.listModules) {
    console.log('Available modules:')
    modules.forEach(console.log.bind(console, ' *'))
    return
  }

  if (!args.room) {
    if (args.args.length) args.room = args.args[0]
    else return missingArgument('--room')
  }

  args.room = args.room.replace(/^https:\/\/plug\.dj\//, '')

  const cb = (e, result) => {
    if (e) throw e
    let user = args.user ? result.body.data[0] : {}
    let plug = socket(result.token)
    plug.request = request.defaults({ jar: result.jar, json: true })
    plug.once('ack', () => {
      debug('connected')
      args.modules.split(',').forEach(m => {
        debug('load module', m)
        require(`./${m}`)(plug, args)
      })
      plug.request.post(
        'https://plug.dj/_/rooms/join'
      , { body: { slug: args.room } }
      , (e, _, body) => {
        if (e) throw e
        debug('joined', args.room)
        plug.request(
          'https://plug.dj/_/rooms/state'
        , (e, _, body) => {
          if (e) throw e
          plug.emit('roomState', body.data[0])
        })
      })
    })
  }

  if (args.user) login(args.user, args.password, { authToken: true }, cb)
  else           login.guest({ authToken: true }, cb)

}

function missingArgument(arg) {
  console.error(`Error: missing required argument \`${arg}'`)
  program.outputHelp()
  process.exit(1)
}
