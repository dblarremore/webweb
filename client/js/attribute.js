import * as d3 from 'd3'

const zip = (arr, ...arrs) => {
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]))
}

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
  get defaultColorValue() { return d3.rgb(128, 128, 128) }
  get defaultValue() { return 1 }
  get hslMaxValue() { return 330 }

  static get DISPLAY_COLOR() { return true }
  static get DISPLAY_SIZE() { return true }

  get TYPE() { return 'none' }

  static isType(nodeValues) { return false }

  get sizeScale() { return 'nodeSize' }
  get colorScale() { return 'none' }

  constructor(key) {
    this.key = key
  }

  /********************************************************************************
   * EXTENT
  ********************************************************************************/
  extent(nodes) {
    return [... new Set(Object.values(nodes).map(node => node[this.key]))]
  }

  colorExtent(nodes) {
    return [... new Set(this.getRawColorValues(nodes))]
  }

  valueSetSize(nodes) {
    return this.extent(nodes).length
  }

  /********************************************************************************
   * TRANSFORMATION
   *
   * makes the input stuff nicer (eg, turns 0 into false for binary attributes,
   * etc)
  ********************************************************************************/
  transformNodeValue(val) { return val }

  /********************************************************************************
   *
   *
   * COLOR
   * 
   * 
  ********************************************************************************/
  getRawColorValue(node) {
    return node[this.key]
  }

  getRawColorValues(nodes) {
    return Object.entries(nodes).map(node => this.getRawColorValue(node))
  }

  getScaledColorValue(node, scale) {
    return d3.hsl(210 * (1 - this.getRawColorValue(node)), 0.7, 0.5);
  }

  getScaledColorValues(nodes, scale) {
    return nodes.map(node => getScaledColorValue(node, scale))
  }

  /********************************************************************************
   *
   *
   * SIZE
   * 
   * 
  ********************************************************************************/
  getRawSizeValue(node) {
    return node[this.key]
  }

  getRawSizeValues(nodes) {
    return nodes.map(node => this.getRawSizeValue(node))
  }

  /*
   * Parameters:
   * - node. Node object. basically a key/value store.
   * - scale. d3 scale object.
   * 
   * Returns:
   *    Int. Scaled size.
  */ 
  getScaledSizeValue(node, scale) {
    return scale(this.getRawSizeValue(node))
  }

  getScaledSizeValues(nodes, scale) {
    return nodes.map(node => this.getScaledSizeValue(node, scale))
  }

  /********************************************************************************
   * Legend Functions
  ********************************************************************************/
  getLegendValuesAndText(text, values) {
    return this.legendSort(values, text)
  }

  legendSort(rawValues, rawText) {
    if (rawValues == undefined) {
      rawValues = []
    }
    if (rawText == undefined) {
      rawText = []
    }

    let length = rawValues.length < rawText.length ? rawValues.length : rawText.length
    let pairList = []

    let seenText = {}

    for (let i = 0; i < length; i++) {
      let text = rawText[i]
      if (seenText[text] == undefined) {
        seenText[text] = true
        pairList.push({
          'value': rawValues[i],
          'text': text,
        })
      }
    }

    // sort by text element
    pairList.sort((a, b) => a.text - b.text)

    return {
      'values': pairList.map(x => x.value),
      'text': pairList.map(x => x.text),
    }
  }

  // 'bins' a set of values so that we can display a finite legend.
  makeBinnedLegend(rawValues, bins) {
    if (bins == undefined || isNaN(bins)) {
      bins = 4
    }

    const [min, max] = [d3.min(rawValues), d3.max(rawValues)]
    const step = (max - min) / bins

    let values = []
    
    values.push(rounddown(min, 10))
    for (let i = 1; i < bins; i++) {
      values.push(round(min + i * step, 10))
    }
    values.push(roundup(max, 10))

    return {
      'values': values,
      'text': values.slice(0),
    }
  }
}

export class NameAttribute extends Attribute {
  get TYPE() { return 'name' }

  static get DISPLAY_COLOR() { return false }
  static get DISPLAY_SIZE() { return false }

}
export class ScalarAttribute extends Attribute {
  get TYPE() { return 'scalar' }

  static isType(nodeValues) { return true }

  get colorScale() { return 'scalarColors' }

