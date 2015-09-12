import cssnext from 'cssnext'
import vel from 'vel'

const path = require('path')
const fs = require('fs')
const css = cssnext(fs.readFileSync(
  path.join(__dirname, 'index.css')
, 'utf8'))

const style = document.createElement('style')
style.innerHTML = css
document.body.appendChild(style)

export default class LzColumn extends window.HTMLElement {
  createdCallback () {
    this.columns = this.getColumns()
    this.observer = new window.MutationObserver(_ => {
      this.columns = this.getColumns()
    })

    this.observer.observe(this, {
      childList: true
    })
  }

  attachedCallback () {
    this.loadColumns()

    this.addEventListener('scale-mousedown', mousedown, true)
    this.addEventListener('scale-mousemove', mousemove, true)
    this.addEventListener('scale-mouseup', mouseup, true)

    var mouseX
    var widths
    var grows
    var right
    var left

    function mousedown (e) {
      var idx = this.columns.indexOf(e.target)
      if (idx === -1) return
      if (idx === this.columns.length - 1) return

      left = idx
      right = idx + 1
      grows = this.columns.slice(left, right + 1).map(
        column => Number(column.style.flexGrow = column.style.flexGrow || 1)
      ).reduce((memo, sum) => memo + sum, 0)

      const bounds = [
        this.columns[left].getBoundingClientRect(),
        this.columns[right].getBoundingClientRect()
      ]

      mouseX = e.clientX
      widths = bounds.map(bound => bound.width)
      widths.push(bounds[1].left - bounds[0].left + bounds[1].width)
    }

    function mousemove (e) {
      const offset = e.clientX - mouseX

      var ratio1 = Math.min(0.9, Math.max(0.1, (widths[0] + offset) / widths[2]))
      var ratio2 = 1 - ratio1

      this.columns[left].style.flexGrow = grows * ratio1
      this.columns[right].style.flexGrow = grows * ratio2
    }

    function mouseup () {
      const store = this.getAttribute('store')
      if (!store) return

      const key = `lz-dashboard:widths:${key}`
      const grows = this.columns.map(column => (
        Number(column.style.flexGrow || 1)
      ))

      window.localStorage.setItem(key, JSON.stringify(grows))
    }
  }

  detachedCallback () {
  }

  getColumns () {
    var columns = []

    for (var i = 0; i < this.childNodes.length; i++) {
      var child = this.childNodes[i]
      if (child.nodeName === 'LZ-COLUMN') {
        columns.push(child)
      }
    }

    return columns
  }

  loadColumns () {
    const store = this.getAttribute('store')
    if (!store) return

    const key = `lz-dashboard:widths:${key}`

    try {
      var grows = JSON.parse(window.localStorage.getItem(key))
    } catch (e) {
      return
    }

    for (var i = 0; i < grows.length && i < this.columns.length; i++) {
      this.columns[i].style.flexGrow = grows[i]
    }
  }
}
