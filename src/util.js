const { exec } = require('child_process')
const Task = require('data.task')

const debug = require('debug')('dizzay:util')

// media source IDs
const YOUTUBE    = 1
const SOUNDCLOUD = 2

exports.getUrl = (media, quality = 'best') => new Task((reject, resolve) => {
  const url = media.format === YOUTUBE? `https://youtube.com/watch?v=${media.cid}`
            : /* format = SOUNDCLOUD */ `https://api.soundcloud.com/tracks/${media.cid}`

  const params = (media.format === YOUTUBE? [ '-f', quality ]
               :  /* format = SOUNDCLOUD */ []               ).join(' ')

  debug('get-url', url)

  exec(`youtube-dl --get-url ${params} ${url}`, (err, stdout, stderr) => {
    debug('get-url result', `${stdout}`)
    if (err) reject(err)
    else     resolve(`${stdout}`)
  })
})

const pad = n => n < 10 ? `0${n}` : n
exports.time = () => {
  let now = new Date()
  return `${pad(now.getHours() + 1)}:${pad(now.getMinutes() + 1)}`
}
