import Plugged from 'plugged'
import program from 'commander'
import vlcPlayer from './vlc-player'

program
  .description('play music from a plug.dj room in VLC')
  .option('-u, --user <email>',
          'email address of your plug.dj account')
  .option('-p, --password <password>',
          'password of your plug.dj account')
  .option('-r, --room <room>',
          'room slug to join (the room url without https://plug.dj/)')
  .option('-q, --quality [quality]',
          'video quality for YouTube videos. (low|medium|high) [medium]',
          'medium')
  .parse(process.argv)

if (!program.user) missingArgument('--user')
if (!program.password) missingArgument('--password')
if (!program.room) missingArgument('--room')

main(program)

function main(args) {

  const plug = new Plugged()
  plug.invokeLogger(require('debug')('plugged'))

  const onError = e => {
    console.error(e)
    throw e
  }

  plug.on(plug.SOCK_ERROR,  onError)
  plug.on(plug.LOGIN_ERROR, onError)
  plug.on(plug.CONN_ERROR,  onError)

  plug.login({ email: args.user
             , password: args.password })

  plug.once(plug.LOGIN_SUCCESS, () => {
    vlcPlayer(plug, { quality: args.quality })
    plug.connect(args.room)
  })

}

function missingArgument(arg) {
  console.error(`Error: missing required argument \`${arg}'`)
  program.outputHelp()
  process.exit(1)
}