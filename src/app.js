import Plugged from 'plugged'
import parseArgs from 'minimist'
import VLCPlayer from './VLCPlayer'

const argv = parseArgs(
  process.argv.slice(2),
  { alias:
    { email:    [ 'u', 'user' ]
    , password: [ 'p', 'pass' ]
    , room:     [ 'r' ] }
  }
)

const plug = new Plugged()
plug.invokeLogger(require('debug')('plugged'))

const onError = e => {
  console.error(e)
  throw e
}

plug.on(plug.SOCK_ERROR,  onError)
plug.on(plug.LOGIN_ERROR, onError)
plug.on(plug.CONN_ERROR,  onError)

plug.login({ email: argv.email
           , password: argv.password })

plug.once(plug.LOGIN_SUCCESS, () => {
  VLCPlayer(plug, { quality: 'medium' })
  plug.connect(argv.room)
})
