const inherits = require('inherits')
const copy = require('shallow-copy')
const chokidar = require('chokidar')
const glslify = require('glslify')
const Emitter = require('events/')
const after = require('after')
const Path = require('path')
const raf = require('raf')
const fs = require('fs')

module.exports = SceneRenderer

const start = Date.now()
const SHIFT = 16

inherits(SceneRenderer, Emitter)
function SceneRenderer (gl, options) {
  if (!(this instanceof SceneRenderer)) {
    return new SceneRenderer(gl, options)
  }

  options = options || {}

  Emitter.call(this)
  this.current = null
  this.gl = gl
  this.gl.sceneCache = {}

  const interplay = this.interplay = options.interplay
  const location = (
    (options.left && KeyboardEvent.DOM_KEY_LOCATION_LEFT) ||
    (options.right && KeyboardEvent.DOM_KEY_LOCATION_RIGHT)
  )

  this.tick = this.tick.bind(this)
  this.tick()

  window.addEventListener('keydown', function (e) {
    if (e.keyCode !== SHIFT) return
    interplay.enabled = e.location === location
  }, false)

  window.addEventListener('keyup', function (e) {
    if (e.keyCode !== SHIFT) return
    interplay.enabled = true
  })
}

SceneRenderer.scenes = require('./package.json').scenes
SceneRenderer.prototype.tick = function tick () {
  raf(this.tick)
  if (!this.current) return
  this.current.emit('step', (Date.now() - start) / 1000)
}

SceneRenderer.prototype.use = function use (scene) {
  if (this.current) {
    this.current.disable()
  }

  this.interplay.clear()
  this.current = SceneWrapper(this.gl, scene, this.interplay)
  this.current.enable()

  return this
}

inherits(SceneWrapper, Emitter)
function SceneWrapper (gl, name, interplay) {
  if (gl.sceneCache[name]) return gl.sceneCache[name]
  if (!(this instanceof SceneWrapper)) {
    return new SceneWrapper(gl, name, interplay)
  }

  Emitter.call(this)
  gl.sceneCache[name] = this


  const sceneLocation = Path.dirname(require.resolve(name + '/package.json'))
  const sceneShaders = this.shaders = {}
  const scenePkg = require(name + '/package.json')
  const basePkg = require(scenePkg.scene + '/package.json')
  const base = require(scenePkg.scene)
  const params = scenePkg.parameters

  this.parameters = interplay.values
  this.bootstrap = addParams.bind(this, interplay, params)

  const shaders = basePkg.shaders || {}
  const watcher = chokidar.watch([])
  const watched = {}
  const labels = Object.keys(shaders)
  const next = after(labels.length, done)
  const self = this

  self.enabled = false
  self.ready = false
  base(gl, self)

  function done (err) {
    if (err) throw err
    self.ready = true
    self.emit('ready', (Date.now() - start) / 1000)
  }

  labels.forEach(function (key) {
    const path = Path.resolve(sceneLocation, shaders[key])

    var shaderSource = null

    sceneShaders[key] = new Emitter
    sceneShaders[key].toJSON =
    sceneShaders[key].toString = function () {
      return shaderSource
    }

    addFile(path)
    watcher.on('change', function () {
      rebundle(false)
    })

    rebundle(true)
    function rebundle (initial) {
      glslify.bundle(path, {}, function (err, result, files) {
        if (err && initial) return next(err)
        if (err) throw err
        if (files) files.forEach(addFile)
        shaderSource = result
        sceneShaders[key].emit('change')
        if (initial) next()
      })
    }

    function addFile (file) {
      if (watched[file]) return
      watcher.add(file)
    }
  })
}

Object.defineProperty(SceneWrapper.prototype, 'time', {
  get: function () {
    return (Date.now() - start) / 1000
  }
})

SceneWrapper.prototype.enable = function () {
  if (this.enabled) return
  if (!this.ready) {
    return this.once('ready', this.enable.bind(this))
  }

  this.bootstrap()
  this.emit('init', (Date.now() - start) / 1000)
  this.enabled = true
}

SceneWrapper.prototype.disable = function () {
  if (!this.enabled) return
  this.emit('stop', (Date.now() - start) / 1000)
  this.enabled = false
}

const types = {
  range: require('interplay-range')
}

function addParams (interplay, params) {
  Object.keys(params).forEach(function (key) {
    const param = copy(params[key])
    const Type = types[param.type]

    delete param.type

    interplay.add(key, Type, param)
  })
}
