const getusermedia = require('getusermedia')
const meta = require('meta-keys')()

document.registerElement('app-midi', require('app-midi'))
document.registerElement('app-config', require('app-config'))
document.registerElement('app-sidebar', require('app-sidebar'))
document.registerElement('app-scene-select', require('app-scene-select'))

document.body.addEventListener('app-scene-select', e => {
  const sidebars = document.querySelectorAll('app-sidebar')
  const scene = e.scene
  const disabled = meta.shift[0] || meta.shift[1]

  for (var i = 0; i < sidebars.length; i++) {
    if (disabled && !meta.shift[i]) continue
    sidebars[i].renderer.use(scene)
  }
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
