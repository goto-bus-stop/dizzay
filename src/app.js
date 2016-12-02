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
  .option('--mplayer-args <args>',
          'string of space-separated command-line arguments to pass to mplayer.',
          args => args.split(' '))
  .option('--vlc-args <args>',
          'string of space-separated command-line arguments to pass to vlc.',
          args => args.split(' '))
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

  const promise = args.user ? login.user(args.user, args.password, { authToken: true }) :
    login.guest({ authToken: true })

  promise.then((result) => {
    const plug = socket(result.token)
    const jar = request.jar()
    jar.setCookie(result.cookie, 'https://plug.dj/')
    plug.request = request.defaults({
      baseUrl: 'https://plug.dj/_/'
    , jar: jar
    , json: true
    })

    plug.once('ack', () => {
      debug('connected')
      args.modules.split(',').forEach(m => {
        debug('load module', m)
        require(`./${m}`)(plug, args)
      })
      plug.request.post('/rooms/join', { body: { slug: args.room } }, (e, _, body) => {
        if (e) throw e
        debug('joined', args.room)
        plug.request('/rooms/state', (e, _, body) => {
          if (e) throw e
          plug.emit('roomState', body.data[0])
        })
      })
    })
  }).catch((err) => {
    console.error('Could not connect to plug.dj:')
    console.error(err.stack)
    process.exit(1)
  })
}

function missingArgument(arg) {
  console.error(`Error: missing required argument \`${arg}'`)
  program.outputHelp()
  process.exit(1)
}
