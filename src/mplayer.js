const { spawn } = require('child_process')
const { getUrl } = require('./util')
const urlparse = require('url').parse
const http = require('http')
const httpProxy = require('http-proxy')
const debug = require('debug')('dizzay:mplayer')

function proxyServer() {
  const proxy = httpProxy.createServer({
    changeOrigin: true,
    hostRewrite: true,
    autoRewrite: true,
    protocolRewrite: true
  })

  proxy.on('proxyRes', (res) => {
    if (res.headers.status && res.headers.status.startsWith('302')) {
      debug('rewriting redirect', res.headers.location)
      res.headers.location =
        `http://localhost:${server.address().port}/${res.headers.location}`
    }
  })

  const server = http.createServer((req, res) => {
    const url = urlparse(req.url.slice(1))
    req.url = url.path
    proxy.web(req, res, { target: `${url.protocol}//${url.host}` })
  }).on('close', proxy.close.bind(proxy))
  return server.listen()
}

//
// Plays YouTube and SoundCloud audio using mplayer.
//
module.exports = function mplayer(mp, { quality, mplayerArgs = [] }) {
  let instance
  let proxy

  const start = (cb) => {
    instance = spawn('mplayer', [ ...mplayerArgs, '-idle', '-slave' ])
    instance.stdout.on('data', function ondata (chunk) {
      if (chunk.toString().includes('MPlayer')) {
        cb(null)
        instance.stdout.removeListener('data', ondata)
      }
    })
    proxy = proxyServer()
    debug('proxy listening on', proxify(''))
  }

  const close = () => {
    if (instance) instance.kill('SIGTERM')
    if (proxy) proxy.close()
  }

  const proxify = (url) => `http://localhost:${proxy.address().port}/${url}`

  const play = (url, startTime = Date.now()) => {
    stop()

    debug('play', url)
    instance.stdin.write(`loadfile ${JSON.stringify(proxify(url))}\n`)
    instance.stdout.on('data', function ondata (chunk) {
      if (chunk.toString().includes('Starting playback')) {
        seek((Date.now() - startTime) / 1000)
        instance.stdout.removeListener('data', ondata)
      }
    })

    function seek(time) {
      debug('seek', time)
      instance.stdin.write(`seek ${Math.floor(time)} 2\n`)
   }
  }

  const stop = () => {
    instance.stdin.write('stop\n')
  }

  const next = (media, startTime) => media && media.cid
    ? getUrl(media, quality, (err, url) => {
        if (err) {
          console.error('mplayer:', err.message);
          return stop();
        }
        play(url, startTime);
      })
    : stop();

  mp.on('advance', (advance) => {
    next(advance && advance.media)
  })
  mp.on('roomState', (state) => {
    start(() => {
      next(state.playback.media, new Date(`${state.playback.startTime} UTC`).getTime())
    })
  })
  mp.on('close', close)
}
