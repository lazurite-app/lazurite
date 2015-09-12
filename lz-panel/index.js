import cssnext from 'cssnext'
import vel from 'vel'

const path = require('path')
const fs = require('fs')
const css = cssnext(fs.readFileSync(
  path.join(__dirname, 'index.css')
, 'utf8'))

export default class LzPanel extends window.HTMLElement {
  createdCallback () {
    const style = document.createElement('style')
    style.innerHTML = css

    this.state = {
      name: this.getAttribute('name'),
      icon: this.getAttribute('icon'),
      open: this.isOpen()
    }

    this.createShadowRoot()
    this.shadowRoot.appendChild(style)
  }

  attachedCallback () {
    const state = this.state
    const update = this.update = vel(h => {
      return h('div', { className: 'wrapper' }, [
        h('header', {
          onclick: toggle
        }, [
          h('span', { className: `icon icon-${state.icon}` }),
          h('h1', state.name),
          h('span', { className: 'toggle' },
            h('span', { className: 'toggle-inner' }, state.open ? '-' : '+')
          )
        ]),
        h('section', {
          className: !state.open ? 'closed' : 'opened'
        }, h('content'))
      ])
    })

    this.el = update(this.state)
    this.shadowRoot.appendChild(this.el)

    function toggle (e) {
      state.open = !state.open
      update(state)
    }
  }

  detachedCallback () {
    this.shadowRoot.removeChild(this.el)
    this.update = null
    this.el = null
  }

  isOpen () {
    return this.hasAttribute('open')
      ? this.getAttribute('open') === 'true'
      : true
  }
}
