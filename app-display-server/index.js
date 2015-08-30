const qc = require('rtc-quickconnect')
const freeice = require('freeice')

export default class AppDisplayServer extends window.HTMLElement {
  createdCallback () {
    const channels = new Set()

    this.client = qc('https://switchboard.rtc.io/', {
      room: 'lazurite-client',
      iceServers: freeice()
    }).createDataChannel('lazurite')
      .on('channel:opened:lazurite', (_, dc) => channels.add(dc))
      .on('channel:closed:lazurite', (_, dc) => channels.delete(dc))

    this.addEventListener('app-sidebar-update', e => {
      const data = JSON.stringify({
        value: e.next,
        side: e.side,
        key: e.key
      })

      for (var channel of channels.values()) {
        if (channel.readyState === 'closed') {
          channels.delete(channel)
          continue
        }

        channel.send(data)
      }
    }, true)
  }
}
