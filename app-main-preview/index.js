import Event from 'synthetic-dom-events'
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
    const state = {
      smallScale: 4,
      largeScale: 8
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
              state.largeScale = Number(e.target.value)
              update()
            }
          }, [
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

    const { gl } = this
    const shape = [gl.drawingBufferWidth, gl.drawingBufferHeight]
    var progress = Math.sin(Date.now() / 1000) * 2
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
    gl.viewport(0, 0, shape[0], shape[1])
    this.shader.bind()
    this.shader.uniforms.iResolution = shape
    this.shader.uniforms.from = this.frames[0].color[0].bind(0)
    this.shader.uniforms.to = this.frames[1].color[0].bind(1)
    this.shader.uniforms.progress = progress
    triangle(gl)
  }
}
