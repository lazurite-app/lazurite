import { extname } from 'path'

module.exports = require('fs').readdirSync(__dirname)
  .filter(filename => extname(filename) === '.glsl')
  .map(filename => filename.replace(/\.glsl$/, ''))
