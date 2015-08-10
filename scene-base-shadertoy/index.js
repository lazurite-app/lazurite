const triangle = require('a-big-triangle')
const Shader = require('gl-shader')
const Range = require('interplay-range')
const Bang = require('interplay-bang')

module.exports = Scene

function Scene (gl, scene) {
  var shader = null
  var keys = []
  var vert
  var frag

  scene.on('init', function (time) {
    frag = scene.shaders.frag.on('change', updateShader)
    vert = scene.shaders.vert.on('change', updateShader)
    keys = Object.keys(scene.parameters)
    shader = Shader(gl, vert, frag)

    function updateShader () {
      if (!shader) return
      shader.update(vert, frag)
      keys = Object.keys(scene.parameters)
    }
  })

  scene.on('step', function (time) {
    if (!shader) return

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    shader.bind()
    shader.uniforms.iGlobalTime = scene.time

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
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
