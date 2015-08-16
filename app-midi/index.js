import LaunchControlXL from 'launch-control-xl'
import vel from 'vel'

export default class AppMIDI extends window.HTMLElement {
  createdCallback () {
    const controller = this.controller = LaunchControlXL()
    const el = vel(render)

    controller.reset()
    this.appendChild(el({
      inputs: [],
      outputs: []
    }))

    function render (h, state) {
      const { inputs, outputs } = state

      if (inputs.length + outputs.length <= 0) {
        return h('div.missing', [
          h('span.icon.typcn.typcn-warning-outline'),
          h('div', 'No MIDI devices detected')
        ])
      }

      return h('div', [
        h('label', 'MIDI Input Device'),
        h('select', inputs.map(d => h('option', d.name))),
        h('label', 'MIDI Output Device'),
        h('select', outputs.map(d => h('option', d.name)))
      ])
    }

    navigator.requestMIDIAccess({
      sysex: true
    }).then(midi => {
      updateMIDISelection(midi)
      midi.addEventListener('statechange', e => updateMIDISelection(midi))
    })

    function updateMIDISelection (midi) {
      var outputs = []
      var inputs = []

      for (var input of midi.inputs.values()) {
        inputs.push(input)
      }
      for (var output of midi.outputs.values()) {
        outputs.push(output)
      }

      if (!controller.input && inputs.length) {
        controller.setInput(inputs[0])
      }
      if (!controller.output && outputs.length) {
        controller.setOutput(outputs[0])
      }

      el({ inputs, outputs })
    }
  }
}
