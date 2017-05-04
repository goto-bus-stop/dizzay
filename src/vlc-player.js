const cp = require('child_process')
const vlcCommand = require('vlc-command')
const runSeries = require('run-series')
const net = require('net')
const concat = require('concat-stream')
const { getUrl } = require('./util')

const debug = require('debug')('dizzay:vlc-player')

function findPort() {
  const server = net.createServer().listen()
  const { port } = server.address()
  server.close()
  return port
}

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
  let port
  const start = (cb) => {
    vlcCommand((err, command) => {
      if (err) return cb(err)
      port = findPort()
      vlc = cp.spawn(command, [
        '--extraintf', 'rc',
        '--no-repeat',
        '--rc-host', `localhost:${port}`,
        ...vlcArgs
      ])

      function waitForVlc() {
        cmd('info', (err) => {
          if (err) setTimeout(waitForVlc, 100)
          else cb(null)
        })
      }
      waitForVlc()
    })
  }
  const close = () => {
    stop()
    vlc.kill('SIGTERM')
  }

  /**
   * Wait for stream info to be available.
   */
  function getStreamInfo(cb) {
    tryInfo()

    function tryInfo() {
      cmd('info', (err, response) => {
        if (!err && response.toString().includes('--[ Stream')) {
          return cb(null, response.toString().trim())
        }
        if (err) cb(err)
        else setTimeout(tryInfo, 100)
      })
    }
  }

  /**
   * Send a command to vlc using the remote control api.
   * Last arg is a callback that receives an error and the api response text.
   */
  const cmd = (...args) => {
    const cb = args.pop()
    debug('cmd', ...args)
    const sock = net.connect({ host: 'localhost', port }, () => {
      sock.setNoDelay()

      sock.pipe(concat((response) => {
        debug('response', response.toString())
        cb(null, response.toString())
      }))

      sock.end(args.join(' ') + '\r\n')
    })
    sock.on('error', cb)
  }

  const stop = () => {
    cmd('stop', () => {})
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
      runSeries([
        cb => cmd('clear', cb),
        cb => cmd('add', url, cb),
        cb => cmd('next', cb),
        getStreamInfo
      ], () => {
        debug('seek', startAt)
        if (startAt > 0) cmd('seek', startAt, () => {})
      })
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
