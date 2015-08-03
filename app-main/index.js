import Fit from 'canvas-fit'
import slice from 'sliced'

const display = slice(document.querySelectorAll('canvas'))
const fitters = display.map(canvas => Fit(canvas))

document.registerElement('app-sidebar', require('app-sidebar'))

resize()
window.addEventListener('resize', resize, false)
function resize (e) {
  for (var i = 0; i < fitters.length; i++) {
    fitters[i](e)
  }
}
