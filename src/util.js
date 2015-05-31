import { exec } from 'child_process'
import Task from 'data.task'

const debug = require('debug')('dizzay:util')

// media source IDs
const YOUTUBE    = 1
const SOUNDCLOUD = 2

export const getUrl = (media, quality = 'best') => new Task((reject, resolve) => {
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

