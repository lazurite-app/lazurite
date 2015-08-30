const getusermedia = require('getusermedia')
const meta = require('meta-keys')()
const Emitter = require('events/')
const ipc = require('ipc')
const App = new Emitter()

module.exports = App

document.registerElement('app-midi', require('app-midi'))
document.registerElement('app-config', require('app-config'))
document.registerElement('app-sidebar', require('app-sidebar'))
document.registerElement('app-scene-select', require('app-scene-select'))
document.registerElement('app-main-preview', require('app-main-preview'))
document.registerElement('app-display-client', require('app-display-client'))
document.registerElement('app-display-server', require('app-display-server'))

document.body.addEventListener('app-scene-select', e => {
  const sidebars = document.querySelectorAll('app-sidebar')
  const scene = e.scene
  const disabled = meta.shift[0] || meta.shift[1]

  for (var i = 0; i < sidebars.length; i++) {
    if (disabled && !meta.shift[i]) continue
    sidebars[i].renderer.use(scene)
  }
}, true)

document.body.addEventListener('app-main-open-preview', e => {
  ipc.send('app-main-open-preview')
}, true)

// // microphone input :O
// getusermedia({
//   audio: true,
//   video: false
// }, function (err, stream) {
//   if (err) throw err
//
//   var context = new window.AudioContext()
//   var input = context.createMediaStreamSource(stream)
//
//   console.log(input)
// })
