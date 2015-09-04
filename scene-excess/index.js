var createBuffer = require('gl-buffer')
var createFBO = require('gl-fbo')
var createVAO = require('gl-vao')
var Shader = require('gl-shader')

var ndarray = require('ndarray')
var fill = require('ndarray-fill')

module.exports = Scene

function Scene (gl, scene) {
  var resolution = new Float32Array([0, 0, 0])
  var logicVert, renderVert
  var logicFrag, renderFrag
  var screenVertices, particleVertices
  var screenBuffer, particleBuffer
  var render = null
  var logic = null
  var nextState
  var prevState

  var initialState = ndarray(new Float32Array(512 * 512 * 4), [512, 512, 4])
  fill(initialState, function (x, y, ch) {
    if (ch > 2) return 1
    return (Math.random() - 0.5) * 800.6125
  })

  var index = new Float32Array(512 * 512 * 2)
  var i = 0
  for (var x = 0; x < 512; x++) {
    for (var y = 0; y < 512; y++) {
      index[i++] = x / 512
      index[i++] = y / 512
    }
  }

  scene.on('init', function (time) {
    nextState = nextState || createFBO(gl, 512, 512, { float: true })
    prevState = prevState || createFBO(gl, 512, 512, { float: true })
    nextState.color[0].setPixels(initialState)
    prevState.color[0].setPixels(initialState)

    logicFrag = scene.shaders.logicFrag.on('change', updateShader)
    logicVert = scene.shaders.logicVert.on('change', updateShader)
    renderFrag = scene.shaders.renderFrag.on('change', updateShader)
    renderVert = scene.shaders.renderVert.on('change', updateShader)
    logic = Shader(gl, logicVert, logicFrag)
    render = Shader(gl, renderVert, renderFrag)

    screenVertices = createVAO(gl, [{
      type: gl.FLOAT,
      size: 2,
      buffer: screenBuffer = createBuffer(gl, new Float32Array([
        -1, -1, +1, -1, -1, +1,
        -1, +1, +1, -1, +1, +1
      ]))
    }])

    particleVertices = createVAO(gl, [{
      type: gl.FLOAT,
      size: 2,
      buffer: particleBuffer = createBuffer(gl, index)
    }])

    function updateShader () {
      if (logic) logic.update(logicVert, logicFrag)
      if (render) render.update(renderVert, renderFrag)
    }
  })

  scene.on('stop', function () {
    if (particleVertices) particleVertices.dispose()
    if (particleBuffer) particleBuffer.dispose()
    if (screenVertices) screenVertices.dispose()
    if (screenBuffer) screenBuffer.dispose()
    if (nextState) nextState.dispose()
    if (prevState) prevState.dispose()
    if (render) render.dispose()
    if (logic) logic.dispose()
    if (logicVert) logicVert.removeAllListeners()
    if (logicFrag) logicFrag.removeAllListeners()
    if (renderVert) renderVert.removeAllListeners()
    if (renderFrag) renderFrag.removeAllListeners()

    particleVertices =
    particleBuffer =
    screenBuffer =
    screenVertices =
    logic = render =
    logicFrag = renderFrag =
    logicVert = renderVert =
    nextState = prevState = null
  })

  scene.on('step', function (time) {
    if (!nextState) return

    // Switch to clean FBO for GPGPU
    // particle motion
    nextState.bind()
    gl.disable(gl.DEPTH_TEST)
    gl.viewport(0, 0, 512, 512)

    var shader = logic
    shader.bind()
    shader.uniforms.uState = prevState.color[0].bind(5)
    shader.uniforms.uTime = scene.time
    screenVertices.bind()
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // Reset, draw to screen
    scene.unbind()
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.disable(gl.DEPTH_TEST)
    gl.viewport(0, 0,
      resolution[0] = gl.drawingBufferWidth,
      resolution[1] = gl.drawingBufferHeight
    )

    var shader = render
    shader.bind()
    shader.uniforms.uState = nextState.color[0].bind(5)
    shader.uniforms.uScreen = [resolution[0], resolution[1]]

    particleVertices.bind()

    // Additive blending!
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.drawArrays(gl.POINTS, 0, 512 * 512)
    gl.disable(gl.BLEND)

    // Switch
    var tmp = prevState
    prevState = nextState
    nextState = tmp
  })

}
