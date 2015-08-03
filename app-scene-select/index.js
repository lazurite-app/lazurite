import domify from 'domify'

const fs = require('fs')
const html = fs.readFileSync(__dirname + '/index.html', 'utf8')

export default class AppSceneSelect extends HTMLElement {
  createdCallback () {
    this.appendChild(domify(html))
  }
}
