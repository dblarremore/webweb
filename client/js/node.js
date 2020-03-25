import * as d3 from 'd3'
import * as svgUtils from './svg_utils'
import { Text } from './text'

export class Node {
  /********************************************************************************
   *
   *
   * static Methods
   *
   *
   ********************************************************************************/
  static filterMetadataKeys(obj) {
    return Object.keys(obj).filter((key) => this.isMetadataKey(key, obj), this)
  }

  static get nonMetadataKeys() {
    return [
      'degree',
      'strength',
      'fx',
      'fy',
      'idx',
      'index',
      'vx',
      'vy',
      'x',
      'y',
      'settings',
    ]
  }

  static isNonMetadataKey(key) {
    return this.nonMetadataKeys.indexOf(key) >= 0 ? true : false
  }

  static isMetadataKey(key, obj) {
    if (this.isNonMetadataKey(key)) {
      return false
    }

    if (obj !== undefined) {
      let attribute = obj[key];
      if (attribute !== undefined && {}.toString.call(attribute) !== '[object Function]') {
        return true
      }
    }
    else {
      return true
    }

    return false
  }

  /********************************************************************************
   *
   *
   * static Methods
   *
   *
   ********************************************************************************/
  constructor(idx, settings) {
    this.idx = idx
    this.settings = settings
  }

  resetMetadata() {
    Node.filterMetadataKeys(this).forEach((key) => {
      delete this[key]
    }, this)

    this.degree = 0
    this.strength = 0
  }

  get radius() {
    if (this.fixedRadius) {
      return this.fixedRadius
    }

    let radius = this.settings.radius * (this.__scaledSize || 1)
    if (this.matchesString || this.containsMouse) {
      radius *= 1.3;
    }

    return radius
  }

  get outline() {
    if (this.matchesString || this.containsMouse) {
      return "black"
    }
    else {
      return d3.rgb(255, 255, 255)
    }
  }

  get nodeText() {
    let radius = this.radius
    if (this.nonInteractive) {
      return
    }

    const text = this.name || this.idx
    const textX = this.x + 1.1 * radius
    const textY = this.y - 1.1 * radius
    const font = "12px"
    return new Text(text, textX, textY, font)
  }

  draw(ctx) {
    this.staticDraw(this.x, this.y, this.radius, this.outline, d3.rgb(this.__scaledColor || 0), ctx)
  }

  drawSVG() {
    return svgUtils.drawCircleSVG(this.x, this.y, this.radius, this.outline, this.__scaledColor)
  }

  static staticDraw(x, y, radius, outline, color, ctx) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2, false)
    ctx.strokeStyle = outline
    ctx.stroke()
    ctx.fillStyle = d3.rgb(color || 0)
    ctx.fill()
  }
}
