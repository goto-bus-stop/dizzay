const { time } = require('./util')
const pluck = require('pluck')
const compose = require('compose-function')

module.exports = function nowPlaying(mp) {
  const title = media => media && media.cid? `${media.author} - ${media.title}`
                       : /* otherwise */     `Nothing`
  const printAdvance = media => console.log(`[${time()}] Now Playing: ${title(media)}`)

  mp.on('advance',  compose(printAdvance, pluck('media')))
  mp.on('roomState', compose(printAdvance, pluck('playback.media')))
}
