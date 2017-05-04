const miniplug = require('miniplug')
const program = require('commander')

const debug = require('debug')('dizzay:cli')

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
  .option('-a, --audio-only',
          'do not show videos.')
  .option('--vlc',
          'play songs in vlc.')
  .option('--mplayer',
          'play songs in mplayer.')
  .option('--now-playing',
          'log the current playing song to standard output.')
  .option('--mplayer-args <args>',
          'string of space-separated command-line arguments to pass to mplayer.',
          args => args.split(' '))
  .option('--vlc-args <args>',
          'string of space-separated command-line arguments to pass to vlc.',
          args => args.split(' '))
  .parse(process.argv)

main(program)

function main(args) {
  if (args.vlc === undefined && args.mplayer === undefined) {
    debug('no player argument given, using vlc')
    args.vlc = true
  }

  if (!args.room) {
    if (args.args.length) args.room = args.args[0]
    else return missingArgument('--room')
  }

  if (args.audioOnly) {
    args.quality = 'audio'
  }

  args.room = args.room.replace(/^https:\/\/plug\.dj\//, '')

  const mp = miniplug(args.user ? { email: args.user, password: args.password } : {})
  if (args.vlc) {
    require('./vlc-player')(mp, args)
  }
  if (args.mplayer) {
    require('./mplayer')(mp, args)
  }
  if (args.nowPlaying) {
    require('./now-playing')(mp, args)
  }

  mp.join(args.room).catch((err) => {
    console.error('Could not connect to plug.dj:')
    console.error(err.stack)
    process.exit(1)
  })

  process.on('beforeExit', () => {
    mp.emit('close')
  })
}

function missingArgument(arg) {
  console.error(`Error: missing required argument \`${arg}'`)
  program.outputHelp()
  process.exit(1)
}
