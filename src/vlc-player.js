import cp from 'child_process'
import assign from 'object-assign'
import compose from 'lodash.compose'
import curry from 'curry'

import { getUrl } from './util'

const debug = require('debug')('dizzay:vlc-player')

const qualityPresets = {
  HIGH: '247+172/22'
, MEDIUM: '43/18'
, LOW: '36'
}

const getQuality = (presets, quality) => {
  return quality.toUpperCase() in presets? presets[quality.toUpperCase()]
       : /* _ */                           quality
}

const sendCommand = vlc => command => vlc.stdin.write(`${command}\n`)
const enqueue = vlc => startAt => url => {
  debug('enqueue', url)
  const command = sendCommand(vlc)
  command(`add ${url}`)
  command(`next`)
  startAt > 0 && command(`seek ${startAt}`)
}

const playMedia = curry(function (vlc, quality, startAt, media) {
  debug('playing', media)
  if (!media) return sendCommand(vlc, 'stop')

  getUrl(media, quality).fork(e => { throw e },
                              enqueue(vlc)(startAt))
})

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
export default function vlcPlayer(plug, { vlcParams = []
                                        , quality = qualityPresets.MEDIUM }) {
  const vlc = cp.spawn('vlc', [ '--extraintf', 'rc', '--no-repeat', ...vlcParams ])

  const play = playMedia(vlc, getQuality(qualityPresets, quality))
  const stop = vlc.kill.bind(vlc, 'SIGTERM')

  plug.on('advance', advance => play(0)(advance.m))
  plug.on('roomState', state => play(0)(state.playback.media))

  return { play: play(0), stop, vlc }
}