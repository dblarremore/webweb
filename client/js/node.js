import * as d3 from 'd3'
import { Text } from './text'

export class NodeKey {
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
      'nodeKeyer',
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

  static filterMetadataKeys(keys, obj) {
    return keys.filter((key) => this.isMetadataKey(key, obj), this)
  }
}


export class Node {
  constructor(idx, settings) {
    this.idx = idx
    this.settings = settings
  }

  setMetadata(metadata) {
    for (let [key, value] of Object.entries(metadata)) {
      this.key = value
    }
  }

  resetMetadata() {
    NodeKey.filterMetadataKeys(Object.keys(this), this).forEach((key) => {
      delete this[key]
    }, this)

    this.degree = 0
    this.strength = 0
  }

  get radius() {
    if (this.fixedRadius) {
      return this.fixedRadius
    }

    let radius = this.__scaledSize * this.settings.r || this.settings.r
    if (this.matchesString() || this.containsMouse(radius)) {
      radius *= 1.3;
    }

    return radius
  }

  matchesString() {
    let matchString = this.settings.nameToMatch
    if (matchString !== undefined && matchString.length > 0) {
        if (this.name !== undefined && this.name.indexOf(matchString) >= 0) {
            return true
        }
    }
    
    return false
  }

  containsMouse(radius, mouseState) {
    if (mouseState == undefined) {
        return false
    }

    // recursion...
    if (radius == undefined) {
      radius = 1.3 * this.radius
    }

    if (
      this.x + radius >= mouseState.x &&
      this.x - radius <= mouseState.x &&
      this.y + radius >= mouseState.y &&
      this.y - radius <= mouseState.y
    ) {
      return true
    }

    return false
  }

  get outline() {
    if (this.matchesString() || this.containsMouse()) {
      return "black"
    }
    else {
      return d3.rgb(255, 255, 255)
    }
  }

  get nodeText() {
    let radius = this.radius
    if (! this.nonInteractive) {
      if (this.matchesString() || this.settings.showNodeNames || this.containsMouse(radius)) {
        if (this.simulation.alpha() < .05 || this.display.freezeNodeMovement) {
          let text = this.name || this.idx
          let textX = this.x + 1.1 * radius
          let textY = this.y - 1.1 * radius
          let font = "12px"
          return new Text(text, textX, textY, font)
        }
      }
    }
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.strokeStyle = this.outline
    // ctx.strokeStyle = d3.rgb(0, 0, 0)
    ctx.stroke()
    ctx.fillStyle = d3.rgb(this.__scaledColor || 0)
    // ctx.fillStyle = d3.rgb(0, 0, 0)
    ctx.fill()
  }
  drawSVG() {
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttributeNS(null, 'cx', this.x)
    circle.setAttributeNS(null, 'cy', this.y)
    circle.setAttributeNS(null, 'r', this.radius)
    circle.setAttributeNS(null, 'style', 'fill: ' + d3.rgb(this.__scaledColor) + '; stroke: ' + this.outline() + ';' )

    return circle
  }
}

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}
