import * as d3 from 'd3'

import { Text } from './text'
import { Node } from './node'

export class Sublegend {
  get FONT_SIZE() { return "12px" }
  get JUSTIFY_UNIT() { return 5 }
  get MARGIN_TOP() { return 3 * this.JUSTIFY_UNIT }

  constructor(attribute, r, scales) {
    this.attribute = attribute
    this.r = r
    this.scales = scales
    this.shouldDraw = this.attribute.key !== 'none' && this.attribute.key !== 'color'
  }

  get R() { return this._R }
  set R(R) { this._R = R }

  get pushdownState() {
    return this._pushdownState
  }

  set pushdownState(pushdownState) {
    this._pushdownState = pushdownState
  }

  pushdown(i) {
    let pushdown = this.pushdownState
    if (i !== undefined) {
      pushdown += 2.3 * this.R
      this.pushdownState = pushdown
    }
    return pushdown
  }

  getNodeAndTextObjects(initialPushdown) {
    if (initialPushdown === undefined || isNaN(initialPushdown)) {
      initialPushdown = 0
    }
    initialPushdown += this.MARGIN_TOP
    this.pushdownState = initialPushdown
    
    let objects = {
      'nodes': [],
      'text': [
        this.getLegendTitleText(this.attribute.key)
      ],
    }

    let nodePushRight = Math.max(this.R, this.JUSTIFY_UNIT) + this.JUSTIFY_UNIT
    let textPushRight = 2 * nodePushRight

    let nodes = this.attribute.getLegendNodes(this.attribute.values)

    for (let [i, node] of Object.entries(nodes)) {
      let pushdown = this.pushdown(i)

      objects.text.push(new Text(node.__text, textPushRight, pushdown + 2.5, this.FONTSIZE))

      node.nonInteractive = true
      node.x = nodePushRight
      node.y = pushdown
      node.fixedRadius = (this.attribute.getNodeNumericalValue(node) || 1) * this.r
      node.__scaledColor = this.attribute.getNodeColorValue(node)

      objects.nodes.push(node)
    }

    return objects
  }

  getLegendTitleText(text) {
    let textObject = new Text(text, this.JUSTIFY_UNIT, this.pushdown(), this.FONTSIZE)
    this.pushdown_state += this.JUSTIFY_UNIT + this.R

    return textObject
  }
}

export class SizeSublegend extends Sublegend {
  constructor(attribute, r, scales) {
    super(attribute, r, nodes, scales)
    this.R = this.r * scales.nodeSize.range()[1]
  }
}
export class ColorSublegend extends Sublegend {
  pushdown(i) {
    let pushdown = this.pushdownState
    if (i !== undefined) {
      if (this.sizeLegendShown) {
        pushdown += 2.3 * Math.max(this.R, 7.5)
        this.pushdownState = pushdown
      }
      else {
        pushdown += 3.3 * this.r
        this.pushdownState = pushdown
      }
    }
    return pushdown
  }
}

////////////////////////////////////////////////////////////////////////////////
// draw legend(s) for size and color
// 
// If size and color are tied to the same attribute, make one legend
// Otherwise, keep em separate
//
// prefer integer boundaries in our legends... but only if the values that are
// getting passed in are integers... etc. (etc... etc...)
//
// steps through what we think of as standard human preference.
////////////////////////////////////////////////////////////////////////////////
export class Legend {
  constructor(sizingBy, sizeAttribute, coloringBy, colorAttribute, r, nodes, scales) {
    this.sizingBy = sizingBy
    this.sizeAttribute = sizeAttribute
    this.coloringBy = coloringBy
    this.colorAttribute = colorAttribute
    this.r = r
    this.scales = scales

    this.sizeSub = new SizeSublegend(this.sizeAttribute, this.r, this.scales)
    this.colorSub = new ColorSublegend(this.colorAttribute, this.r, this.scales)
    this.colorSub.R = this.sizeSub.R

    if (this.sizeSub.shouldDraw == false && this.colorSub.shouldDraw == false) {
      return
    }

    if (this.sizingBy == this.coloringBy) {
      this.colorSub.shouldDraw = false
    }
    
    this.colorSub.sizeLegendShown = this.sizeSub.shouldDraw
  }

  getObjectsToDraw(showLegend) {
    if (showLegend == false) {
      return []
    }

    let pushdown = 0

    let sizeSubObjects = this.sizeSub.getNodeAndTextObjects()

    pushdown += this.sizeSub.shouldDraw
      ? this.sizeSub.pushdown(sizeSubObjects.text.length + 1)
      : 0

    let colorSubObjects = this.colorSub.getNodeAndTextObjects(pushdown)

    let nodes = []
    let text = []
    if (this.sizeSub.shouldDraw) {
      // set the node colors to the computed ones
      if (this.sizingBy == this.coloringBy) {
        for (let [i, sizeNode] of Object.entries(sizeSubObjects.nodes)) {
          let colorNode = colorSubObjects.nodes[i]
          sizeNode.__scaledColor = colorNode.__scaledColor
        }
      }

      nodes = nodes.concat(sizeSubObjects.nodes)
      text = text.concat(sizeSubObjects.text)
    }

    if (this.colorSub.shouldDraw) {
      nodes = nodes.concat(colorSubObjects.nodes)
      text = text.concat(colorSubObjects.text)
    }

    return nodes.concat(text)
  }
}
