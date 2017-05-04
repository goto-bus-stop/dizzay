const cp = require('child_process')
const vlcCommand = require('vlc-command')
const { getUrl } = require('./util')

const debug = require('debug')('dizzay:vlc-player')

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
module.exports = function vlcPlayer(mp, { vlcArgs = [], quality }, cb) {
  let vlc
  const start = (cb) => {
    vlcCommand((err, command) => {
      if (err) return cb(err)
      vlc = cp.spawn(command, [
        '--extraintf', 'rc',
        '--no-repeat',
        ...vlcArgs
      ])
      cb(null)
    })
  }
  const close = () => {
    stop()
    vlc.kill('SIGTERM')
  }

  const stop = () => {
    vlc.stdin.write('stop\n')
  }

  const next = (media, startTime) => {
    stop()
    if (!media) return

    getUrl(media, quality, (err, url) => {
      if (err) {
        console.error('vlc:', err.message)
        return stop()
      }

      const startAt = startTime ? getSecondDiff(parsePlugDate(startTime), Date.now()) : 0
      debug('enqueue', url)
      debug('seek', startAt)
      vlc.stdin.write(`add ${url}\n`)
      vlc.stdin.write(`next\n`)
      if (startAt > 0) vlc.stdin.write(`seek ${startAt}\n`)
    })
  }

  mp.on('advance', (advance) => {
    next(advance && advance.media)
  })

  mp.on('roomState', (state) => {
    start(() => {
      next(state.playback.media, state.playback.startTime)
    })
  })

  mp.on('close', close)
}
