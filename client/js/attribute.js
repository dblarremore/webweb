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
  static get DISPLAY_COLOR() { return true }
  static get DISPLAY_SIZE() { return true }

  get TYPE() {
    return 'none'
  }

  get sizeScale() {
    return 'nodeSize'
  }

  getLegendValuesAndText(rawValues, scaledValues, nodes) {
    let text = rawValues
    let values = scaledValues
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

    let [min, max] = [d3.min(rawValues), d3.max(rawValues)]
    let step = (max - min) / bins

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

  // want to opaquly handle color and size
  // also want 'shouldDisplay'
  constructor(key) {
    this.key = key
  }

  get nodes() {
    return this._nodes
  }

  set nodes(nodes) {
    this._nodes = nodes
  }

  static typeIsStatedType(type) {
    if (type !== undefined && type == this.TYPE) {
      return true
    }
    return false
  }

  // EXTENT and other size properties
  extent(nodes) {
    let nodeValues = Object.values(nodes).map(node => node[this.key])
    return d3.set(nodeValues).values()
  }

  colorExtent(nodes) {
    return d3.set(this.getRawColorValues(nodes)).values()
  }

  valueSetSize(nodes) {
    return this.extent(nodes).length
  }

  /*
   * Parameters:
   * - nodes
   *
   * Returns: 
   *    boolean. True if the values are of the type
    * */
  isType(nodes) {
    return false
  }


  /********************************************************************************
   * Transformation Functions
   *
   * these modify the imput, and run on dictionaries of elements. 
   * run as part of the startup process. 
   * stored in layers after.
  ********************************************************************************/

  /*
   * Parameters:
   * - node
   * 
   * Returns:
   *    modified node
  */ 
  transformNode(node) {
    return node
  }

  transformNodeValues(nodes) {
    this.nodes = nodes
    let newNodes = {}
    Object.entries(nodes).forEach(([key, node]) => {
      newNodes[key] = this.transformNode(node)
    })

    return newNodes
  }

  /********************************************************************************
   *
   *
   * COLOR
   * 
   * 
  ********************************************************************************/
  get colorScale() {
    return 'none'
  }

  getRawColorValue(node) {
    return node[this.key]
  }

  getRawColorValues(nodes) {
    return Object.entries(nodes).map(node => this.getRawColorValue(node))
  }

  getScaledColorValue(node, scale) {
    let raw = this.getRawColorValue(node)
    let scaled = scale(raw)
    return d3.hsl(210 * (1 - raw), 0.7, 0.5);
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

  setNodeDictOntoNodeArray(nodeDict, nodeArray, nameToIdMap) {
    Object.entries(nodeDict).forEach((sourceKey, sourceNode) => {
      let targetIndex = nameToIdMap[sourceKey]
      let targetNode = nodeArray[targetIndex]

      targetNode[this.key] = sourceNode[this.key]
    })
  }
}

export class NameAttribute extends Attribute {
  get TYPE() {
    return 'name'
  }

  static get DISPLAY_COLOR() { return false }
  static get DISPLAY_SIZE() { return false }

}
export class ScalarAttribute extends Attribute {
  get TYPE() {
    return 'scalar'
  }

  isType(nodes) {
    return true
  }

  getLegendValuesAndText(rawValues, scaledValues, nodes) {
    let map = {
      'values': [],
      'text': rawValues,
    }
    // if it is integer scalars:
    if (allInts(scaledValues)) {
      let [min, max] = [d3.min(scaledValues), d3.max(scaledValues)]

      if (max - min <= 8) {
        map.values = d3.range(min, max + 1)
        map.text = map.values.slice(0)
      }
    }

    if (map.values.length == 0) {
      return this.makeBinnedLegend(scaledValues)
    }

    return map
  }

  get colorScale() {
    return 'scalarColors'
  }
}
export class DegreeAttribute extends ScalarAttribute {
  get TYPE() {
    return 'degree'
  }

  get colorScale() {
    return 'scalarColors'
  }

  getLegendValuesAndText(rawValues, scaledValues, nodes) {
    let values = []
    let text = []
    for (let [i, rawValue] of Object.entries(rawValues)) {
      if (text.indexOf(rawValue) < 0) {
        values.push(scaledValues[i])
        text.push(rawValue)
      }
    }

    return this.legendSort(values, text)
  }

  getScaledSizeValue(node, scale) {
    return scale(Math.sqrt(this.getRawSizeValue(node)))
  }
}
export class BinaryAttribute extends Attribute {
  get TYPE() {
    return 'binary'
  }

  getLegendValuesAndText(rawValues, scaledValues, nodes) {
    return {
      'values': scaledValues,
      'text': ["false", "true"],
    }
  }

  /*
   * Explanation: 
   *    it's type 'binary' if it's:
   *        - [true, false]
   *        - [false, undefined]
   *        - [true, undefined]
   *        - [0, 1]
   *        - [0, undefined]
   *        - [1, undefined]
   *        - [true]
   *        - [false]
   *        - [0]
   *        - [1]
  */ 
  isType(nodes) {
    let valSet = d3.set(Object.values(nodes).map(node => node[this.key])).values().sort()
    if (valSet.length == 2) {
      // 'true' and 'false'
      if (valSet[0] == 'false' && valSet[1] == 'true') {
        return true
      }
      else if (valSet[0] == 'false' && valSet[1] == 'undefined') {
        return true
      }
      else if (valSet[0] == 'true' && valSet[1] == 'undefined') {
        return true
      }

      // true and false
      if (valSet[0] == false && valSet[1] == true) {
        return true
      }
      else if (valSet[0] == false && valSet[1] == 'undefined') {
        return true
      }
      else if (valSet[0] == true && valSet[1] == 'undefined') {
        return true
      }


      // 0 and 1
      if (valSet[0] == 0 && valSet[1] == 1) {
        return true
      }
      else if (valSet[0] == 0 && valSet[1] == 'undefined') {
        return true
      }
      else if (valSet[0] == 1 && valSet[1] == 'undefined') {
        return true
      }
    }
    else if (valSet.length == 1) {
      if (valSet[0] == 'false' || valSet[0] == 'true') {
        return true
      }
      else if (valSet[0] == false || valSet[0] == true) {
        return true
      }
      else if (valSet[0] == 0 || valSet[0] == 1) {
        return true
      }
    }
    return false
  }

  extent() {
    return [true, false]
  }

  colorExtent() {
    return [true, false]
  }

  transformNode(node) {
    node[this.key] = node[this.key] ? true : false
    return node
  }

  get colorScale() {
    return 'categoricalColors'
  }
  getScaledColorValue(node, scale) {
    let raw = this.getRawColorValue(node)
    let scaled = scale(raw)
    return scaled
  }

}
export class CategoricalAttribute extends Attribute {
  get TYPE() {
    return 'categorical'
  }
  static get DISPLAY_SIZE() { return false }

  constructor(key, categories, nodes) {
    super(key)
    this.categories = categories

    if (nodes !== undefined && ! this.categories) {
      this.defaultCategories(nodes)
    }
  }

  getLegendValuesAndText(rawValues, scaledValues, nodes) {
    this.defaultCategories(nodes)
    if (this.isScalarCategorical) {
      // TODO:
      // this might now work, unsure about how the scalarCategorical
      // "is it an index, is it a string" is working
      return this.makeBinnedLegend(scaledValues)
    }
    else {
      return super.getLegendValuesAndText(rawValues, scaledValues, nodes)
    }
  }

  getScaledColorValue(node, scale) {
    let raw = this.getRawColorValue(node)
    let scaled = scale(raw)
    return scaled
  }
  set nodes(nodes) {
    this._nodes = nodes
    this.defaultCategories(nodes)
  }

  defaultCategories(nodes) {
    this.categories = this.categories || this.extent(nodes)
  }

  isType(nodes) {
    let valSet = this.extent(Object.values(nodes).filter((val) => val !== undefined))
    if (valSet.some(isNaN)) {
      return true
    }
    return false
  }

  // make sure there's enough categories even if there aren't
  valueSetSize(nodes) {
    let extentSize = this.extent(nodes).length
    return extentSize == 1 ? 2 : extentSize
  }

  transformNode(node) {
    if (this.isScalarCategorical) {
      let categoryNumber = node[this.key]

      if (isInt(categoryNumber)) {
        node[this.key] = this.categories[categoryNumber]
      }
    }

    return node
  }

  get isScalarCategorical() {
    return this.categories.length >= 9 ? true : false
  }

  get colorScale() {
    if (this.isScalarCategorical) {
      return 'scalarColors'
    }
    else {
      return 'categoricalColors'
    }
  }

  getRawColorValue(node) {
    if (this.isScalarCategorical) {
      return this.categories.indexOf(node[this.key])
    }
    else {
      return node[this.key]
    }
  }
}

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}
function allInts(vals) {
    for (var i in vals) {
        if (!isInt(vals[i])) {
            return false;
        }
    }

    return true;
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
