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
}

export class Circle extends Shape {
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
    context.strokeStyle = this.outline
    context.stroke()
    context.fillStyle = this.color
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
  constructor(x1, y1, x2, y2, width, opacity, color) {
    super()
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.width = width
    this.opacity = opacity
    this.color = color
  }

  translate(x, y) {
    this.x1 += x
    this.y1 += y
    this.x2 += x
    this.y2 += y
  }

  draw(context) {
    context.save()
    context.globalAlpha = this.opacity
    context.beginPath()
    context.moveTo(this.x1, this.y1)
    context.lineTo(this.x2, this.y2)
    context.lineWidth = this.width
    context.strokeStyle = this.color
    context.stroke()
    context.restore()
  }

  get svg() {
    return svgUtils.drawLine(
      this.target.x, this.target.y, this.source.x, this.source.y,
      this.color, this.opacity, this.width
    )
  }
}

export class Text extends Shape {
  constructor(value, x, y, font='12px', rotation=0, align='left') {
    super()
    this.value = value
    this.x = x
    this.y = y
    this.font = font
    this.rotation = rotation
    this.align = align
  }

  draw(context) {
    context.save()
    context.fillStyle = "black"
    context.font = this.font
    context.translate(this.x, this.y)
    context.rotate(this.rotation)
    context.textAlign = this.align
    context.textBaseline = 'middle'
    context.fillText(this.value, 0, 0)
    context.restore()
  }

  get svg() {
    // rotation is currently in radians, which isn't how it's expected to be
    // also currently doesn't deal with textAlign
    return svgUtils.drawText(this.value, x, y, this.font, this.rotation)
  }
}

export class Path extends Shape {
  get pathSamples() { return 200 }

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
    context.fillStyle = this.color
    context.strokeStyle = this.outline
    context.globalAlpha = this.opacity
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
