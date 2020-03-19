import * as d3 from 'd3'
import * as utils from './utils'
import { Node } from './node'

/********************************************************************************
 * Attribute object
 *
 * handles:
 * - in IO:
 *    - reading in of data in different formats
 *    - guessing what type attribute things are
 *    - transforming the input when "mapped categorical" type
 * -  on 'updateScales':
 *    - getting the raw and scaled values to color and size by
 *    - slapping them onto the nodes
********************************************************************************/
export class Attribute {
  get hslMaxValue() { return 330 }

  static get displays() { return ['color', 'size'] }

  static get TYPE() { return 'none' }

  static isType(nodeValues) { return false }

  get sizeScale() { return 'nodeSize' }

  get colorScale() { return 'none' }

  constructor(key, nodes, displayType) {
    this.key = key
    this.displayType = displayType

    this.nodes = {}
    this.values = []

    // this could get weird if it's all by reference, with multiple attributes
    for (let [i, node] of Object.entries(nodes)) {
      const value = this.transformValue(node[this.key])
      this.nodes[i] = value
      this.values.push(value)

    }
  }
  
  setScaledValueOfType(node, scales) {
    if (this.displayType === 'size') {
      node.__scaledSize = this.getScaledSizeValue(node, scales[this.sizeScale])
    }
    else if (this.displayType === 'color') {
      node.__scaledColor = this.getScaledColorValue(node, scales[this.colorScale])
    }
    
    return node
  }

  extent() {
    return [... new Set(this.values)]
  }

  extentSize() {
    return this.extent().length
  }

  /********************************************************************************
   * makes the input stuff nicer (eg, turns 0 into false for binary attributes)
  ********************************************************************************/
  transformValue(val) { return val }

  getRawColorValue(node) {
    return node[this.key]
  }

  // TODO:
  // THIS IS HOPEFUL!
  // by which I mean, the interface for other things to color stuff should be:
  // scaleValue
  scaleValue(value) {
    return 1
  }

  getScaledColorValue(node, scale) {
    return d3.hsl(210 * (1 - scale(this.getRawColorValue(node))), 0.7, 0.5)
  }

  getScaledSizeValue(node, scale) {
    return scale(node[this.key])
  }

  /********************************************************************************
   * Legend Functions
  ********************************************************************************/
  getLegendNodes(values, scales) {
    const valuesSet = [... new Set(values)].sort((a, b) => a - b)
    
    let nodes = []
    for (let text of valuesSet) {
      let node = new Node(-1)
      node.__text = text
      node[this.key] = text
      node = this.setScaledValueOfType(node, scales)
      nodes.push(node)
    }

    return nodes
  }

  get colorScales() {
    // there's no scale by default
    return []
  }

  get divergingColorScales() {
    return [
      "BuGn",
      "BuPu",
      "GnBu",
      "OrRd",
      "PuBuGn",
      "PuBu",
      "PuRd",
      "RdPu",
      "YlGnBu",
      "YlGn",
      "YlOrBr",
      "YlOrRd"
    ]
  }

  get singleHueColorScales() {
    return [
      "Blues",
      "Greens",
      "Greys",
      "Oranges",
      "Purples",
      "Reds"
    ]
  }

  get multiHueColorScales(){
    return [
      "Viridis",
      "Inferno",
      "Magma",
      "Plasma",
      "Warm",
      "Cool",
      "Rainbow",
      "CubehelixDefault",
    ]
  }

  get categoricalColorScales() {
    const scalesWithSizes = {
      "schemeAccent": 8,
      "schemeDark2": 8,
      "schemePastel2": 8,
      "schemeSet2": 8,
      "schemeSet1": 9,
      "schemePastel1": 9,
      "schemeCategory10": 10,
      "schemeSet3": 12,
      "schemePaired": 12,
      "schemeCategory20": 20,
      "schemeCategory20b": 20,
      "schemeCategory20c": 20
    }

    const scales = []
    for (const [scale, size] of scalesWithSizes.entries()) {
      if (size === 20) || (size > this.extentSize) {
        scales.push(scale)
      }
    }

    return scales
  }
}

export class NameAttribute extends Attribute {
  static get TYPE() { return 'name' }

  static get displays() { return [] }
}

export class ScalarAttribute extends Attribute {
  static get TYPE() { return 'scalar' }

  static isType(nodeValues) { return true }

  get colorScales() { return this.singleHueColorScales }

  get colorScale() { return 'scalarColors' }

  getLegendNodes(values, scales) {
    const valuesSet = [... new Set(values)]
    const bins = valuesSet.length < 5 ? valuesSet.length : 4

    if (bins === undefined || isNaN(bins)) {
      bins = 4
    }

    const [min, max] = [d3.min(values), d3.max(values)]
    const step = (max - min) / (bins - 1)

    let binValues = []
    for (let binValue = min; binValue < max; binValue += step) {
      binValues.push(utils.round(binValue, 10))
    }
    binValues.push(max)

    return super.getLegendNodes(binValues, scales)
  }
}

