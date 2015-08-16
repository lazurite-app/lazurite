import SceneRenderer from 'scene-renderer'
import Event from 'synthetic-dom-events'
import findup from 'findup-element'
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
    this.values = this.interplay.values
    this.fit = null

    this.addEventListener('click', e => {
      const el = findup(e.target, el => (
        el.hasAttribute && el.hasAttribute('data-snapshot')
      ))

      if (!el) return

      this.renderer.captureSnapshot(function (err) {
        if (err) return
        this.dispatchEvent(Event('app-sidebar-snapshot'))
      })
    }, false)
  }

  attachedCallback () {
    if (!this.canvas) {
      const canvas = this.canvas = this.querySelector('canvas')
      const gl = this.gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: true
      })

      window.addEventListener('resize', this.fit = fit(canvas), false)
      window.addEventListener('app-main-preview-settings', e => {
        var scale = 1 / e.data.smallScale
        if (scale !== this.fit.scale) {
          this.fit.scale = scale
          this.fit()
        }
      }, true)

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
