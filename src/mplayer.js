const { spawn } = require('child_process')
const { getUrl } = require('./util')
const pluck = require('pluck')
const compose = require('compose-function')

const debug = require('debug')('dizzay:mplayer')

//
// Plays YouTube and SoundCloud audio using mplayer.
//
module.exports = function mplayer(mp, { mplayerArgs = [], mplayer: mplayerCommand = 'mplayer' }) {
  // horrible state
  let _instance
  const play = url => {
    if (_instance) _instance.stop()

    debug('play', `${url}`)
    debug('starting playback')

    // start mplayer after the response starts coming in, so it can detect
    // the type of media file instantly
    let instance = spawn(mplayerCommand,
      [ ...mplayerArgs,   url ],
      { stdio: [ 'pipe', 'ignore', 'ignore' ] })

    instance.stop = () => {
      instance.kill('SIGTERM')
    }
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
