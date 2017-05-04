const { time } = require('./util')

module.exports = function nowPlaying(mp) {
  const title = media => media && media.cid? `${media.author} - ${media.title}`
                       : /* otherwise */     `Nothing`
  const printAdvance = media => console.log(`[${time()}] Now Playing: ${title(media)}`)

  mp.on('advance', (advance) => {
    printAdvance(advance && advance.media)
  })
  mp.on('roomState', (state) => {
    printAdvance(state.playback.media)
  })
}
