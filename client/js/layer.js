import * as d3 from 'd3'
import { Attribute, NoneAttribute, ScalarAttribute, UserColorAttribute, BinaryAttribute, CategoricalAttribute, ScalarCategoricalAttribute } from './attribute'

import * as utils from './utils'

/*********************************************************************************
 * Layer
 *
 * the fundamental unit of a network webweb displays.
 *
*********************************************************************************/
export class Layer {
  get nonMetadataKeys() {
    return [
      'idx', 'index',
      'x', 'y',
      'vx', 'vy',
      'fx', 'fy',
      'name',
    ]
  }

  constructor(rawLayer={}, global={}) {
    [this.edges, this.undirectedEdges, this.nodes, this.metadataTypes] = this.constructor.regularize(
      rawLayer, global
    )

    this.links = this.edges
    this.isWeighted = this.constructor.areEdgesWeighted(this.edges)
    this.isDirected = this.constructor.areEdgesDirected(this.edges)
  }

  /*********************************************************************************
   * 
   *
   * regularization and initing
   * 
   *
   *********************************************************************************/
  static regularize(rawLayer={}, global={}) {
    let [directedEdges, undirectedEdges] = this.regularizeEdgeList(rawLayer.edgeList)

    let nodeDictionary = this.regularizeNodeDictionary(rawLayer.nodes, global.nodes)
    let metadata = this.regularizeMetadata(rawLayer.metadata, global.metadata)

    const nodeNames = this.getNodeNames(directedEdges, nodeDictionary, metadata)

    let nodes = []
    let nameToIdMap = {}
    nodeNames.forEach((name, index) => {
      nameToIdMap[utils.safeNumberCast(name)] = index
      nameToIdMap[name] = index
      nodes.push({ 'name': index })
    })

    // now we rename things and merge all the different data sources into a
    // single place
    directedEdges.forEach(edge => edge.renameNodes(nameToIdMap))
    undirectedEdges.forEach(edge => edge.renameNodes(nameToIdMap))

    nodes = this.addNodeDictionaryDataToNodes(nodes, nodeDictionary, nameToIdMap)
    nodes = this.addMetadataToNodes(nodes, metadata)

    const metadataTypes = {}
    Object.entries(metadata).forEach((key, data) => metadataTypes[key] = data.type)

    return [directedEdges, undirectedEdges, nodes, metadataTypes]
  }

  static regularizeEdgeList(edgeList=[]) {
    let directed = {}
    let undirected = {}
    let edgeMap = {}
    for (let edge of edgeList) {
      let [source, target, weight, metadata] = this.regularizeEdge(edge)

      const [first, second] = source <= target
        ? [source, target]
        : [target, source]

      directed = this.addEdge(directed, source, target, weight, metadata)
      undirected = this.addEdge(undirected, first, second, weight, metadata)
    }

    let directedList = Object.values(directed).reduce((a, b) => a.concat(Object.values(b)), [])

    let undirectedList = Object.values(undirected).reduce((a, b) => a.concat(Object.values(b)), [])

    return [directedList, undirectedList]
  }

  static regularizeEdge(edge) {
    let [one, two, three=17, four] = [1, 2]
    let [source, target, weight=1, metadata={}] = edge
    
    source = utils.safeNumberCast(source)
    target = utils.safeNumberCast(target)
    weight = parseFloat(weight)

    return [source, target, weight, metadata]
  }

  static addEdge(edgeMap, source, target, weight, metadata) {
    edgeMap[source] = edgeMap[source] || {}

    if (edgeMap[source][target]) {
      edgeMap[source][target].metadata = Object.assign(edgeMap[source][target].metadata, metadata)
      edgeMap[source][target].weight += weight
    }
    else {
      edgeMap[source][target] = new Edge(source, target, weight, metadata)
    }

    return edgeMap
  }

  static addNodeDictionaryDataToNodes(nodes, nodesDictionary, nameToIdMap) {
    Object.entries(nodesDictionary).forEach(([name, dictionaryNode]) => {
      const id = nameToIdMap[name]
      nodes[id] = Object.assign(nodes[id], dictionaryNode)
    })
    return nodes
  }

  /* We assign the metadata vectors onto the nodes here, as well as convert them
   * into their "categories" value */
  static addMetadataToNodes(nodes, metadata) {
    Object.entries(nodes).forEach((node, index) => {
      for (let [key, data] of Object.entries(metadata)) {
        let value = node[key]

        if (data.values !== undefined) {
          value = data.values[index]
        }

        if (data.categories !== undefined) {
          value = data.categories[value]
        }

        if (value !== undefined) {
          node[key] = value
        }
      }
    })

    return nodes
  }

