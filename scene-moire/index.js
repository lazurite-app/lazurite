var attachMicrophone = require('scene-base-shadertoy/attach-microphone')
var perspective = require('gl-matrix').mat4.perspective
var identity = require('gl-matrix').quat.identity
var rotateX = require('gl-matrix').quat.rotateX
var rotateY = require('gl-matrix').quat.rotateY
var rotateZ = require('gl-matrix').quat.rotateZ
var OrbitCamera = require('orbit-camera')
var glBuffer = require('gl-buffer')
var Shader = require('gl-shader')
var VAO = require('gl-vao')

const POINTS = 25000

module.exports = Scene

function Scene (gl, scene) {
  var resolution = new Float32Array([0, 0, 0])
  var microphone = attachMicrophone(scene)
  var eye = new Float32Array([5, 0, 0])
  var center = new Float32Array([0, 0, 0])
  var up = new Float32Array([0, 0, 1])
  var camera = OrbitCamera(eye, center, up)
  var shader = null
  var vert, frag
  var lbuf
  var line

  var proj = new Float32Array(16)
  var view = new Float32Array(16)
  var data

  scene.on('init', function (time) {
    frag = scene.shaders.frag.on('change', updateShader)
    vert = scene.shaders.vert.on('change', updateShader)
    shader = Shader(gl, vert, frag)

    data = new Float32Array(POINTS)
    for (var i = 0; i < data.length; i++) data[i] = i

    line = VAO(gl, [{
      buffer: lbuf = glBuffer(gl, data),
      size: 1,
      type: gl.FLOAT
    }])

    function updateShader () {
      if (shader) shader.update(vert, frag)
    }
  })

  scene.on('stop', function () {
    shader.dispose()
    line.dispose()
    lbuf.dispose()
    shader = frag = vert = line = data = lbuf = null
  })

  scene.on('step', function (time) {
    if (!shader) return

    var width = resolution[0] = gl.drawingBufferWidth
    var height = resolution[1] = gl.drawingBufferHeight

    gl.viewport(0, 0, width, height)
    gl.clearColor(1, 1, 1, 1)
    gl.clearDepth(true)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.DST_COLOR, gl.ZERO)
    gl.lineWidth(1)

    identity(camera.rotation)
    rotateX(camera.rotation, camera.rotation, 0.0050 * time)
    rotateY(camera.rotation, camera.rotation, 0.0062 * time)
    rotateZ(camera.rotation, camera.rotation, 0.0046 * time)
    camera.view(view)
    perspective(proj
      , Math.PI / 4
      , width / height
      , 0.001
      , 100
    )

    shader.bind()
    microphone(shader)
    shader.uniforms.view = view
    shader.uniforms.proj = proj
    shader.uniforms.time = scene.time + 20
    shader.uniforms.rings[0].radius = 1
    shader.uniforms.rings[0].spin = [0.2, 0.1]
    shader.uniforms.rings[0].speed = 0.001
    shader.uniforms.rings[0].movement = 0.1
    shader.uniforms.rings[1].radius = 0
    shader.uniforms.rings[1].spin = [0.052, 0.05]
    shader.uniforms.rings[1].speed = 0.02
    shader.uniforms.rings[1].movement = 0.1

    for (var key in scene.parameters) {
      if (!scene.parameters.hasOwnProperty(key)) continue
      shader.uniforms[key] = scene.parameters[key]
    }

    line.bind()
    line.draw(gl.LINE_STRIP, data.length / 2)

    gl.disable(gl.BLEND)
  })
}
