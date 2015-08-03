import fit from 'canvas-fit'
import domify from 'domify'

const fs = require('fs')
const html = fs.readFileSync(__dirname + '/index.html', 'utf8')

export default class AppSidebar extends HTMLElement {
  createdCallback () {
    this.appendChild(domify(html))
  }

  attachedCallback () {
    this.canvas = this.canvas || this.setupCanvas()
  }

  setupCanvas () {
    const canvas = this.querySelector('canvas')
    window.addEventListener('resize', fit(canvas), false)
    return canvas
  }
}
