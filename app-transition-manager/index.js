import transitions from 'app-transitions'
import AppMIDI from 'app-midi-2'
import Event from 'synthetic-dom-events'
import vel from 'vel'

export default class AppTransitionManager extends window.HTMLElement {
  createdCallback () {
    const el = vel(render)
    const self = this
    const state = {
      progress: 0,
      type: 'fade'
    }

    this.appendChild(update())

    AppMIDI.midi.forEach(controller => {
      controller.on('input', (kind, id, value) => {
        if (kind !== 'faders') return
        if (id !== 7) return
        state.progress = value / 127
        update()
      })
    })

    function update () {
      const event = Event('app-transition-update', { data: state })
      const element = el(state)

      console.log('dispatching?', { state })
      self.dispatchEvent(event)

      return element
    }

    function render (h) {
      return h('form', [
        h('fieldset', [
          h('label', 'Transition Progress'),
          h('input', {
            value: state.progress,
            type: 'range',
            step: 0.001,
            min: 0,
            max: 1,
            'ev-change': e => {
              state.progress = Number(e.target.value)
              update()
            }
          })
        ]),
        h('fieldset', [
          h('label', { for: 'transition-type' }, 'Transition Type'),
          h('select', {
            'id': 'transition-type',
            'name': 'transition-type',
            'value': state.type,
            'ev-change': e => {
              state.type = e.target.value
              update()
            }
          }, transitions.map(name => (
            h('option', {
              selected: name === state.type,
              value: name
            }, name)
          )))
        ])
      ])
    }
  }
}
