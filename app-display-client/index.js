import Event from 'synthetic-dom-events'
import querystring from 'querystring'
import signalhub from 'signalhub'

const hubPort = querystring.parse(String(
  window.location.search
).slice(1)).hub

export default class AppDisplayClient extends window.HTMLElement {
  createdCallback () {
    signalhub('lazurite-client', [ `http://localhost:${hubPort}` ])
      .subscribe('/updates')
      .on('data', data => {
        console.log(data)

        this.dispatchEvent(Event('lazurite-client-data', {
          data: data
        }))
      })
  }
}
