const Browser = require('browser-window')
const signalhub = require('signalhub/server')
const querystring = require('querystring')
const app = require('app')
const ipc = require('ipc')

app.once('ready', appReady)

function appReady () {
  signalhub({
    maxBroadcasts: 100
  }).on('subscribe', function (channel) {
    console.log('subscribe: %s', channel)
  }).on('broadcast', function (channel, message) {
    console.log('broadcast: %s (%d)', channel, message.length)
  }).listen(function (err) {
    if (err) throw err
    hubReady(this.address().port)
  })
}

function hubReady (hubPort) {
  const control = new Browser({ show: false })
  const display = new Browser({ show: false })
  const qs = '?' + querystring.stringify({
    hub: hubPort
  })

  control.loadUrl('file://' + require.resolve('./index.html') + qs)
  control.maximize()

  setTimeout(function () {
    control.show()
  }, 150)

  ipc.on('app-main-open-preview', function () {
    display.loadUrl('file://' + require.resolve('./display.html') + qs)
    display.show()
  })
}
