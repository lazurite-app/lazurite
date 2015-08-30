import triangle from 'a-big-triangle'
import Shader from 'gl-shader'
import glslify from 'glslify'

module.exports = finalPass

const vert = `
precision mediump float;

attribute vec2 position;
varying vec2 vpos;

void main() {
  vpos = position;
  gl_Position = vec4(position, 1, 1);
}
`

const pfrag = `
precision mediump float;

uniform sampler2D from;
varying vec2 vpos;

void main() {
  gl_FragColor = texture2D(from, (vpos + 1.0) * 0.5);
}
`

function finalPass (gl) {
  var passthroughShader = Shader(gl, vert, pfrag)
  var opts = { transition: 'fade' }
  var transitionShader

  render.transition = setTransition

  update(opts, updateShaders)
  return render

  function setTransition (name) {
    opts.transition = name
    update(opts, updateShaders)
  }

  function update (opts, done) {
    const transition = require.resolve('app-transitions/' + (opts.transition || 'fade') + '.glsl')

    glslify.bundle(`
precision mediump float;

uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
uniform vec2 resolution;

#pragma glslify: transition = require(${transition})

void main() {
  gl_FragColor = transition(from, to, gl_FragCoord.xy, resolution, progress);
}

    `, {
      inline: true
    }, done)
  }

  function updateShaders (err, frag) {
    if (err) throw err
    if (transitionShader) {
      transitionShader.update(vert, frag)
    } else {
      transitionShader = Shader(gl, vert, frag)
    }
  }

  function render (frame1, frame2, progress) {
    if (!transitionShader) return

    const width = gl.drawingBufferWidth
    const height = gl.drawingBufferHeight

    if (progress < 0) progress = 0
    if (progress > 1) progress = 1
    if (progress === 0) {
      passthroughShader.bind()
      passthroughShader.uniforms.from = frame1.bind(0)
      triangle(gl)
    } else
    if (progress === 1) {
      passthroughShader.bind()
      passthroughShader.uniforms.from = frame2.bind(0)
      triangle(gl)
    } else {
      gl.viewport(0, 0, width, height)
      transitionShader.bind()
      transitionShader.uniforms.resolution = [width, height]
      transitionShader.uniforms.from = frame1.bind(0)
      transitionShader.uniforms.to = frame2.bind(1)
      transitionShader.uniforms.progress = progress
      triangle(gl)
    }
  }
}
