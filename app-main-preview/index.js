import Event from 'synthetic-dom-events'
import FinalPass from 'app-final-pass'
import triangle from 'a-big-triangle'
import Renderer from 'scene-renderer'
import Shader from 'gl-shader'
import fit from 'canvas-fit'
import FBO from 'gl-fbo'
import raf from 'raf'
import vel from 'vel'

export default class AppMainPreview extends window.HTMLElement {
  createdCallback () {
    const self = this

    this.wrap = document.createElement('div')
    this.wrap.classList.add('preview')

    this.canvas = this.wrap.appendChild(document.createElement('canvas'))
    this.gl = this.canvas.getContext('webgl')
    this.finalPass = FinalPass(this.gl)

    this.fit = fit(this.canvas)
    this.appendChild(this.wrap)
    window.addEventListener('resize', this.fit, false)

    this.sidebars = [
      document.querySelectorAll('app-sidebar')[0],
      document.querySelectorAll('app-sidebar')[1]
    ].map((el, i) => {
      el.addEventListener('app-sidebar-change-scene', e => {
        this.renderers[i].use(e.scene)
      }, false)

      return el
    })

    this.renderers = this.sidebars.map((sidebar, i) => (
      Renderer(this.gl, {
        left: !i,
        right: !!i,
        values: sidebar.values,
        manual: true
      }).use('scene-warp')
    ))

    this.frames = this.renderers.map(r => FBO(this.gl, [2, 2]))
    this.shader = Shader(this.gl, `
      precision mediump float;

      attribute vec2 position;
      varying vec2 uv;

      void main() {
        uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 1, 1);
      }
    `, `
      precision mediump float;

      uniform vec2 iResolution;
      varying vec2 uv;
      uniform sampler2D from;
      uniform sampler2D to;
      uniform float progress;

      void main() {
        gl_FragColor = mix(
          texture2D(from, uv),
          texture2D(to, uv),
          progress
        );

        gl_FragColor.a = 1.0;
      }
    `)

    const el = vel(render)
    const state = this.state = {
      smallScale: 4,
      largeScale: 8,
      smallEnabled: true,
      largeEnabled: true,
      transitionProgress: 0,
      transitionType: 'fade'
    }

    this.appendChild(update(state))

    this.tick = this.tick.bind(this)
    this.tick()

    document.body.addEventListener('app-transition-update', e => {
      state.transitionProgress = e.data.progress
      state.transitionType = e.data.type
    }, true)

    function render (h, state) {
      return h('form', [
        h('button', {
          'ev-click': e => {
            e.preventDefault()
            self.dispatchEvent(Event('app-main-open-preview'))
          }
        }, 'OPEN PREVIEW WINDOW'),
        h('fieldset', [
          h('label', { for: 'small-preview-scale' }, 'Small Preview Scale'),
          h('select', {
            'id': 'small-preview-scale',
            'name': 'small-preview-scale',
            'ev-change': e => {
              const value = Number(e.target.value)
              if (value) state.smallScale = value
              state.smallEnabled = !!value
              update()
            }
          }, [
            h('option', { value: 0, selected: !state.smallEnabled }, 'Disable'),
            h('option', { value: 8, selected: 8 === state.smallScale }, '8x'),
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
              const value = Number(e.target.value)
              if (value) state.largeScale = value
              state.largeEnabled = !!value
              update()
            }
          }, [
            h('option', { value: 0, selected: !state.largeEnabled }, 'Disable'),
            h('option', { value: 4, selected: 8 === state.largeScale }, '8x'),
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

    if (!this.state.largeEnabled) return

    const { gl } = this
    const shape = [gl.drawingBufferWidth, gl.drawingBufferHeight]
    var progress = this.state.transitionProgress
    if (progress > 1) progress = 1
    if (progress < 0) progress = 0

    if (progress !== 1) {
      this.frames[0].bind()
      this.frames[0].shape = shape
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.viewport(0, 0, shape[0], shape[1])
      this.renderers[0].tick()
    }

    if (progress !== 0) {
      this.frames[1].bind()
      this.frames[1].shape = shape
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.viewport(0, 0, shape[0], shape[1])
      this.renderers[1].tick()
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.finalPass.transition(this.state.transitionType)
    this.finalPass(
      this.frames[0].color[0],
      this.frames[1].color[0],
      progress
    )
  }
}
