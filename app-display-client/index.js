import Event from 'synthetic-dom-events'
import qc from 'rtc-quickconnect'
import freeice from 'freeice'

export default class AppDisplayClient extends window.HTMLElement {
  createdCallback () {
    this.client = qc('https://switchboard.rtc.io/', {
      room: 'lazurite-client',
      iceServers: freeice()
    }).createDataChannel('lazurite')
      .on('channel:opened:lazurite', (id, dc) => {
        console.log('connected!')

        dc.onmessage = e => {
          try {
            var data = JSON.parse(e.data)
          } catch(e) {
            return console.error('invalid data:', e.data)
          }

          console.log(data)

          this.dispatchEvent(Event('lazurite-client-data', {
            data: data
          }))
        }
      })
  }
}
