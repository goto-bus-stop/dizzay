import cp from 'child_process'
import assign from 'object-assign'
import compose from 'lodash.compose'
import curry from 'curry'
import vlcCommand from 'vlc-command'
import Task from 'data.task'

import { getUrl } from './util'

const debug = require('debug')('dizzay:vlc-player')

const qualityPresets = {
  HIGH: '247+172/22'
, MEDIUM: '43/18'
, LOW: '36'
}

const getVlcCommand = () => new Task((reject, resolve) =>
  vlcCommand((err, res) => {
    err ? reject(err) : resolve(res)
  })
)

const getQuality = (presets, quality) => {
  return quality.toUpperCase() in presets? presets[quality.toUpperCase()]
       : /* _ */                           quality
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

  getUrl(media, quality).fork(
    (e) => sendCommand(vlc, 'stop'),
    enqueue(vlc)(startAt)
  )
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
export default function vlcPlayer(mp, { vlcArgs = [], quality = qualityPresets.MEDIUM }) {
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

  return getVlcCommand().fork((err) => {
    console.error('Could not find VLC')
    return err
  }, oncommand)
}
