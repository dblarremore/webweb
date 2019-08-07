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
  static TYPE = 'none'

  static defaultColorValue = d3.rgb(100, 100, 100)
  static defaultValue = 1

  static DISPLAY_COLOR = true
  static DISPLAY_SIZE = true

  get sizeScale() {
    return 'nodeSize'
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
    return d3.set(nodeValues).values().sort()
  }

  colorExtent(nodes) {
    return d3.set(this.getRawColorValues(nodes)).values().sort()
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
  static TYPE = 'name'

  static DISPLAY_COLOR = false
  static DISPLAY_SIZE = false

}

export class DegreeAttribute extends Attribute {
  static TYPE = 'degree'

  get colorScale() {
    return 'scalarColors'
  }

  getScaledSizeValue(node, scale) {
    return scale(Math.sqrt(this.getRawSizeValue(node)))
  }
}
export class ScalarAttribute extends Attribute {
  static TYPE = 'scalar'

  isType(nodes) {
    return true
  }

  get colorScale() {
    return 'scalarColors'
  }
}
export class BinaryAttribute extends Attribute {
  static TYPE = 'binary'

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
  static TYPE = 'categorical'
  static DISPLAY_SIZE = false

  constructor(key, categories, nodes) {
    super(key)
    this.categories = categories

    if (nodes !== undefined && ! this.categories) {
      this.defaultCategories(nodes)
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
