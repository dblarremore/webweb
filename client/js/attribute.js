import * as utils from './utils'
import { Node } from './node'
import * as d3 from 'd3'
import * as coloror from './coloror'

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
  get defaultColor() { return d3.rgb(128, 128, 128) }
  get colororClass() { return coloror.MultiHueColoror }

  static get displays() { return ['color', 'size'] }
  static isType(nodeValues) { return false }

  constructor(key, nodes, displayType) {
    this.key = key
    this.displayType = displayType

    this.values = []

    if (nodes !== undefined) {
      this.values = Object.values(nodes).map(node => this.transformValue(node[this.key]))
    }

    // we'd later like to pass through the palette here
    this.coloror = new this.colororClass()

    this.setScale()
  }
  
  get valuesSet() {
    let valuesSet = [... new Set(this.values)]
    if (utils.allNumbers(valuesSet)) {
      valuesSet = valuesSet.sort((a, b) => a - b)
    }

    return valuesSet
  }

  get extent() {
    let extent = this.valuesSet

    if (extent.length == 1) {
      if (! extent.includes(0)) {
        extent = [0] + extent
      }
      else {
        extent.push(1)
      }
    }

    return [Math.min(...extent), Math.max(...extent)]
  }

  transformValue(value) {
    return value
  }

  getNodeNumericalValue(node) {
    return this.getNumericalValue(node[this.key])
  }

  getNumericalValue(value) {
    return value
  }

  getNodeColorValue(node) {
    return this.getColorValue(node[this.key])
  }

  getColorValue(value) {
    return d3.rgb(this.coloror.color(this.scale(value)))
  }

  setScale() { return }

  setScaleRange(range) {
    if ((this.scale !== undefined) && (this.scale.range !== undefined)) {
      this.scale.range(range)
    }
  }

  /********************************************************************************
   * Legend Functions
  ********************************************************************************/
  getLegendNodes(values) {
    const valuesSet = [... new Set(values)].sort((a, b) => a - b)
    
    let nodes = []
    for (let text of valuesSet) {
      let node = new Node(-1)
      node.__text = text
      node[this.key] = text
      node = this.setScaledValueOfType(node)
      nodes.push(node)
    }

    return nodes
  }

  setScaledValueOfType(node) {
    if (this.displayType === 'size') {
      node.__scaledSize = this.getNodeNumericalValue(node)
    }
    else if (this.displayType === 'color') {
      node.__scaledSize = this.getNodeColorValue(node)
    }
    
    return node
  }
}

export class NoneAttribute extends Attribute {
  static get displays() { return [] }

  get colororClass() { return coloror.NoneColoror }

  setScale() { this.scale = x => x }
}

export class ScalarAttribute extends Attribute {
  static get displays() { return ['color', 'size'] }

  static isType() { return true }

  get colororClass() { return coloror.SingleHueColoror }

  setScale() {
    this.scale = d3.scaleLinear()
    this.scale.domain(this.extent)
    this.scale.range([0, 1])
  }

  getLegendNodes(values) {
    const valuesSet = this.valuesSet
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

    return super.getLegendNodes(binValues)
  }
}

export class DivergingScalarAttribute extends ScalarAttribute {
  get colororClass() { return coloror.DiveringColoror }
}

export class BinaryAttribute extends Attribute {
  get colororClass() { return coloror.DiveringColoror }

  static get trueValues() { return [true, 'true', 1] }
  static get falseValues() { return [false, 'false', 0, undefined, null] }

  get extent() { return [true, false] }

  setScale() {
    this.scale = d3.scaleLinear()
    this.scale.domain(this.extent)
    this.scale.range([0, 1])
  }

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

  getLegendNodes() {
    let trueNode = new Node(-1)
    trueNode.__text = 'true'
    trueNode[this.key] = true
    trueNode = this.setScaledValueOfType(trueNode)

    let falseNode = new Node(-1)
    falseNode.__text = 'false'
    falseNode[this.key] = false
    falseNode = this.setScaledValueOfType(falseNode)

    return [
      falseNode,
      trueNode
    ]
  }
}

export class UserColorAttribute extends Attribute {
  static get NAME() { return 'color' }
  get colororClass() { return coloror.NoneColoror }

  static get displays () { return ['color'] }

  static isType(nodeValues) {
    const hexValues = Object.values(nodeValues).filter(
      (val) => typeof val === 'string' && val.length == 7 && val[0] == '#'
    )

    return hexValues !== undefined && hexValues.length == nodeValues.length
  }

  getNodeColorValue(node) {
    return node['color']
  }

  getColorValue(value) {
    return value
  }
}

export class CategoricalAttribute extends Attribute {
  static get displays () { return ['color'] }
  get colororClass() { return coloror.CategoricalColoror }

  get colorScales() {
    console.log('this doesnt work')
    let scalesWithSizes = this.constructor.categoricalScalesWithSizes

    const scales = []
    for (const [scale, size] of scalesWithSizes.entries()) {
      if ((size === 20) || (size > this.valuesSet.length)) {
        scales.push(scale)
      }
    }

    return scales
  }

  static isType(nodeValues) {
    return Object.values(nodeValues).filter((val) => val !== undefined).some(isNaN)
  }

  getColorValue(value) {
    // TODO: STILL TRUE console.log('this is almost certainly not an index right now, but could be?')
    return this.scale(this.valuesSet.indexOf(value))
  }

  // make sure there's enough categories even if there aren't
  // get uniqueCount() {
  //   return Math.max(...[super.uniqueCount, 2])
  // }
}


export class ScalarCategoricalAttribute extends Attribute {
  static get NAME() { return 'categorical' }
  static get displays () { return ['color'] }

  get colororClass() { return coloror.CyclicalColoror }

  get scalarCategoricalBins() { return 9 }

  static isType(values) {
    const isCategorical = CategoricalAttribute.isType(values)
    const valueCount = [... new Set(this.values)].length

    return isCategorical && valueCount > this.scalarCategoricalBins
  }

  setScale(colorPalette) {
    this.scale = d3.scaleLinear()
    this.scale.domain(this.extent).range([0, 1])
  }

  getColorValue(value) {
    const colorValue = this.extent.indexOf(value)
    return this.coloror.color(this.scale(colorValue))
  }

  get extent() {
    return [0, this.valuesSet.length - 1]
  }

  transformValue(value) {
    return utils.isInt(value) ? this.extent[value] : value
  }

  getLegendNodes() {
    const [min, max] = this.extent
    const step = (max - min) / this.scalarCategoricalBins

    let legendValues = []
    for (let i = 0; i < this.scalarCategoricalBins - 1; i++) {
      const index = utils.rounddown(min + i * step, 10)
      let node = new Node(-1)
      node.__text = this.extent[index]
      node[this.key] = node.__text
      node.__scaledcolor = this.getColorValue(this.extent[index])
      nodes.push(node)
    }
    
    let node = new Node(-1)
    node.__text = this.transform(this.scalarCategoricalBins)
    node[this.key] = node.__text
    node.__scaledcolor = this.getColorValue(this.extent[this.scalarCategoricalBins])
    nodes.push(node)

    return nodes
  }
}
