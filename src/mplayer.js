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
module.exports = function mplayer(mp, { mplayerArgs = [], mplayer: mplayerCommand = 'mplayer' }) {
  let instance
  let proxy

  const close = () => {
    if (instance) instance.kill('SIGTERM')
    if (proxy) proxy.close()
  }

  const play = (url, startTime = Date.now()) => {
    close()
    debug('play', `${mplayerCommand} ${mplayerArgs.join(' ')} ${url}`)

    const parts = urlparse(url)
    proxy = proxyServer()
    const listening = `http://localhost:${proxy.address().port}`
    debug('proxy listening on', listening)

    instance = spawn(mplayerCommand,
      [ ...mplayerArgs, '-slave', `${listening}/${url}` ],
      { stdio: ['pipe', 'pipe', 'inherit'] })

    instance.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('Starting playback')) {
        seek((Date.now() - startTime) / 1000)
      }
    })

    function seek(time) {
      debug('seek', time)
      instance.stdin.write(`seek ${Math.floor(time)} 2\n`)
   }
  }

  const next = (media, startTime) => media && media.cid
    ? getUrl(media, 'bestaudio', (err, url) => {
        if (err) throw err;
        play(url, startTime);
      })
    : close();

  mp.on('advance', (advance) => {
    next(advance.media)
  })
  mp.on('roomState', (state) => {
    next(state.playback.media, new Date(`${state.playback.startTime} UTC`).getTime())
  })
}
