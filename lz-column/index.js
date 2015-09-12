import Event from 'synthetic-dom-events'
import LzDashboard from 'lz-dashboard'
import findup from 'findup-element'
import prefix from 'prefix-style'
import cssnext from 'cssnext'
import vel from 'vel'

const path = require('path')
const fs = require('fs')
const css = cssnext(fs.readFileSync(
  path.join(__dirname, 'index.css')
, 'utf8'))

const style = document.createElement('style')
style.innerHTML = css
document.body.appendChild(style)

const shadowStyle = `
  .dragger {
    position: absolute;
    top: 0;
    right: -2px;
    bottom: 0;
    width: 2px;
    cursor: ew-resize;
  }

  .content {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    overflow-y: auto;
  }

  :host(:last-of-type) .dragger {
    display: none;
  }
`

export default class LzColumn extends window.HTMLElement {
  createdCallback () {
    const style = document.createElement('style')
    style.innerHTML = shadowStyle

    this.state = {}
    this.createShadowRoot()
    this.shadowRoot.appendChild(style)
  }

  attachedCallback () {
    const self = this
    const update = this.update = vel(h => {
      return h('div', {
        className: 'wrapper'
      }, [
        h('div', {
          className: 'content'
        }, h('content')),
        h('div', {
          className: 'dragger',
          onmousedown: mousedown
        })
      ])
    })

    this.el = update(this.state)
    this.shadowRoot.appendChild(this.el)

    function mousedown (e) {
      document.body.style.userSelect =
      document.body.style.mozUserSelect =
      document.body.style.webkitUserSelect = 'none'
      document.body.style.cursor = 'ew-resize'
      window.addEventListener('mousemove', mousemove, false)
      window.addEventListener('mouseup', mouseup, false)
      self.dispatchEvent(Event('scale-mousedown', {
        clientX: e.clientX
      }))
    }

    function mouseup (e) {
      document.body.style.userSelect =
      document.body.style.mozUserSelect =
      document.body.style.webkitUserSelect = null
      document.body.style.cursor = null
      window.removeEventListener('mousemove', mousemove, false)
      window.removeEventListener('mouseup', mouseup, false)
      self.dispatchEvent(Event('scale-mouseup', {
        clientX: e.clientX
      }))
    }

    function mousemove (e) {
      self.dispatchEvent(Event('scale-mousemove', {
        clientX: e.clientX
      }))
    }
  }

  detachedCallback () {
    this.shadowRoot.removeChild(this.el)
    this.update = null
    this.el = null
  }
}
