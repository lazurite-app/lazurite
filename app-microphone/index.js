import Analyser from 'web-audio-analyser'
import raf from 'raf'

class AppMicrophone {
  constructor () {
    this.sources = []

    window.MediaStreamTrack.getSources(sources => {
      sources = sources.filter(source => source.kind === 'audio')
      sources = sources.filter(source => source.label !== 'Default')
      sources.forEach(source => {
        navigator.webkitGetUserMedia({
          audio: {
            optional: [{
              sourceId: source.id
            }]
          },
          video: false
        }, stream => {
          this.sources.push({
            label: source.label,
            id: source.id,
            enabled: true,
            analyser: Analyser(stream, {
              audible: false
            }),
            waveform: [
              new Uint8Array(1024),
              new Uint8Array(1024)
            ],
            frequency: [
              new Uint8Array(1024),
              new Uint8Array(1024)
            ]
          })

          tick()
        }, err => {
          throw err
        })
      })
    })

    var tick = _ => {
      raf(tick)

      for (var i = 0; i < this.sources.length; i++) {
        const source = this.sources[i]
        if (!source.enabled) continue

        source.analyser.waveform(source.waveform[0], 0)
        source.analyser.waveform(source.waveform[1], 1)
        source.analyser.frequencies(source.frequency[0], 0)
        source.analyser.frequencies(source.frequency[1], 1)
      }
    }
  }
}

export default new AppMicrophone()
