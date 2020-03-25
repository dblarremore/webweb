import * as d3 from 'd3'
import * as svgUtils from './svg_utils'

export class Node {
  constructor(idx) {
    this.idx = idx
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
}
