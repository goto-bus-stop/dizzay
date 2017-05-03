const { exec } = require('child_process')
const debug = require('debug')('dizzay:util')

// media source IDs
const YOUTUBE    = 1
const SOUNDCLOUD = 2

exports.getUrl = function getUrl(media, quality = 'best', cb) {
  const url = media.format === YOUTUBE
    ? `https://youtube.com/watch?v=${media.cid}`
    : `https://api.soundcloud.com/tracks/${media.cid}`

  const params = (media.format === YOUTUBE
    ? [ '-f', quality ]
    : []).join(' ')

  debug('get-url', url)

  exec(`youtube-dl --get-url ${params} ${url}`, (err, stdout, stderr) => {
    debug('get-url result', `${stdout}`)
    if (err) return cb(err)
    cb(null, `${stdout}`)
  })
}

const pad = n => n < 10 ? `0${n}` : n
exports.time = function time() {
  let now = new Date()
  return `${pad(now.getHours() + 1)}:${pad(now.getMinutes() + 1)}`
}
