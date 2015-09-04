import LaunchControlXL from 'launch-control-xl'

class AppMidi2 {
  constructor () {
    this.midi = [1, 2].map(bank => new LaunchControlXL({ bank }))
    this.midi.forEach(controller => {
      controller.reset()
    })

    navigator.requestMIDIAccess({
      sysex: true
    }).then(midi => {
      var outputs = []
      var inputs = []

      for (var input of midi.inputs.values()) {
        inputs.push(input)
      }
      for (var output of midi.outputs.values()) {
        outputs.push(output)
      }

      if (inputs.length) {
        this.midi.forEach(controller => controller.setInput(inputs[0]))
      }
      if (outputs.length) {
        this.midi.forEach(controller => controller.setOutput(outputs[0]))
      }
    })
  }
}

export default new AppMidi2()
