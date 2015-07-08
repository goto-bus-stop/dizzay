import { time } from './util'
import pluck from 'pluck'
import compose from 'lodash.compose'

export default function nowPlaying(plug) {

  const title = media => media && media.cid? `${media.author} - ${media.title}`
                       : /* otherwise */     `Nothing`
  const next = media => console.log(`[${time()}] Now Playing: ${title(media)}`)

  plug.on('advance',   compose(next, pluck('m')))
  plug.on('roomState', compose(next, pluck('playback.media')))

}
