import cp from 'child_process'
import assign from 'object-assign'
import compose from 'lodash.compose'

const debug = require('debug')('dizzay:vlc-player')

const qualityPresets = {
  HIGH: '247+172/22',
  MEDIUM: '43/18',
  LOW: '36'
}

// Plays YouTube videos and SoundCloud tracks in VLC.
export default function VLCPlayer(plug, options = {}) {
  if (!(this instanceof VLCPlayer)) return new VLCPlayer(plug, options)
  this.vlc = null
  this.plug = plug
  this.quality = qualityPresets.MEDIUM
  // VLC command line parameters.
  this.parameters = [ '--no-repeat' ]

  plug.on(plug.ADVANCE, compose(this.play.bind(this),
                                plug.getCurrentMedia.bind(plug)))
  plug.on(plug.JOINED_ROOM, () => {
    const media = plug.getCurrentMedia()
    if (media) {
      // TODO pass proper current time
      this.play(media, 0)
    }
  })

  if (options.quality) {
    let q = options.quality.toUpperCase()
    this.quality = q in qualityPresets ? qualityPresets[q] : options.quality
  }
}

assign(VLCPlayer.prototype, {

  // Plays a song in VLC.
  // Starts VLC if it's not yet running.
  play(media, startAt = 0) {

    if (!media) {
      if (this.vlc) this.stop()
      return
    }

    if (!this.vlc) {
      this.vlc = cp.spawn('vlc',
                          [ '--extraintf', 'rc', ...this.parameters ],
                          { stdio: 'pipe' })
    }

    // full URL so youtube-dl knows where to get the goods
    let url = media.format === 1
            ? `https://youtube.com/watch?v=${media.cid}`
            : `https://api.soundcloud.com/tracks/${media.cid}`

    debug('start dl', url)
    let ytParams = media.format === 1
                 ? [ '-f', this.quality ]
                 : []
    let dl = cp.spawn('youtube-dl',
                      [ '--get-url', ...ytParams, url ],
                      { stdio: 'pipe' })
    dl.stdout.on('readable', () => {
      const val = dl.stdout.read()
      if (val !== null) {
        this.command('add', val + '')
        this.command('next')
        if (startAt > 0) {
          this.seek(startAt)
        }
      }
    })
  },

  seek(startAt) {
    this.command('seek', startAt)
  },

  stop() {
    this.command('stop')
  },

  command(command, ...args) {
    debug('command', command, args.join(' '))
    this.vlc.stdin.write(`${command} ${args.join(' ')}\n`)
  }
})