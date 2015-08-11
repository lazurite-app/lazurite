import SceneRenderer from 'scene-renderer'
import Interplay from 'interplay'
import fit from 'canvas-fit'
import vel from 'vel'

const fs = require('fs')
const html = fs.readFileSync(__dirname + '/index.html', 'utf8')

export default class AppSidebar extends window.HTMLElement {
  createdCallback () {
    const el = vel((h, state) => h.html(html))
    this.appendChild(el())
    this.interplay = Interplay()
  }

  attachedCallback () {
    if (!this.canvas) {
      const canvas = this.canvas = setupCanvas(this.querySelector('canvas'))
      const gl = this.gl = canvas.getContext('webgl')
      const control = this.querySelector('.sidebar-interplay')

      control.appendChild(this.interplay.el)
      this.renderer = SceneRenderer(gl, {
        left: this.getAttribute('side') === 'left',
        right: this.getAttribute('side') === 'right',
        interplay: this.interplay
      }).use('scene-warp')
    }
  }
}

// setup canvas
// DOMNode -> DOMNode
function setupCanvas (canvas) {
  window.addEventListener('resize', fit(canvas), false)

  return canvas
}
