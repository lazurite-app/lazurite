const Browser = require('browser-window')
const HubServer = require('signalhub/server')
const signalhub = require('signalhub')
const querystring = require('querystring')
const app = require('app')
const ipc = require('ipc')

app.once('ready', appReady)

function appReady () {
  var hubClient
  var hubServer = HubServer({
    maxBroadcasts: 100
  }).on('subscribe', function (channel) {
    console.log('subscribe: %s', channel)
    hubClient.broadcast('fresh', channel)
  }).on('publish', function (channel, message) {
    console.log('publish: %s (%s)', channel, message)
  }).listen(function (err) {
    if (err) throw err

    const port = this.address().port
    const uri = `http://localhost:${port}`

    hubClient = signalhub('lazurite-client', [ uri ])
    hubReady(port)
  })
}

function hubReady (hubPort) {
  var control = new Browser({ show: false })
  var display
  const qs = '?' + querystring.stringify({
    hub: hubPort
  })

  control.loadUrl('file://' + require.resolve('./index.html') + qs)
  control.maximize()

  setTimeout(function () {
    control.show()
  }, 150)

  ipc.on('app-main-open-preview', function () {
    if (display) {
      display.close()
    }

    var me = display = new Browser({ show: false })
    display.loadUrl('file://' + require.resolve('./display.html') + qs)
    display.show()
    display.once('closed', function () {
      if (display === me) display = null
    })
  })
}
