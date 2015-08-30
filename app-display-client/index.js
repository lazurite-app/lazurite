import Renderer from 'scene-renderer'
import querystring from 'querystring'
import signalhub from 'signalhub'
import Fit from 'canvas-fit'

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

    const values = [{}, {}]
    const renderers = ['left', 'right'].map((side, i) => {
      return new Renderer(gl, {
        left: side === 'left',
        right: side === 'right',
        values: values[i],
        manual: false
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

    window.addEventListener('resize', Fit(canvas), false)
  }
}
