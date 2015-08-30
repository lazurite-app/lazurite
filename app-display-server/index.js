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

    this.addEventListener('app-sidebar-update', e => {
      this.client.broadcast('/updates', {
        value: e.next,
        side: e.side,
        key: e.key
      })
    }, true)
  }
}
