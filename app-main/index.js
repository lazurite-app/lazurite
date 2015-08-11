const getusermedia = require('getusermedia')

document.registerElement('app-sidebar', require('app-sidebar'))
document.registerElement('app-scene-select', require('app-scene-select'))

document.body.addEventListener('app-scene-select', e => {
  const sidebars = document.querySelectorAll('app-sidebar')
  const scene = e.scene

  for (var i = 0; i < sidebars.length; i++) {
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