  // cleans up metadata representation.
  static regularizeMetadata(layerMetadata={}, globalMetadata={}) {
    let metadata = Object.assign({}, globalMetadata || {})

    Object.keys(layerMetadata || {}).forEach(key => {
      metadata[key] = Object.assign(metadata[key] || {}, layerMetadata[key])
    })

    // set the type of any key that has 'categories' to categorical
    for (let [key, value] of Object.entries(metadata)) {
      if (value.categories !== undefined) {
        metadata[key].type = 'categorical'
      }
    }

    return metadata
  }

  // adds keys from global nodes if a node is present
  static regularizeNodeDictionary(layerNodes={}, globalNodes={}) {
    let nodes = {}
    Object.keys(globalNodes).forEach(key => {
      key = utils.safeNumberCast(key)
      nodes[key] = Object.assign({}, globalNodes[key])
    })

    Object.keys(layerNodes).forEach(key => {
      key = utils.safeNumberCast(key)
      nodes[key] = Object.assign(nodes[key] || {}, layerNodes[key])
    })

    return nodes
  }

  // this function constructs the mapping from node names to array indices (ids)
  static getNodeNameToIdMap(nodeNames) {
    // there's only going to be one null node here, because we setted earlier

    let nameToIdMap = {}
    nodeNames.forEach((name, index) => {
      nameToIdMap[name] = index
      nameToIdMap[utils.safeNumberCast(name)] = index
    })

    return nameToIdMap
  }

  // retrieves the nodeNames. The ordering of these is important.
  // Pulls from:
  // - nodes referenced in edges
  // - nodes in nodes object
  // - the number of elements in each metadata attribute's values list
  static getNodeNames(edges=[], rawNodes={}, metadata={}) {
    let nodeNames = []

    edges.forEach(edge => nodeNames.push(...edge.nodes))
    nodeNames.push(...Object.keys(rawNodes))
    nodeNames = nodeNames.map(_id => utils.safeNumberCast(_id))
    nodeNames = [... new Set(nodeNames)]
    
    if (utils.allInts(nodeNames)) {
      nodeNames.sort((a, b) => a - b)
    }

    const integerNodeNames = nodeNames.filter(name => utils.isInt(name))

    let unusedName = integerNodeNames.length ? Math.max(...integerNodeNames) + 1 : 0

    // add in the max count from the metadata values
    const metadataCount = this.maxMetadataValuesCount(metadata)

    while (nodeNames.length < metadataCount) {
      nodeNames.push(unusedName)
      unusedName += 1
    }

    return nodeNames
  }

  // Finds the maximum length of a `values` array in the metadata.
  static maxMetadataValuesCount(metadata={}) {
    const metadataValueLengths = Object.values(metadata).map(
      data => data.values
    ).filter(values => values !== undefined).map(
      values => values.length
    )

    return metadataValueLengths.length ? Math.max(...metadataValueLengths) : 0
  }

  /*********************************************************************************
   * 
   *
   * network representation
   * 
   *
   *********************************************************************************/
  /* we consider a network directed if we see both (a --> b) and (b --> a)
    * */
  static areEdgesDirected(edges) {
    let edgeDictionary = {}
    let isDirected = false
    Object.entries(edges).forEach(edge => {
      const [source, target] = [edge.source, edge.target]
      edgeDictionary[source] = edgeDictionary[source] || {}
      edgeDictionary[source][target] = 1
      if (edgeDictionary[target] !== undefined && edgeDictionary[target][source] !== undefined) {
        isDirected = true
        return
      }
    })
    return isDirected
  }

  static areEdgesWeighted(edges) {
    return [... new Set(edges.map(edge => edge.weight))].length > 1
  }

  degrees(matrix) {
    return matrix.map(row => row.filter(v => v > 0).length)
  }

  strengths(matrix) {
    return matrix.map(row => row.reduce((a, b) => a + b, 0))
  }

  outDegrees(matrix) {
    return matrix.map(row => row.reduce((a, b) => a + b, 0))
  }

  inDegrees(matrix) {
    let inDegrees = []
    for (let i = 0; i < matrix.length; i++) {
      inDegrees.push(0)
      for (let j = 0; j < matrix.length; j++) {
        inDegrees[i] += matrix[j][i]
      }
    }
    return inDegrees
  }

