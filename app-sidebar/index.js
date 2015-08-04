import fit from 'canvas-fit'
import vel from 'vel'

const fs = require('fs')
const html = fs.readFileSync(__dirname + '/index.html', 'utf8')

export default class AppSidebar extends window.HTMLElement {
  createdCallback () {
    const el = vel((h, state) => h.html(html))
    this.appendChild(el())
  }

  attachedCallback () {
    if (!this.canvas) {
      const canvas = this.querySelector('canvas')
      this.canvas = setupCanvas(canvas)
    }
  }
}

// setup canvas
// DOMNode -> DOMNode
function setupCanvas (canvas) {
  window.addEventListener('resize', fit(canvas), false)
  return canvas
}
