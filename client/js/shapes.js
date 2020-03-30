import * as svgUtils from './svg_utils'
import * as d3 from 'd3'

class Shape {
  translate(x, y) {
    this.x += x
    this.y += y
  }

  containsPoint(x, y) {
    return false
  }

  get drawProperties() { return [] }
  
  get stringifiedDrawProperties() {
    let string = ""
    for (let property of this.drawProperties.sort()) {
      if (string.length) {
        string += '-'
      }
      string += this[property].toString()
    }
    return string
  }

  resetCanvasContextProperties(context) {
    const defaults = {
      'color': 'black',
      'outline': 'black',
      'width': 1,
      'opacity': 1,
      'font': '12px',
      'align': 'left',
      'textBaseline': 'middle',
    }
    for (let [key, value] of Object.entries(defaults)) {
      context[this.canvasPropertyAliases[key]] = value
    }
  }

  get canvasPropertyAliases() {
    return {
      'color': 'fillStyle',
      'outline': 'strokeStyle',
      'width': 'lineWidth',
      'opacity': 'globalAlpha',
      'font': 'font',
      'align': 'textAlign',
      'textBaseline': 'textBaseline'
    }
  }

  setCanvasContextProperties(context) {
    this.resetCanvasContextProperties(context)
    for (let property of this.drawProperties) {
      context[this.canvasPropertyAliases[property]] = this[property]
    }
  }
}

export class Circle extends Shape {
  get drawProperties() { return ['outline', 'color'] }

  constructor(x, y, radius, outline, color) {
    super()
    this.x = x
    this.y = y
    this.radius = radius
    this.outline = outline
    this.color = color
  }

  draw(context) {
    context.beginPath()
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    context.stroke()
    context.fill()
  }

  get svg() {
    return svgUtils.drawCircle(this.x, this.y, this.radius, this.outline, this.color)
  }

  containsPoint(x, y) {
    const radius = this.radius ? this.radius : 1
    return this.constructor.containsPoint(this.x, this.y, radius, x, y)
  }

  static containsPoint(x, y, radius, pointX, pointY) {
    if (
      x - radius <= pointX && pointX <= x + radius && 
      y - radius <= pointY && pointY <= y + radius
    ) {
      return true
    }

    return false
  }
}

export class Line extends Shape {
  get drawProperties() { return ['outline', 'width', 'opacity'] }

  constructor(x1, y1, x2, y2, width, opacity, color) {
    super()
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.width = width
    this.opacity = opacity
    this.outline = color
  }

  translate(x, y) {
    this.x1 += x
    this.y1 += y
    this.x2 += x
    this.y2 += y
  }

  draw(context) {
    context.beginPath()
    context.moveTo(this.x1, this.y1)
    context.lineTo(this.x2, this.y2)
    context.stroke()
  }

  get svg() {
    return svgUtils.drawLine(
      this.target.x, this.target.y, this.source.x, this.source.y,
      this.color, this.opacity, this.width
    )
  }
}

export class Text extends Shape {
  get drawProperties() { return ['color', 'font', 'align', 'textBaseline'] }

  constructor(value, x, y, font='12px', align='left', color='black') {
    super()
    this.value = value
    this.color = color
    this.x = x
    this.y = y
    this.font = font
    this.align = align
    this.textBaseline = 'middle'
  }

  draw(context) {
    context.fillText(this.value, this.x, this.y)
  }

  get svg() {
    return svgUtils.drawText(this.value, x, y, this.font)
  }
}

export class Path extends Shape {
  get pathSamples() { return 200 }
  get drawProperties() { return ['color', 'outline', 'opacity'] }
  constructor(path, color, opacity, outline) {
    super()
    this.path = path
    this.color = color
    this.opacity = opacity
    this.outline = outline || d3.rgb(color).darker().hex()
  }

  draw(context) {
    const path = new Path2D(this.path)
    context.beginPath()
    context.stroke(path)
    context.fill(path)
  }

  containsPoint(x, y) {
    return d3.polygonContains(this.points, [x, y])
  }

  get svg() {
    return svgUtils.drawPath(this.path, this.opacity, this.color, this.outline)
  }

  get points() {
    if (this._points === undefined) {
      this.setPoints()
    }

    return this._points
  }

  /*
   * This is very much a hack. Basically we sample along the path to get a
   * series of points to then do an inside/outside check later for mouse
   * presence
    * */
  setPoints() {
    const element = this.svg
    const totalLength = element.getTotalLength()
    this._points = []
    for (let i = 0; i < this.pathSamples; i++) {
      const length = (i / this.pathSamples) * totalLength
      const svgPoint = element.getPointAtLength(length)
      this._points.push([svgPoint.x, svgPoint.y])
    }
  }
}
