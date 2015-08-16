import Event from 'synthetic-dom-events'
import Renderer from 'scene-renderer'
import fit from 'canvas-fit'
import raf from 'raf'
import vel from 'vel'

export default class AppMainPreview extends window.HTMLElement {
  createdCallback () {
    const self = this

    this.wrap = document.createElement('div')
    this.wrap.classList.add('preview')

    this.canvas = this.wrap.appendChild(document.createElement('canvas'))
    this.gl = this.canvas.getContext('webgl')

    this.fit = fit(this.canvas)
    this.appendChild(this.wrap)
    window.addEventListener('resize', this.fit, false)

    this.sidebars = [
      document.querySelectorAll('app-sidebar')[0],
      document.querySelectorAll('app-sidebar')[1]
    ]

    this.renderers = this.sidebars.map((sidebar, i) => (
      Renderer(this.gl, {
        left: !i,
        right: !!i,
        values: sidebar.values,
        manual: true
      }).use('scene-warp')
    ))

    const el = vel(render)
    const state = {
      smallScale: 4,
      largeScale: 4
    }

    this.appendChild(update(state))

    this.tick = this.tick.bind(this)
    this.tick()

    function render (h, state) {
      return h('form', [
        h('fieldset', [
          h('label', { for: 'small-preview-scale' }, 'Small Preview Scale'),
          h('select', {
            'id': 'small-preview-scale',
            'name': 'small-preview-scale',
            'ev-change': e => {
              state.smallScale = Number(e.target.value)
              update()
            }
          }, [
            h('option', { value: 4, selected: 4 === state.smallScale }, '4x'),
            h('option', { value: 2, selected: 2 === state.smallScale }, '2x'),
            h('option', { value: 1, selected: 1 === state.smallScale }, '1x'),
            h('option', { value: 0.5, selected: 0.5 === state.smallScale }, '1/2x')
          ])
        ]),
        h('fieldset', [
          h('label', { for: 'large-preview-scale' }, 'Large Preview Scale'),
          h('select', {
            'id': 'large-preview-scale',
            'name': 'large-preview-scale',
            'ev-change': e => {
              state.largeScale = Number(e.target.value)
              update()
            }
          }, [
            h('option', { value: 4, selected: 4 === state.largeScale }, '4x'),
            h('option', { value: 2, selected: 2 === state.largeScale }, '2x'),
            h('option', { value: 1, selected: 1 === state.largeScale }, '1x'),
            h('option', { value: 0.5, selected: 0.5 === state.largeScale }, '1/2x')
          ])
        ])
      ])
    }

    function update () {
      self.dispatchEvent(Event('app-main-preview-settings', {
        data: state
      }))

      var scale = 1 / state.largeScale
      if (scale !== self.fit.scale) {
        self.fit.scale = scale
        self.fit()
      }

      return el(state)
    }
  }

  tick () {
    raf(this.tick) // TODO: only run when visible

    const { gl } = this

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    this.renderers[0].tick()
    this.renderers[1].tick()
  }
}
