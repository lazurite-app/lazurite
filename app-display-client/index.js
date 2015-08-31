import FinalPass from 'app-final-pass'
import Renderer from 'scene-renderer'
import querystring from 'querystring'
import signalhub from 'signalhub'
import Fit from 'canvas-fit'
import FBO from 'gl-fbo'
import raf from 'raf'

const hubPort = querystring.parse(String(
  window.location.search
).slice(1)).hub

export default class AppDisplayClient extends window.HTMLElement {
  createdCallback () {
    const canvas = this.appendChild(document.createElement('canvas'))
    const gl = canvas.getContext('webgl')
    const client = signalhub('lazurite-client', [
      `http://localhost:${hubPort}`
    ])

    this.state = {
      transitionProgress: 0,
      transitionType: 'fade'
    }

    const finalPass = FinalPass(gl)
    const frames = [
      FBO(gl, [2, 2]),
      FBO(gl, [2, 2])
    ]

    const values = [{}, {}]
    const renderers = ['left', 'right'].map((side, i) => {
      return new Renderer(gl, {
        left: side === 'left',
        right: side === 'right',
        values: values[i],
        manual: true
      }).use('scene-warp')
    })

    client.subscribe('updates').on('data', data => {
      const sidx = data.side === 'left' ? 0 : 1
      values[sidx][data.key] = data.value
    })

    client.subscribe('reset').on('data', data => {
      const sidx = data.side === 'left' ? 0 : 1
      const vals = values[sidx]
      const repl = data.data

      renderers[sidx].use(data.scene).once('change', function () {
        Object.keys(repl).forEach(key => {
          vals[key] = repl[key]
        })
      })
    })

    client.subscribe('transition').on('data', data => {
      this.state.transitionProgress = data.progress
      this.state.transitionType = data.type
    })

    window.addEventListener('resize', Fit(canvas), false)

    var tick = () => {
      raf(tick) // TODO: only run when visible

      const shape = [gl.drawingBufferWidth, gl.drawingBufferHeight]
      var progress = this.state.transitionProgress
      if (progress > 1) progress = 1
      if (progress < 0) progress = 0

      if (progress !== 1) {
        frames[0].bind()
        frames[0].shape = shape
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, shape[0], shape[1])
        renderers[0].tick()
      }

      if (progress !== 0) {
        frames[1].bind()
        frames[1].shape = shape
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, shape[0], shape[1])
        renderers[1].tick()
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      finalPass.transition(this.state.transitionType)
      finalPass(
        frames[0].color[0],
        frames[1].color[0],
        this.state.transitionProgress
      )
    }

    tick()
  }
}
