const chalk = require('chalk')
const { ROLE } = require('miniplug')
const { time } = require('./util')

module.exports = function chatLog(mp) {
  mp.on('chat', (message) => {
    message.getUser().then((user) => {
      let username = user.username
      if (user.hasGlobalPermission(ROLE.AMBASSADOR)) {
        username = chalk.green(username)
      } else if (user.hasPermission(ROLE.DJ)) {
        username = chalk.magenta(username)
      }

      console.log(`[${time()}] <${username}> ${message.message}`);
    })
  })
}
