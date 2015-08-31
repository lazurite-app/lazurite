import querystring from 'querystring'
import signalhub from 'signalhub'

const hubPort = querystring.parse(String(
  window.location.search
).slice(1)).hub

export default class AppDisplayServer extends window.HTMLElement {
  createdCallback () {
    this.client = signalhub('lazurite-client', [
      `http://localhost:${hubPort}`
    ])

    var lastScene = {
      right: {},
      left: {}
    }

    this.addEventListener('app-sidebar-update', e => {
      this.client.broadcast('updates', {
        value: e.next,
        side: e.side,
        key: e.key
      })
    }, true)

    this.addEventListener('app-sidebar-reset', e => {
      this.client.broadcast('reset', lastScene[e.side] = {
        scene: e.scene,
        data: e.data,
        side: e.side
      })
    }, true)

    this.client.subscribe('fresh').on('data', channel => {
      if (channel !== 'lazurite-client/updates') return
      this.client.broadcast('reset', lastScene.left)
      this.client.broadcast('reset', lastScene.right)
    })

    document.body.addEventListener('app-transition-update', e => {
      this.client.broadcast('transition', e.data)
    }, true)
  }
}
