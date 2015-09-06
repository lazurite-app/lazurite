import Texture2D from 'gl-texture2d'
import ndarray from 'ndarray'

module.exports = attachMicrophone

function attachMicrophone (scene) {
  var ndaFreqs = []
  var texFreqs = []
  var ndaWaves = []
  var texWaves = []

  return updateMicrophone

  function updateMicrophone (shader, k = 0) {
    const { sources } = scene.microphone
    const { gl } = shader

    for (var i = 0, j = 0; i < sources.length; i++) {
      var source = sources[i]
      if (!source.enabled) continue

      var lfkey = `frequencyL${i}`
      var rfkey = `frequencyR${i}`
      var lwkey = `waveformL${i}`
      var rwkey = `waveformR${i}`

      if (lfkey in shader.uniforms) {
        const data = source.frequency[0]
        ndaFreqs[j] = ndaFreqs[j] || ndarray(data, [data.length, 1])
        ndaFreqs[j].data = data
        texFreqs[j] = texFreqs[j] || setupTex(Texture2D(gl, ndaFreqs[j]))
        texFreqs[j].setPixels(ndaFreqs[j])
        shader.uniforms[lfkey] = texFreqs[j++].bind(k++)
      }

      if (rfkey in shader.uniforms) {
        const data = source.frequency[1]
        ndaFreqs[j] = ndaFreqs[j] || ndarray(data, [data.length, 1])
        ndaFreqs[j].data = data
        texFreqs[j] = texFreqs[j] || setupTex(Texture2D(gl, ndaFreqs[j]))
        texFreqs[j].setPixels(ndaFreqs[j])
        shader.uniforms[rfkey] = texFreqs[j++].bind(k++)
      }

      if (lwkey in shader.uniforms) {
        const data = source.waveform[0]
        ndaWaves[j] = ndaWaves[j] || ndarray(data, [data.length, 1])
        ndaWaves[j].data = data
        texWaves[j] = texWaves[j] || setupTex(Texture2D(gl, ndaWaves[j]))
        texWaves[j].setPixels(ndaWaves[j])
        shader.uniforms[rfkey] = texWaves[j++].bind(k++)
      }

      if (rwkey in shader.uniforms) {
        const data = source.waveform[1]
        ndaWaves[j] = ndaWaves[j] || ndarray(data, [data.length, 1])
        ndaWaves[j].data = data
        texWaves[j] = texWaves[j] || setupTex(Texture2D(gl, ndaWaves[j]))
        texWaves[j].setPixels(ndaWaves[j])
        shader.uniforms[rfkey] = texWaves[j++].bind(k++)
      }
    }
  }
}

function setupTex (tex) {
  tex.wrap = tex.gl.REPEAT
  tex.magFilter = tex.gl.LINEAR
  tex.minFilter = tex.gl.LINEAR
  return tex
}
