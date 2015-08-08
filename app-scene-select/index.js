import { scenes } from 'scene-renderer'
import Event from 'synthetic-dom-events'
import vel from 'vel'

export default class AppSceneSelect extends window.HTMLElement {
  createdCallback () {
    const self = this

    const el = vel(render)
    this.appendChild(el())

    // render dom nodes
    // null -> null
    function render (h) {
      return h('ul.cf', createList(h, dispatch))
    }

    // dispatch an `app-scene-select` event
    // num -> null -> null
    function dispatch (i) {
      return () => {
        self.dispatchEvent(Event('app-scene-select', {
          data: 'placeholder'
        }))
      }
    }
  }

  attachedCallback () {
  }
}

// create a list
// fn -> HTMLElement
function createList (h, dispatch) {
  const list = []

  for (var i = 0; i < scenes.length; i++) {
    list.push(h('li', {
      'ev-click': dispatch(i),
      'data-scene': scenes[i]
    }, h('label', scenes[i])))
  }

  return list
}
