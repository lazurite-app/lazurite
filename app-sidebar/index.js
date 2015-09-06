import SceneRenderer from 'scene-renderer'
import Event from 'synthetic-dom-events'
import findup from 'findup-element'
import Interplay from 'interplay'
import AppMIDI from 'app-midi-2'
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
    this.side = null
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

    if (!this.interplay) return

    this.interplay.on('change', (key, next, prev) => {
      this.side = (this.side || this.getAttribute('side'))
      this.dispatchEvent(Event('app-sidebar-update', {
        key, next, prev,
        side: this.side
      }))
    })
  }

  attachedCallback () {
    if (!this.canvas) {
      const canvas = this.canvas = this.querySelector('canvas')
      const gl = this.gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: true
      })

      window.addEventListener('resize', this.fit = fit(canvas), false)
      window.addEventListener('app-main-preview-settings', e => {
        if ('smallEnabled' in e.data) {
          console.log(
            this.renderer.paused = !e.data.smallEnabled
          )
        }

        var scale = 1 / e.data.smallScale
        if (scale !== this.fit.scale) {
          this.fit.scale = scale
          this.fit()
        }
      }, true)

      const control = this.querySelector('.sidebar-interplay')
      const right = this.getAttribute('side') === 'right'
      const left = this.getAttribute('side') === 'left'
      const resetSignal = name => {
        this.dispatchEvent(Event('app-sidebar-reset', {
          side: this.getAttribute('side'),
          data: this.values,
          scene: name
        }))
      }

      control.appendChild(this.interplay.el)
      this.renderer = SceneRenderer(gl, {
        left, right,
        interplay: this.interplay
      }).on('change', name => {
        this.dispatchEvent(Event('app-sidebar-change-scene', {
          left, right,
          scene: name
        }))

        resetSignal(name)
      }).use('scene-warp')

      resetSignal('scene-warp')

      AppMIDI.midi[
        this.getAttribute('side') === 'left' ? 0 : 1
      ].on('input', (kind, id, value) => {
        if (!this.interplay) return
        if (kind !== 'knobs') return

        const values = this.interplay.values
        var i = -1
        for (var key in values) {
          if (!values.hasOwnProperty(key)) continue
          if (++i > id) break
          if (i !== id) continue
          var opts = this.interplay.options[key]
          values[key] = opts.min + value / 127 * (opts.max - opts.min)
        }
      })
    }
  }
}
