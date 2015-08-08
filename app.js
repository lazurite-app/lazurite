const Browser = require('browser-window')
const app = require('app')

app.once('ready', function () {
  const control = new Browser({
    show: false
  })

  control.loadUrl('file://' + require.resolve('./index.html'))
  control.maximize()

  setTimeout(function () {
    control.show()
  }, 150)
})
