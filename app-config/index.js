import slice from 'sliced'
import vel from 'vel'

export default class AppConfig extends window.HTMLElement {
  createdCallback () {
    const panels = slice(this.querySelectorAll('app-config-panel'))
    const panelNames = panels.map(el => el.getAttribute('name'))
    const panelIcons = panels.map(el => el.getAttribute('icon'))

    var selected = this.getAttribute('selected') || panelNames[0]

    const el = vel(render)
    this.appendChild(el())

    update()
    function update () {
      el()
      panels.forEach((el, i) => {
        el.style.display = panelNames[i] === selected
          ? 'block'
          : 'none'
      })
    }

    function render (h, state) {
      const names = panelNames.map((name, i) => {
        const classes = selected === name ? '.selected' : ''
        return h(`li${classes}`, {
          'ev-click': selectPanel(name),
          'title': name
        }, h(`span.typcn.typcn-${panelIcons[i]}`))
      })

      return h('nav.panel-selection', h('ul', names))
    }

    function selectPanel (name) {
      return e => {
        selected = name
        update()
      }
    }
  }
}
