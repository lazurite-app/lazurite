const inherits = require('inherits')
const chokidar = require('chokidar')
const glslify = require('glslify')
const Emitter = require('events/')
const after = require('after')
const Path = require('path')
const raf = require('raf')
const fs = require('fs')

module.exports = SceneRenderer

const start = Date.now()

inherits(SceneRenderer, Emitter)
function SceneRenderer (gl) {
  if (!(this instanceof SceneRenderer)) {
    return new SceneRenderer(gl)
  }

  Emitter.call(this)
  this.current = null
  this.tick = this.tick.bind(this)
  this.tick()
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

  this.current = SceneWrapper(gl, scene)
  this.current.enable()

  return this
}

const sceneCache = {}

inherits(SceneWrapper, Emitter)
function SceneWrapper (gl, name) {
  if (sceneCache[name]) return sceneCache[name]
  if (!(this instanceof SceneWrapper)) {
    return new SceneWrapper(gl, name)
  }

  Emitter.call(this)
  sceneCache[name] = this

  const sceneLocation = Path.dirname(require.resolve(name + '/package.json'))
  const sceneShaders = this.shaders = {}
  const scenePkg = require(name + '/package.json')
  const basePkg = require(scenePkg.scene + '/package.json')
  const base = require(scenePkg.scene)

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

  this.emit('init', (Date.now() - start) / 1000)
  this.enabled = true
}

SceneWrapper.prototype.disable = function () {
  if (!this.enabled) return
  this.emit('stop', (Date.now() - start) / 1000)
  this.enabled = false
}

const canvas = document.body.appendChild(document.createElement('canvas'))
const gl = canvas.getContext('webgl')

canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.position = 'absolute'
canvas.style.left = 0
canvas.style.top = 0

SceneRenderer(gl)
  .use('scene-blob')
