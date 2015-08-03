import Fit from 'canvas-fit'
import slice from 'sliced'

const display = slice(document.querySelectorAll('canvas'))
const fitters = display.map(canvas => Fit(canvas))

resize()
window.addEventListener('resize', resize, false)
function resize(e) {
  for (var i = 0; i < fitters.length; i++) {
    fitters[i](e)
  }
}
