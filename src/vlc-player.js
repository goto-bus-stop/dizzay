const cp = require('child_process')
const assign = require('object-assign')
const curry = require('curry')
const vlcCommand = require('vlc-command')
const { getUrl } = require('./util')

const debug = require('debug')('dizzay:vlc-player')

const qualityPresets = {
  HIGH: '247+172/22'
, MEDIUM: '43/18'
, LOW: '36'
}

const getQuality = (presets, quality) => {
  return quality.toUpperCase() in presets
    ? presets[quality.toUpperCase()]
    : quality
}

const sendCommand = curry((vlc, command) => vlc.stdin.write(`${command}\n`))
const enqueue = curry((vlc, startAt, url) => {
  debug('enqueue', url)
  debug('seek', startAt)
  const command = sendCommand(vlc)
  command(`add ${url}`)
  command(`next`)
  startAt > 0 && command(`seek ${startAt}`)
})

const playMedia = curry((vlc, quality, startAt, media) => {
  debug('playing', media)
  if (!media) return sendCommand(vlc, 'stop')

  getUrl(media, quality, (err) => {
    if (err) {
      sendCommand(vlc, 'stop')
    } else {
      enqueue(vlc)(startAt)
    }
  })
})

const parsePlugDate = (str) => new Date(`${str} UTC`)

const getSecondDiff = (start, end) => Math.round((end - start) / 1000)

//
// Plays YouTube videos and SoundCloud tracks in VLC.
//
// options.vlcParams takes an array of command line parameters for the vlc
// process.
// options.quality takes a quality string for youtube-dl. It is only used
// for YouTube videos, not for SoundCloud tracks.
//
// Returns a control object with a `play` method that takes a plug.dj media
// object with .format and .cid properties and starts playback of a new video,
// a `stop` method that stops playback and closes VLC, and a `vlc` property
// referencing the VLC child process.
//
module.exports = function vlcPlayer(mp, { vlcArgs = [], quality = qualityPresets.MEDIUM }, cb) {
  const oncommand = (command) => {
    const vlc = cp.spawn(command, [ '--extraintf', 'rc', '--no-repeat', ...vlcArgs ])

    const play = playMedia(vlc, getQuality(qualityPresets, quality))
    const stop = () => vlc.kill('SIGTERM')

    mp.on('advance', (next) => play(0)(next.media))
    mp.on('roomState', (state) => play(
      getSecondDiff(parsePlugDate(state.playback.startTime), Date.now())
    )(state.playback.media))

    return {
      play: play(0),
      stop,
      vlc
    }
  }

  return vlcCommand((err, command) => {
    if (err) {
      console.error('Could not find VLC')
      return cb(err);
    }
    oncommand(command, cb);
  });
}
