const blessed = require('blessed')
const emoji = require('node-emoji')
const { getUrl } = requireDizzay('./util')
const emojify = emoji.emojify.bind(emoji)

const colors = {
  admin: '#42a5dc',
  ambassador: '#89be6c',
  subscriber: '#c59840',
  staff: '#ac76ff',
  you: '#ffdd6f',

  join: '#2ecc40',
  leave: '#ff851b',
  advance: '#7fdbff',
  grab: '#a670fe',
  meh: '#ff4136',
  woot: '#90ad2f'
}

function colorify (mp, user) {
  let color
  if (user.id === mp.me().id) color = colors.you
  else if (user.gRole === 5) color = colors.admin
  else if (user.gRole === 3) color = colors.ambassador
  else if (user.role > 0) color = colors.staff
  else if (user.sub) color = colors.subscriber
  return color ? `{${color}-fg}${user.username}{/${color}-fg}`
       : user.username
}

module.exports = function ui(mp) {
  const screen = blessed.screen({
    title: 'Dizzay',
    warnings: true,
    fastCSR: true
  })

  const chatMessages = blessed.log({
    width: '30%',
    height: '100%-2',
    top: 0,
    right: 0,
    scrollable: true,
    scrollback: 512,
    alwaysScroll: false,
    tags: true,
    mouse: true,
    keys: true,
    style: {
      bg: 'purple',
      fg: 'white'
    }
  })

  const chatBox = blessed.textbox({
    width: '30%',
    height: 1,
    bottom: 0,
    right: 0,
    mouse: true,
    keys: true
  })

  const videoContainer = blessed.box({
    width: '70%',
    height: '100%',
    top: 0,
    left: 0,
    style: { bg: 'black' }
  })
  const videoTitle = blessed.text({
    width: '100%',
    height: 1,
    align: 'center',
    top: 0,
    content: 'Now Playing',
    style: { bg: 'black' }
  })

  videoContainer.append(videoTitle)

  screen.append(chatMessages)
  screen.append(chatBox)
  screen.append(videoContainer)

  chatMessages.focus()

  screen.key([ 'escape', 'q', 'C-c' ], (ch, key) => {
    process.exit(0)
  })
  screen.key([ 'r' ], () => { screen.render() })

  chatBox.on('submit', () => {
    mp.chat(chatBox.value)
  })

  mp.on('roomState', (room) => {
    chatMessages.add(`{${colors.staff}-fg}${emojify(room.meta.welcome)}{/}`)
    screen.render()
  })

  mp.on('chat', (msg) => {
    function render(username, msg) {
      chatMessages.add(`[${username}]  ${emojify(msg.message)}`)
      screen.render()
    }
    if (msg.user && typeof msg.user.role === 'number') {
      render(colorify(mp, msg.user.username), msg)
    } else if (msg.uid) {
      msg.getUser().then(user => {
        render(colorify(mp, user), msg)
      })
    } else {
      render(msg.un, msg)
    }
  })

  mp.on('userJoin', user => {
    chatMessages.add(`{${colors.join}-fg} ⇢ ${colorify(mp, user)} joined the room{/}`)
    screen.render()
  })
  mp.on('userLeave', user => {
    chatMessages.add(`{${colors.leave}-fg} ⇠ ${colorify(mp, user)} left the room{/}`)
    screen.render()
  })

  function play (media) {
    chatMessages.add(`{${colors.advance}-fg}Now Playing: ${media.author} - ${media.title}{/}`)
    videoTitle.setContent(`Now Playing: ${media.author} - ${media.title}`)

    getUrl(media, 'best', (err, url) => {
      if (err) stopVideo()
      else if (url) playVideo(url)
    })

    screen.render()
  }

  let video
  mp.on('login', () => {
    mp.ws.on('advance', adv => play(adv.m))
  })
  mp.on('roomState', state => play(state.playback.media))

  function stopVideo() {
    if (!video) return
    videoContainer.remove(video)
    video.tty && video.tty.destroy()
  }

  function playVideo(url) {
    video = blessed.video({
      parent: videoContainer,
      width: '100%',
      height: '100%-1',
      top: 1,
      left: 0,
      border: 'line',
      file: url,
      start
    })
  }

  screen.render()
}

// Require a module from the `dizzay/lib` folder.
// If `dizzay` can be found up the node_modules tree, try to use that,
// otherwise we assume we're being required by `dizzay/lib/app.js` and
// use `module.parent` to require relative to there.
function requireDizzay (name) {
  try {
    const modulePath = require('path').join('dizzay/lib', name)
    return require(modulePath)
  } catch (err) {
    return module.parent.require(name)
  }
}
