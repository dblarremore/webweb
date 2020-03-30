import * as utils from './utils'
import * as coloror from './coloror'
import * as d3 from 'd3'

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
  get colororClass() { return coloror.MultiHueColoror }
  get hasLegend() { return true }

  static get displays() { return ['color', 'size'] }
  static isType(nodeValues) { return false }

  constructor(key, values) {
    this.key = key

    // move the values into an array if it's in dictionary format
    if (values !== undefined) {
      let objectValues = []
      try {
        objectValues = Object.values(values)
      } catch (e) {
        1
      }

      if ((objectValues.length) && (objectValues[0][this.key] !== undefined)) {
        values = objectValues.map(value => value[this.key])
      }
    }

    this.values = []

    if (values !== undefined) {
      this.values = values.map(value => this.transformValue(value))
    }

    if (utils.allNumbers(this.values)) {
      this.values = this.values.sort((a, b) => a - b)
    }

    this.coloror = new this.colororClass(this.valuesSet)
    this.setScale()
  }

  get colorPalettes() { return this.coloror.constructor.palettes }
  set colorPalette(palette) { this.coloror.setPalette(palette) }

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

  getNumericalValue(value) {
    return this.scale(this.transformValue(value))
  }

  getColorValue(value) {
    return d3.rgb(this.coloror.color(this.getNumericalValue(value)))
  }

  getNodeNumericalValue(node) {
    return this.getNumericalValue(node[this.key])
  }

  getNodeColorValue(node) {
    return this.getColorValue(node[this.key])
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
    return valuesSet.map(value => [value, value])
  }
}

export class NoneAttribute extends Attribute {
  static get displays() { return [] }
  get hasLegend() { return false }

  get colororClass() { return coloror.NoneColoror }

  setScale() {
    this.scale = d3.scaleLinear()
    this.scale.domain(this.extent)
    this.scale.range([1, 1])
  }

  getNumericalValue(value) {
    return 1
  }
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

  getLegendNodes() {
    return super.getLegendNodes(utils.binValues(this.valuesSet))
  }
}

export class DivergingScalarAttribute extends ScalarAttribute {
  get colororClass() { return coloror.DiveringColoror }
}

export class BinaryAttribute extends Attribute {
  get colororClass() { return coloror.CategoricalColoror }

  static get trueValues() { return [true, 'true', 1] }
  static get falseValues() { return [false, 'false', 0, undefined, null] }
  static get validValues() { return this.trueValues.concat(this.falseValues) }

  get valuesSet() { return [0, 1] }

  get colorPalettes() { return Object.keys(this.coloror.constructor.palettes) }

  setScale() {
    this.scale = d3.scaleLinear()
    this.scale.domain(this.extent)
    this.scale.range([0, 1])
  }

  transformValue(value) {
    return this.constructor.trueValues.includes(value) ? 1 : 0
  }

  static isType(nodeValues) {
    return [... new Set(nodeValues)].filter(
      (val) => val !== undefined && val !== null
    ).filter(
      (val) => ! this.validValues.includes(val)
    ).length == 0
  }

  getLegendNodes() {
    return [
      ['false', 0],
      ['true', 1],
    ]
  }
}

export class UserColorAttribute extends Attribute {
  get colororClass() { return coloror.NoneColoror }
  get hasLegend() { return false }

  static get displays () { return ['color'] }

  static isType(nodeValues) {
    const hexValues = Object.values(nodeValues).filter(
      (val) => typeof val === 'string' && val.length == 7 && val[0] == '#'
    )

    return hexValues !== undefined && hexValues.length == nodeValues.length
  }

  getNodeColorValue(node) { return node['color'] }
  getColorValue(value) { return value }
}

export class CategoricalAttribute extends Attribute {
  static get displays () { return ['color'] }
  get colororClass() { return coloror.CategoricalColoror }

  get colorPalettes() {
    return this.coloror.constructor.palettesValidForSize(this.values.length)
  }

  static isType(nodeValues) {
    return Object.values(nodeValues).filter((val) => val !== undefined).some(isNaN)
  }
}

export class ScalarCategoricalAttribute extends Attribute {
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
    const colorValue = this.values.indexOf(value)
    return this.coloror.color(this.scale(colorValue))
  }

  get extent() {
    return [0, this.valuesSet.length - 1]
  }

  transformValue(value) {
    return utils.isInt(value) ? this.values[value] : value
  }

  getLegendNodes() {
    const [min, max] = this.extent
    const step = (max - min) / this.scalarCategoricalBins

    console.log('this doesnt work')
    let legendNodes = []
    for (let i = 0; i < this.scalarCategoricalBins - 1; i++) {
      const index = utils.rounddown(min + i * step, 10)
      legendNodes.push([this.extent[index], index])
    }
    
    legendNodes.push([this.transform(this.scalarCategoricalBins), this.scalarCategoricalBins])
    return legendNodes
  }
}
