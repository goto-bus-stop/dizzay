import { execSync as exec, spawn } from 'child_process'
import { getUrl } from './util'
import pluck from 'pluck'
import request from 'request'
import compose from 'lodash.compose'

const debug = require('debug')('dizzay:mplayer')

const die = e => { throw e }

//
// Plays YouTube and SoundCloud audio using mplayer.
//
export default function mplayer(plug, { mplayerArgs = [] }) {
  // horrible state
  let _instance
  const play = url => {
    if (_instance) _instance.stop()

    debug('play', `${url}`)

    let req = request(url).on('response', () => {
      debug('starting playback')

      // start mplayer after the response starts coming in, so it can detect
      // the type of media file instantly
      let instance = spawn('mplayer', [ ...mplayerArgs, '-' ], { stdio: [ 'pipe', 'ignore', 'ignore' ] })
      req.pipe(instance.stdin)

      instance.stop = () => {
        // kill mplayer _after_ the request is aborted, to prevent write-after-
        // close on mplayer's stdin
        req.abort()
        req.on('end', () => { instance.kill('SIGTERM') })
      }

      _instance = instance
    })
  }

  const next = media => media && media.cid? getUrl(media, 'bestaudio').fork(e => { throw e }, play)
                      : /* otherwise */     _instance && _instance.stop()

  plug.on('advance',   compose(next, pluck('m')))
  plug.on('roomState', compose(next, pluck('playback.media')))
}
