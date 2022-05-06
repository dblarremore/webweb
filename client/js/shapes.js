import * as svgUtils from './svg_utils'
import * as d3 from 'd3'

export function getClassForInstanceOfClass(instance) {
  const prototypeToClass = {
    'Circle': Circle,
    'Path': Path,
    'Rectangle': Rectangle,
    'Line': Line,
    'Text': Text,
  }

  const instanceClassName = Object.getPrototypeOf(instance).constructor.name

  const instanceClass = prototypeToClass[instanceClassName]

  return instanceClass

}

class Shape {
  translate(x, y) {
    this.x += x
    this.y += y
    this.makePath()
  }

  makePath() { return }

  write(context) { return }

  get drawProperties() { return [] }
  
  get stringifiedDrawProperties() {
    let string = ""
    for (let property of this.drawProperties.sort()) {
      if (this[property] !== undefined) {
        if (string.length) {
          string += '-'
        }

        string += this[property].toString()
      }
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

  static get constructorArgs() { return ['x', 'y', 'radius', 'outline', 'color', 'zorder'] }

  constructor(x, y, radius, outline, color, zorder) {
    super()
    this.x = x
    this.y = y
    this.radius = radius
    this.outline = outline
    this.color = color
    this.zorder = zorder || 1
    this.makePath()
  }

  makePath() {
    this.path = new Path2D()
    this.path.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
  }

  get svg() {
    return svgUtils.drawCircle(this.x, this.y, this.radius, this.outline, this.color)
  }
}

export class Line extends Shape {
  get drawProperties() { return ['outline', 'width', 'opacity'] }

  static get constructorArgs() { return ['x1', 'y1', 'x2', 'y2', 'width', 'opacity', 'color', 'zorder'] }

  constructor(x1, y1, x2, y2, width, opacity, color, zorder) {
    super()
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.width = width
    this.opacity = opacity
    this.outline = color
    this.zorder = zorder || 1
    this.makePath()
  }

  makePath() {
    this.path = new Path2D()
    this.path.moveTo(this.x1, this.y1)
    this.path.lineTo(this.x2, this.y2)
  }

  translate(x, y) {
    this.x1 += x
    this.y1 += y
    this.x2 += x
    this.y2 += y
    this.makePath()
  }

  get svg() {
    return svgUtils.drawLine(
      this.target.x, this.target.y, this.source.x, this.source.y,
      this.color, this.opacity, this.width
    )
  }
}

export class Rectangle extends Shape {
  get drawProperties() { return ['outline', 'color', 'opacity'] }

  static get constructorArgs() { return ['x', 'y', 'width', 'height', 'opacity', 'color', 'outline', 'zorder'] }

  constructor(x, y, width, height, opacity, color, outline, zorder) {
    super()
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.opacity = opacity
    this.color = color
    this.outline = outline
    this.zorder = zorder || 1
    this.makePath()
  }

  makePath() {
    this.path = new Path2D()
    this.path.moveTo(this.x, this.y)
    this.path.rect(this.x, this.y, this.width, this.height)
  }

  get x2() {
    return this.x + this.width
  }

  get y2() {
    return this.y + this.height
  }

  get svg() {
    console.log('not implemented yet')
    // return svgUtils.drawLine(
    //   this.target.x, this.target.y, this.source.x, this.source.y,
    //   this.color, this.opacity, this.width
    // )
  }
}

export class Text extends Shape {
  get drawProperties() { return ['color', 'font', 'rotate'] }

  static get constructorArgs() {
    return ['value', 'x', 'y', 'font', 'align', 'color', 'rotate', 'baseline', 'zorder']
  }

  constructor(value, x, y, font='12px', align='left', color='black', rotate=0, baseline='middle', zorder=-1) {
    super()
    this.value = value
    this.color = color
    this.x = x
    this.y = y
    this.font = font
    this.rotate = rotate
    this.textBaseline = baseline
    this.zorder = zorder || -1
  }

  write(context) {
    if (this.textAlign === undefined) {
      context.textAlign = this.x < 0 ? 'right' : 'left'
    }
    else {
      context.textAlign = this.textAlign
    }
    
    if (this.textBaseline === undefined) {
      context.textBaseline = this.y < 0 ? 'bottom' : 'top'
    }
    else {
      context.textBaseline = this.textBaseline
    }

    context.font = this.font + ' Arial'

    if (this.rotate) {
      context.save()
      context.translate(this.x, this.y)
      context.rotate(this.rotate)
      this.writeOverMultipleLines(context, 0, 0)
      context.restore()
    }
    else {
      this.writeOverMultipleLines(context, this.x, this.y)
    }
  }

  writeOverMultipleLines(context, x, y) {
    const segments = this.value.split('\n')

    Object.entries(segments).forEach(([i, segment]) => {
      context.fillText(segment, x, y + (i * parseInt(this.font.replace('px', ''))))
    })
  }

  get svg() {
    return svgUtils.drawText(this.value, x, y, this.font)
  }
}

export class Path extends Shape {
  get pathSamples() { return 200 }
  get drawProperties() { return ['color', 'outline', 'opacity'] }

  static get constructorArgs() { return ['pathstring', 'color', 'opacity', 'outline', 'zorder'] }

  constructor(pathString, color, opacity, outline, zorder) {
    super()
    this.pathString = pathString
    this.color = color
    this.opacity = opacity
    this.outline = outline || d3.rgb(color).darker().hex()
    this.zorder = zorder || 1

    this.makePath()
  }

  makePath() {
    this.path = new Path2D(this.pathString)
  }

  get svg() {
    return svgUtils.drawPath(this.pathString, this.opacity, this.color, this.outline)
  }
}
