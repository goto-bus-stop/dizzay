const { exec } = require('child_process')
const ytdl = require('ytdl-core')
const debug = require('debug')('dizzay:util')

// media source IDs
const YOUTUBE    = 1
const SOUNDCLOUD = 2

function getYtUrl(url, { audioOnly, quality }, cb) {
  ytdl.getInfo(url, (err, info) => {
    if (err) return cb(err)
    const fmt = info.formats.find((format) => {
      if (audioOnly && format.audioBitrate && !format.bitrate) {
        return true
      } else if (!audioOnly && format.audioBitrate && format.bitrate) {
        // TODO care about the video quality
        return true
      }
      return false
    })

    if (fmt) cb(null, fmt.url)
    else cb(new Error('No suitable format found'))
  })
}

exports.getUrl = function getUrl(media, quality = 'best', cb) {
  const url = media.format === YOUTUBE
    ? `https://youtube.com/watch?v=${media.cid}`
    : `https://api.soundcloud.com/tracks/${media.cid}`

  debug('get-url', url)

  if (media.format === YOUTUBE) {
    return getYtUrl(url, {
      audioOnly: quality.includes('audio'),
      quality: quality
    }, cb)
  }

  // TODO use soundcloud API for this one
  exec(`youtube-dl --get-url ${url}`, (err, stdout, stderr) => {
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
