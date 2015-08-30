import Event from 'synthetic-dom-events'
import querystring from 'querystring'
import signalhub from 'signalhub'

const hubPort = querystring.parse(String(
  window.location.search
).slice(1)).hub

export default class AppDisplayClient extends window.HTMLElement {
  createdCallback () {
    this.client = signalhub('lazurite-client', [
      `http://localhost:${hubPort}`
    ])

    this.client.subscribe('updates').on('data', data => {
      console.log('update', data)
      this.dispatchEvent(Event('lazurite-client-data', {
        data: data
      }))
    })

    this.client.subscribe('reset').on('data', e => {
      console.log('reset', e)
    })
  }
}
