const triangle = require('a-big-triangle')
const Shader = require('gl-shader')
const Range = require('interplay-range')
const Bang = require('interplay-bang')
const Texture2D = require('gl-texture2d')
const ndarray = require('ndarray')

module.exports = Scene

function Scene (gl, scene) {
  var resolution = new Float32Array([0, 0, 0])
  var shader = null
  var ndaFreqs = []
  var texFreqs = []
  var ndaWaves = []
  var texWaves = []
  var vert
  var frag

  scene.on('init', function (time) {
    frag = scene.shaders.frag.on('change', updateShader)
    vert = scene.shaders.vert.on('change', updateShader)
    shader = Shader(gl, vert, frag)

    function updateShader () {
      if (!shader) return
      shader.update(vert, frag)
    }
  })

  scene.on('step', function (time) {
    if (!shader) return

    gl.viewport(0, 0,
      resolution[0] = gl.drawingBufferWidth,
      resolution[1] = gl.drawingBufferHeight
    )

    shader.bind()
    shader.uniforms.iGlobalTime = scene.time
    shader.uniforms.iResolution = resolution

    const { sources } = scene.microphone
    for (var i = 0, j = 0, k = 0; i < sources.length; i++) {
      var source = sources[i]
      if (!source.enabled) continue

      var lfkey = `frequencyL${i}`
      var rfkey = `frequencyR${i}`
      var lwkey = `waveformL${i}`
      var rwkey = `waveformR${i}`

      if (lfkey in shader.uniforms) {
        const data = source.frequency[0]
        ndaFreqs[j] = ndaFreqs[j] || ndarray(data, [data.length, 1])
        texFreqs[j] = texFreqs[j] || setupTex(Texture2D(gl, ndaFreqs[j]))
        texFreqs[j].setPixels(ndaFreqs[j])
        shader.uniforms[lfkey] = texFreqs[j++].bind(k++)
      }

      if (rfkey in shader.uniforms) {
        const data = source.frequency[1]
        ndaFreqs[j] = ndaFreqs[j] || ndarray(data, [data.length, 1])
        texFreqs[j] = texFreqs[j] || setupTex(Texture2D(gl, ndaFreqs[j]))
        texFreqs[j].setPixels(ndaFreqs[j])
        shader.uniforms[rfkey] = texFreqs[j++].bind(k++)
      }

      if (lwkey in shader.uniforms) {
        const data = source.waveform[0]
        ndaWaves[j] = ndaWaves[j] || ndarray(data, [data.length, 1])
        texWaves[j] = texWaves[j] || setupTex(Texture2D(gl, ndaWaves[j]))
        texWaves[j].setPixels(ndaWaves[j])
        shader.uniforms[rfkey] = texWaves[j++].bind(k++)
      }

      if (rwkey in shader.uniforms) {
        const data = source.waveform[1]
        ndaWaves[j] = ndaWaves[j] || ndarray(data, [data.length, 1])
        texWaves[j] = texWaves[j] || setupTex(Texture2D(gl, ndaWaves[j]))
        texWaves[j].setPixels(ndaWaves[j])
        shader.uniforms[rfkey] = texWaves[j++].bind(k++)
      }
    }

    for (var key in scene.parameters) {
      if (!scene.parameters.hasOwnProperty(key)) continue
      shader.uniforms[key] = scene.parameters[key]
    }

    triangle(gl)
  })

  scene.on('stop', function (time) {
    if (shader) shader.dispose()
    if (vert) vert.removeAllListeners()
    if (frag) frag.removeAllListeners()
    shader = vert = frag = null
  })
}

function setupTex (tex) {
  tex.wrap = tex.gl.REPEAT
  tex.magFilter = tex.gl.LINEAR
  tex.minFilter = tex.gl.LINEAR
  return tex
}
