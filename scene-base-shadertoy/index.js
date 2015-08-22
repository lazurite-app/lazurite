const triangle = require('a-big-triangle')
const Shader = require('gl-shader')
const Range = require('interplay-range')
const Bang = require('interplay-bang')

module.exports = Scene

function Scene (gl, scene) {
  var resolution = new Float32Array([0, 0, 0])
  var shader = null
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
