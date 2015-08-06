const Browser = require('browser-window')
const path = require('path')
const app = require('app')

app.once('ready', function () {
  const control = new Browser({
    show: false
  })

  control.loadUrl('file://' + path.join(__dirname, 'index.html'))
  control.maximize()

  setTimeout(function () {
    control.show()
  }, 150)
})
