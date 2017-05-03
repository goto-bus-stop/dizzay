const { spawn } = require('child_process')
const { getUrl } = require('./util')
const pluck = require('pluck')
const compose = require('compose-function')
const urlparse = require('url').parse
const urlformat = require('url').format
const httpProxy = require('http-proxy')
const debug = require('debug')('dizzay:mplayer')

function proxyServer(remote) {
  debug('proxy to', remote)
  const proxy = httpProxy.createServer({
    target: remote,
    changeOrigin: true
  })
  proxy.listen()
  return proxy
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
    proxy = proxyServer(`https://${parts.host}`)
    const listening = Object.assign({}, parts, {
      protocol: 'http:',
      host: `localhost:${proxy._server.address().port}`
    })
    debug('proxy listening on', urlformat(listening))

    instance = spawn(mplayerCommand,
      [ ...mplayerArgs, '-slave', urlformat(listening) ],
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

  mp.on('advance', compose(next, pluck('media')))
  mp.on('roomState', (state) => {
    next(state.playback.media, new Date(`${state.playback.startTime} UTC`).getTime())
  })
}