export class DegreeAttribute extends ScalarAttribute {
  static get TYPE() { return 'degree' }
}

export class BinaryAttribute extends Attribute {
  static get TYPE() { return 'binary' }

  get colorScales() { return this.multiHueColorScales }
  get colorScale() { return 'categoricalColors' }

  static get trueValues() { return [true, 'true', 1] }
  static get falseValues() { return [false, 'false', 0, undefined, null] }

  extent() { return [true, false] }

  transformValue(value) {
    return this.trueValues.includes(value)
  }

  static isType(nodeValues) {
    const validValues = this.trueValues.concat(this.falseValues)
    return [... new Set(nodeValues)].filter(
      (val) => val !== undefined && val !== null
    ).filter(
      (val) => ! validValues.includes(val)
    ).length == 0
  }

  getScaledColorValue(node, scale) {
    return scale(this.getRawColorValue(node))
  }

  getLegendNodes(values, scales) {
    let trueNode = new Node(-1)
    trueNode.__text = 'true'
    trueNode[this.key] = true
    trueNode = this.setScaledValueOfType(trueNode, scales)

    let falseNode = new Node(-1)
    falseNode.__text = 'false'
    falseNode[this.key] = false
    falseNode = this.setScaledValueOfType(falseNode, scales)
    return [
      falseNode,
      trueNode
    ]
  }
}

export class UserColorAttribute extends Attribute {
  static get TYPE() { return 'categorical' }

  get colorScales() {
    console.log('this is wrong here')
    return this.multiHueColorScales
  }
  static get displays () { return ['color'] }

  static isType(nodeValues) {
    const hexValues = Object.values(nodeValues).filter(
      (val) => typeof val === 'string' && val.length == 7 && val[0] == '#'
    )

    return hexValues !== undefined && hexValues.length == nodeValues.length
  }

  getScaledColorValue(node, scale) {
    return this.getRawColorValue(node)
  }
}

export class CategoricalAttribute extends Attribute {
  static get TYPE() { return 'categorical' }

  get scalarCategoricalBins() { return 9 }
  get colorScales() { return this.categoricalColorScales }

  static get displays () { return ['color'] }

  hslFromIndex(index) {
    return d3.hsl(0 + index * (this.hslMaxValue / this.scalarCategoricalBins), 0.7, 0.5)
  }

  getScaledColorValue(node, scale) {
    const raw = this.getRawColorValue(node)
    if (this.isScalarCategorical) {
      return this.hslFromIndex(raw)
    }
    
    return scale(raw)
  }

  extent() {
    if (this.isScalarCategorical) {
      return [0, this.extentSize() - 1]
    }
    return super.extent()
  }

  static isType(nodeValues) {
    return Object.values(nodeValues).filter((val) => val !== undefined).some(isNaN)
  }

  transformValue(nodeValue) {
    return this.isScalarCategorical && utils.isInt(nodeValue)
      ? this.extent()[categoryNumber]
      : nodeValue
  }

  get isScalarCategorical() {
    return this.extentSize() >= this.scalarCategoricalBins
  }

  get colorScale() {
    return this.isScalarCategorical
      ? 'scalarColors'
      : 'categoricalColors'
  }

  getRawColorValue(node) {
    if (this.isScalarCategorical) {
      return this.extent().indexOf(node[this.key])
    }
    else {
      return node[this.key]
    }
  }

  // make sure there's enough categories even if there aren't
  extentSize() {
    return super.extentSize() == 1
      ? 2
      : super.extentSize()
  }

  getLegendNodes(values, scales) {
    if (this.isScalarCategorical) {
      return this.scalarCategoricalLegendNodes(values)
    }

    return super.getLegendNodes(values, scales)
  }

  scalarCategoricalLegendNodes(values) {
    const [min, max] = [d3.min(values), d3.max(values)]
    const step = (max - min) / this.scalarCategoricalBins

    let legendValues = []
    for (let i = 0; i < this.scalarCategoricalBins - 1; i++) {
      const index = utils.rounddown(min + i * step, 10)
      let node = new Node(-1)
      node.__text = this.extent()[index]
      node[this.key] = node.__text
      node.__scaledcolor = this.hslfromindex(index)
      nodes.push(node)
    }
    
    let node = new Node(-1)
    node.__text = this.extent()[this.scalarCategoricalBins]
    node[this.key] = node.__text
    node.__scaledcolor = this.hslfromindex(this.scalarCategoricalBins)
    nodes.push(node)

    return nodes
  }
}
