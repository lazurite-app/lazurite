const Browser = require('browser-window')
const app = require('app')
const ipc = require('ipc')

console.log('HELLO WORLD')

app.once('ready', function () {
  const control = new Browser({ show: false })
  const display = new Browser({ show: false })

  control.loadUrl('file://' + require.resolve('./index.html'))
  control.maximize()

  setTimeout(function () {
    control.show()
  }, 150)

  ipc.on('app-main-open-preview', function () {
    display.loadUrl('file://' + require.resolve('./display.html'))
    display.show()
  })
})
