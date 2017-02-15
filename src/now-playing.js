import { time } from './util'
import pluck from 'pluck'
import compose from 'lodash.compose'

export default function nowPlaying(mp) {
  const title = media => media && media.cid? `${media.author} - ${media.title}`
                       : /* otherwise */     `Nothing`
  const printAdvance = media => console.log(`[${time()}] Now Playing: ${title(media)}`)

  mp.on('advance',  compose(printAdvance, pluck('media')))
  mp.on('roomState', compose(printAdvance, pluck('playback.media')))
}
