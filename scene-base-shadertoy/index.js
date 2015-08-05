const triangle = require('a-big-triangle')
const Shader = require('gl-shader')

module.exports = Scene

function Scene (gl, scene) {
  var shader = null
  var keys = []
  var vert
  var frag

  scene.on('init', time => {
    frag = scene.shaders.frag.on('change', updateShader)
    vert = scene.shaders.vert.on('change', updateShader)
    keys = Object.keys(scene.parameters)
    shader = Shader(gl, frag, vert)

    function updateShader () {
      if (!shader) return
      shader.update(vert, frag)
      keys = Object.keys(scene.parameters)
    }
  })

  scene.on('draw', time => {
    shader.bind()
    shader.uniforms.iGlobalTime = scene.time

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      shader.uniforms[key] = scene.parameters[key].value
    }

    triangle(gl)
  })

  scene.on('stop', time => {
    if (shader) shader.dispose()
    if (vert) vert.removeAllListeners()
    if (frag) frag.removeAllListeners()
    shader = vert = frag = null
  })
}
