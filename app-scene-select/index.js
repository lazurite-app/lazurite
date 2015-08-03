import Event from 'synthetic-dom-events'
import findup from 'findup-element'
import domify from 'domify'

const fs = require('fs')
const html = fs.readFileSync(__dirname + '/index.html', 'utf8')

export default class AppSceneSelect extends HTMLElement {
  createdCallback () {
    this.appendChild(domify(html))
    this.list = this.createList()
    this.querySelector('ul').appendChild(this.list)

    this.addEventListener('click', e => {
      const el = findup(e.target, (
        el => el.hasAttribute && el.hasAttribute('data-scene')
      ))

      if (!el) return

      this.dispatchEvent(Event('app-scene-select', {
        data: 'placeholder'
      }))
    }, false)
  }

  attachedCallback () {
  }

  // good place for vdom I think
  createList () {
    const list = document.createDocumentFragment()

    for (var i = 0; i < 24; i++) {
      const li = document.createElement('li')
      li.setAttribute('data-scene', i)
      list.appendChild(li)
    }

    return list
  }
}
