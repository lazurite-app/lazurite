document.registerElement('app-sidebar', require('app-sidebar'))
document.registerElement('app-scene-select', require('app-scene-select'))

document.body.addEventListener('app-scene-select', e => {
  console.log('it works!', e.data)
}, true)
