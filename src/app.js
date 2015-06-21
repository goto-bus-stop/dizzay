import login from 'plug-login'
import socket from 'plug-socket'
import request from 'request'
import program from 'commander'
import vlcPlayer from './vlc-player'

const debug = require('debug')('dizzay:cli')

program
  .description('play music from a plug.dj room in VLC')
  .option('-u, --user [email]',
          'email address of your plug.dj account (optional, for login)')
  .option('-p, --password [password]',
          'password of your plug.dj account (optional, for login)')
  .option('-r, --room <room>',
          'room slug to join (the room url without https://plug.dj/)')
  .option('-q, --quality [quality]',
          'video quality for YouTube videos. (low|medium|high) [medium]',
          'medium')
  .parse(process.argv)

if (!program.room) missingArgument('--room')

main(program)

function main(args) {

  const cb = (e, result) => {
    if (e) throw e
    let user = args.user ? result.body.data[0] : {}
    let plug = socket(result.token)
    plug.request = request.defaults({ jar: result.jar, json: true })
    plug.once('ack', () => {
      debug('connected')
      vlcPlayer(plug, { quality: args.quality })
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

    plug.on('advance', data => {
      debug('advance', data)
      let media = data.m
      if (media.cid) {
        debug('Now Playing:', `${media.author} - ${media.title}`)
      }
    })
    plug.on('roomState', state => {
      if (state.playback.media) {
        let media = state.playback.media
        debug('Now Playing:', `${media.author} - ${media.title}`)
      }
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