  get matrix() {
    if (! this._matrix) {
      this._matrix = this.constructor.makeMatrixFromEdges(
        this.nodes.length,
        this.edges
      )
    }

    return this._matrix
  }

  get undirectedMatrix() {
    if (! this.isDirected) {
      return this.matrix
    }
    else if (this._undirectedMatrix === undefined) {
      this._undirectedMatrix = this.constructor.makeMatrixFromEdges(
        this.nodes.length,
        this.undirectedEdges
      )
    }

    return this._undirectedMatrix
  }

  static makeMatrixFromEdges(size, edges) {
    let matrix = utils.zerosMatrix(size)
    edges.forEach(edge => matrix[edge.source][edge.target] = edge.weight)
    return matrix
  }

  /*********************************************************************************
   * 
   *
   * attributes
   * 
   *
   *********************************************************************************/
  getAttributes(weighted, directed) {
    if (this._attributes === undefined) {
      this._attributes = {}
    }

    if (this._attributes[weighted] === undefined) {
      this._attributes[weighted] = {}
    }

    if (this._attributes[weighted][directed] === undefined) {
      this._attributes[weighted][directed] = {
        'node': this.getNodeAttributes(weighted, directed),
        'edge': this.getEdgeAttributes(weighted, directed),
      }
    }

    return this._attributes[weighted][directed]
  }

  getNodeAttributes(weighted, directed) {
    let attributes = {
      'none': {
        'class': NoneAttribute,
        'getValues': () => [],
      },
      'degree': {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.degrees(matrix),
      },
    }

    if (weighted && this.isWeighted) {
      attributes['strength'] = {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.strengths(matrix),
      }
    }

    if (directed && this.isDirected) {
      attributes['out degree'] = {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.outDegrees(matrix),
      }

      attributes['in degree'] = {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.inDegrees(matrix),
      }
    }

    Object.assign(attributes, this.getElementMetadataAttributes(this.nodes, this.metadataTypes))

    return attributes
  }

  getEdgeAttributes(weighted, directed) {
    let attributes = {
      'none': {
        'class': NoneAttribute,
        'getValues': () => [],
      },
      'weight': {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix, edges) => edges.map(edge => edge.weight),
      },
    }

    Object.assign(
      attributes,
      this.getElementMetadataAttributes(this.edges.map(edge => edge.metadata), this.metadataTypes)
    )

    return attributes
  }

  getElementMetadataAttributes(metadataElements, metadataTypes={}) {
    let metadataValues = {}
    metadataElements.forEach((element, index) => {
      const attributeKeys = utils.getObjectAttributeKeys(element, this.nonMetadataKeys)

      // need to add undefined elements even we don't have values
      attributeKeys.forEach(key => {
        if (metadataValues[key] === undefined) {
          metadataValues[key] = new Array(metadataElements.length)
        }

        metadataValues[key][index] = element[key]
      })
    })

    let metadata = {}
    Object.entries(metadataValues).forEach(([key, values]) => {
      const AttributeClass = this.getAttributeClassToAdd(key, values, metadataTypes[key])

      if (AttributeClass !== undefined) {
        metadata[key] = {
          'class': AttributeClass,
          'getValues': (nodes, matrix) => Object.values(nodes).map(node => node[key]),
        }
      }
    })

    return metadata
  }

  getAttributeClassToAdd(key, values, type) {
    if (key === 'color' && UserColorAttribute.isType(values)) {
      return UserColorAttribute
    }

    if ((type !== undefined) && (type === 'categorical')) {
      if (ScalarCategoricalAttribute.isType(values)) {
        return ScalarCategoricalAttribute
      }
      else {
        return CategoricalAttribute
      }
    }

    const orderedAttributes = [
      BinaryAttribute,
      ScalarCategoricalAttribute,
      CategoricalAttribute,
      ScalarAttribute
    ]

    for (let AttributeClass of orderedAttributes) {
      if (AttributeClass.isType(values)) {
        return AttributeClass
      }
    }

    return undefined
  }
}

export class Edge {
  constructor(source, target, weight=0, metadata={}) {
    this.source = source
    this.target = target
    this.weight = weight
    this.metadata = metadata
  }

  get nodes() {
    return [this.source, this.target]
  }

  renameNodes(nameToIdMap) {
    this.source = nameToIdMap[this.source]
    this.target = nameToIdMap[this.target]
  }

  get isSelfLoop() {
    return this.source === this.target
  }
}
