const { spawn } = require('child_process')
const { getUrl } = require('./util')
const pluck = require('pluck')
const request = require('request')
const compose = require('compose-function')

const debug = require('debug')('dizzay:mplayer')

//
// Plays YouTube and SoundCloud audio using mplayer.
//
module.exports = function mplayer(mp, { mplayerArgs = [] }) {
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
        req.on('end', () => {
          instance.kill('SIGTERM')
        })
      }

      _instance = instance
    })
  }

  const next = media => media && media.cid
    ? getUrl(media, 'bestaudio', (err, url) => {
        if (err) throw err;
        play(url);
      })
    : _instance && _instance.stop();

  mp.on('advance', compose(next, pluck('media')))
  mp.on('roomState', compose(next, pluck('playback.media')))
}