  getLegendValuesAndText(rawValues, scaledValues) {
    let values = []
    let text = []

    // if it is integer scalars:
    if (allInts(scaledValues)) {
      const [min, max] = [d3.min(scaledValues), d3.max(scaledValues)]

      if (max - min <= 8) {
        values = d3.range(min, max + 1)
        text = values.slice(0)
      }
    }

    if (values.length == 0) {
      return this.makeBinnedLegend(scaledValues)
    }

    return {
      'values': values,
      'text': text,
    }
  }
}
export class DegreeAttribute extends ScalarAttribute {
  get TYPE() { return 'degree' }

  get colorScale() { return 'scalarColors' }

  getLegendValuesAndText(rawValues, scaledValues) {
    let values = []
    let text = []
    for (let [rawValue, scaledValue] of zip(rawValues, scaledValues)) {
      if (! text.includes(rawValue)) {
        values.push(scaledValue)
        text.push(rawValue)
      }
    }

    return this.legendSort(values, text)
  }

  getScaledSizeValue(node, scale) { return scale(Math.sqrt(this.getRawSizeValue(node))) }
}
export class BinaryAttribute extends Attribute {
  get TYPE() { return 'binary' }

  get colorScale() { return 'categoricalColors' }

  static get trueValues() { return [true, 'true', 1] }
  static get falseValues() { return [false, 'false', 0, undefined, null] }

  extent() { return [true, false] }
  colorExtent() { return [true, false] }

  transformNodeValue(value) {
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

  getLegendValuesAndText(rawValues, scaledValues) {
    return {
      'values': [
        scaledValues[rawValues.indexOf(false)],
        scaledValues[rawValues.indexOf(true)]
      ],
      'text': ["false", "true"],
    }
  }
}

export class CategoricalAttribute extends Attribute {
  get TYPE() { return 'categorical' }

  get scalarCategoricalBins() { return 9 }

  static get DISPLAY_SIZE() { return false }

  constructor(key, categories, nodes) {
    super(key)
    this.categories = categories || this.extent(nodes)
  }

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

  colorExtent(nodes) {
    if (this.isScalarCategorical) {
      return [0, this.categories.length - 1]
    }

    return [... new Set(this.getRawColorValues(nodes))]
  }

  static isType(nodeValues) {
    return Object.values(nodeValues).filter((val) => val !== undefined).some(isNaN)
  }

  transformNodeValue(nodeValue) {
    return this.isScalarCategorical && isInt(nodeValue)
      ? this.categories[categoryNumber]
      : nodeValue
  }

  get isScalarCategorical() {
    return this.categories.length >= this.scalarCategoricalBins
  }

  get colorScale() {
    return this.isScalarCategorical
      ? 'scalarColors'
      : 'categoricalColors'
  }

  getRawColorValue(node) {
    if (this.isScalarCategorical) {
      return this.categories.indexOf(node[this.key])
    }
    else {
      return node[this.key]
    }
  }

  // make sure there's enough categories even if there aren't
  valueSetSize(nodes) {
    const extentSize = this.extent(nodes).length
    return extentSize == 1
      ? 2
      : extentSize
  }

  getLegendValuesAndText(rawValues, scaledValues) {
    if (this.isScalarCategorical) {
      return this.scalarCategoricalLegendValuesAndText(rawValues, scaledValues)
    }

    return super.getLegendValuesAndTextValuesAndText(rawValues, scaledValues)
  }

  scalarCategoricalLegendValuesAndText(rawValues, scaledValues) {
    const [min, max] = [d3.min(rawValues), d3.max(rawValues)]
    const step = (max - min) / this.scalarCategoricalBins

    let values = []
    let text = []
    for (let i = 0; i < this.scalarCategoricalBins - 1; i++) {
      const index = rounddown(min + i * step, 10)
      values.push(this.hslFromIndex(index))
      text.push(this.categories[index])
    }
    values.push(this.hslFromIndex(this.scalarCategoricalBins))
    text.push(this.categories[this.scalarCategoricalBins])

    return {
      'values': values,
      'text': text,
    }
  }
}

function isInt(n){
  return Number(n) === n && n % 1 === 0;
}
function allInts(vals) {
  return vals.filter(
    (val) => isInt(val)
  ).length == vals.length
}
function round(x, dec) {
  return (Math.round(x * dec) / dec);
}
function rounddown(x, dec) {
  return (Math.floor(x * dec) / dec);
}
function roundup(x, dec) {
  return (Math.ceil(x * dec) / dec);
}
