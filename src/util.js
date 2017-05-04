const ytdl = require('ytdl-core')
const jsonist = require('jsonist')
const debug = require('debug')('dizzay:util')

const SC_CLIENT_ID = '8dbdba91e179312af5051f713fc88176'

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

const SC_RESOLVE = 'https://api.soundcloud.com/resolve.json'
function getScUrl(url, cb) {
  jsonist.get(`${SC_RESOLVE}?client_id=${SC_CLIENT_ID}&url=${encodeURIComponent(url)}`, {
    followRedirects: true
  }, (err, data) => {
    if (err) return cb(err)
    cb(null, `${data.stream_url}?client_id=${SC_CLIENT_ID}`)
  })
}

exports.getUrl = function getUrl(media, quality = 'best', cb) {
  const url = media.format === YOUTUBE
    ? `https://youtube.com/watch?v=${media.cid}`
    : `https://api.soundcloud.com/tracks/${media.cid}`

  debug('get-url', url)

  if (media.format === YOUTUBE) {
    getYtUrl(url, {
      audioOnly: quality === 'audio',
      quality: quality
    }, cb)
  } else {
    getScUrl(url, cb)
  }
}

const pad = n => n < 10 ? `0${n}` : n
exports.time = function time() {
  let now = new Date()
  return `${pad(now.getHours() + 1)}:${pad(now.getMinutes() + 1)}`
}
