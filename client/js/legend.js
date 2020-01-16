import * as d3 from 'd3'

import { Text } from './text'
import { Node } from './node'

export class Sublegend {
  get FONT_SIZE() { return "12px" }
  get JUSTIFY_UNIT() { return 5 }
  get MARGIN_TOP() { return 3 * this.JUSTIFY_UNIT }

  constructor(attributeKey, attribute, r, nodes, scales) {
    this.attributeKey = attributeKey
    this.attribute = attribute
    this.r = r
    this.nodes = nodes
    this.scales = scales

    let map = this.getValuesAndText(nodes)
    this.values = map.values
    this.text = map.text
    this.colorFunction = this.defaultColorFunction
    this.sizeFunction = this.defaultSizeFunction
    this.shouldDraw = this.attributeKey !== 'none' && this.attributeKey !== 'color'
  }

  get valueKey() {
    return undefined
  }

  get rawValueKey() {
    return undefined
  }

  get defaultSizeFunction() {
    return ([i, x]) => this.r
  }

  get defaultColorFunction() {
    return ([i, x]) => x
  }

  get R() { return this._R }
  set R(R) { this._R = R }

  get shouldDraw() {
    return this._shouldDraw
  }

  set shouldDraw(shouldDraw) {
    this._shouldDraw = shouldDraw
  }

  get colorFunction() {
    return this._colorFunction
  }

  set colorFunction(colorFunction) {
    this._colorFunction = colorFunction
  }

  getValuesAndText(nodes) {
    const rawValueKey = this.rawValueKey
    const valueKey = this.valueKey
    return this.attribute.getLegendValuesAndText(
      nodes.map(node => node[rawValueKey]),
      nodes.map(node => node[valueKey]),
    )
  }

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
    if (initialPushdown == undefined || isNaN(initialPushdown)) {
      initialPushdown = 0
    }
    initialPushdown += this.MARGIN_TOP
    this.pushdownState = initialPushdown
    
    let objects = {
      'nodes': [],
      'text': [
        this.getLegendTitleText(this.attributeKey)
      ],
    }

    let nodePushRight = Math.max(this.R, this.JUSTIFY_UNIT) + this.JUSTIFY_UNIT
    let textPushRight = 2 * nodePushRight

    for (let [i, value] of Object.entries(this.values)) {
      // only draw text for as many values as there are
      if (i < this.values.length && i < this.text.length) {
        let pushdown = this.pushdown(i)
        let text = this.text[i]

        objects.text.push(new Text(text, textPushRight, pushdown + 2.5, this.FONTSIZE))


        let node = new Node(-1)
        node.nonInteractive = true
        node.fixedRadius = value * this.r
        node.x = nodePushRight
        node.y = pushdown

        if (isNaN(value)) {
          node.__scaledColor = value
        }
        else {
          node.__scaledColor = this.colorFunction(value)
        }

        objects.nodes.push(node)
      }
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
  static TYPE = 'size'

  get valueKey() {
    return '__scaledSize'
  }

  get rawValueKey() {
    return '__rawSize'
  }

  get defaultColorFunction() {
    return () => d3.rgb(128, 128, 128)
  }

  constructor(attributeKey, attribute, r, nodes, scales) {
    super(attributeKey, attribute, r, nodes, scales)
    this.R = this.r * scales.nodeSize.range()[1]
  }

  get defaultSizeFunction() {
    const scale = this.scales[this.attribute.sizeScale]
    return ([i, value]) => scale(value)
  }
}
export class ColorSublegend extends Sublegend {
  static TYPE = 'color'

  get valueKey() {
    return '__scaledColor'
  }

  get rawValueKey() {
    return '__rawColor'
  }

  get defaultColorFunction() {
    const scale = this.scales[this.attribute.colorScale]
    return ([i, value]) => scale(value)
  }
  
  pushdown(i) {
    let pushdown = this.pushdownState
    if (i !== undefined) {
      if (this.sizeLegendShown) {
        pushdown += 2.3 * Math.max(this.R, 7.5)
        this.pushdownState = pushdown
        // pushdown += 3 * this.r
      }
      else {
        pushdown += 3.3 * this.r
        this.pushdownState = pushdown
      }
    }
    return pushdown
  }
}

export class Legend {
  constructor(sizingBy, sizeAttribute, coloringBy, colorAttribute, r, nodes, scales) {
    this.sizingBy = sizingBy
    this.sizeAttribute = sizeAttribute
    this.coloringBy = coloringBy
    this.colorAttribute = colorAttribute
    this.r = r
    this.nodes = nodes
    this.scales = scales

    this.sizeSub = new SizeSublegend(this.sizingBy, this.sizeAttribute, this.r, this.nodes, this.scales)
    this.colorSub = new ColorSublegend(this.coloringBy, this.colorAttribute, this.r, this.nodes, this.scales)
    this.colorSub.R = this.sizeSub.R

    if (this.sizeSub.shouldDraw == false && this.colorSub.shouldDraw == false) {
      return
    }

    if (this.sizingBy == this.coloringBy) {
      this.colorSub.shouldDraw = false
    }
    
    this.colorSub.sizeLegendShown = this.sizeSub.shouldDraw
  }

  get legendNodeAndText() {
    let pushdown = 0

    let sizeSubObjects = this.sizeSub.getNodeAndTextObjects()

    pushdown += this.sizeSub.shouldDraw
      ? this.sizeSub.pushdown(sizeSubObjects.text.length + 1)
      : 0

    let colorSubObjects = this.colorSub.getNodeAndTextObjects(pushdown)

    let objects = {
      'nodes': [],
      'text': [],
    }

    if (this.sizeSub.shouldDraw) {
      // set the node colors to the computed ones
      if (this.sizingBy == this.coloringBy) {
        for (let [i, sizeNode] of Object.entries(sizeSubObjects.nodes)) {
          let colorNode = colorSubObjects.nodes[i]
          sizeNode.__scaledColor = colorNode.__scaledColor
        }
      }

      objects.nodes = objects.nodes.concat(sizeSubObjects.nodes)
      objects.text = objects.text.concat(sizeSubObjects.text)
    }

    if (this.colorSub.shouldDraw) {
      objects.nodes = objects.nodes.concat(colorSubObjects.nodes)
      objects.text = objects.text.concat(colorSubObjects.text)
    }

    return objects
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
}

function allInts(vals) {
    for (var i in vals) {
        if (!isInt(vals[i])) {
            return false;
        }
    }

    return true;
}
