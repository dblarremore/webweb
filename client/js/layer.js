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
  static get nonMetadataKeys() {
    return [
      'idx', 'index',
      'degree', 'strength',
      'x', 'y',
      'vx', 'vy',
      'fx', 'fy',
      'name',
    ]
  }

  constructor(edgeList=[], nodes, metadata, display, globalMetadata, globalNodes) {
    const rawEdgeList = this.regularizeEdgeList(edgeList)
    const rawNodes = this.regularizeNodes(nodes, globalNodes)
    this.metadata = this.regularizeMetadata(metadata, globalMetadata)

    this.nodeNameToIdMap = this.getNodeNameToIdMap(rawEdgeList, this.metadata, rawNodes)

    // TODO: we need to handle weighted/unweighted requests
    this.links = this.createLinks(rawEdgeList)
    this.nodes = this.createNodes(rawNodes, this.metadata)
  }

  get nodeCount() {
    return Object.keys(this.nodeNameToIdMap).length
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

  /*********************************************************************************
   * 
   *
   * regularization and initing
   * 
   *
   *********************************************************************************/
  regularizeEdgeList(rawEdgeList) {
    let matrix = {}
    for (let edge of rawEdgeList) {
      let [source, target, weight] = this.regularizeEdge(edge)

      if (matrix[source] === undefined) {
        matrix[source] = {}
      }

      if (matrix[source][target] === undefined) {
        matrix[source][target] = 0
      }

      matrix[source][target] += weight
    }

    let edges = []
    let weights = []
    this.isDirected = false
    Object.keys(matrix).forEach(source => {
      Object.keys(matrix[source]).forEach(target => {
        const weight = matrix[source][target]

        edges.push(new Link(source, target, weight))
        weights.push(weight)

        if (matrix[target] !== undefined && matrix[target][source] !== undefined) {
          this.isDirected = true
        }
      })
    })

    this.isWeighted = [... new Set(edges.map(edge => edge.weight))].length !== 1

    return edges
  }

  regularizeEdge(edge) {
    let source = edge[0]
    let target = edge[1]
    let weight = edge.length == 3 ? parseFloat(edge[2]) : 1

    source = isNaN(source) ? source : +source
    target = isNaN(target) ? target : +target
    return [source, target, weight]
  }

  // cleans up metadata representation.
  regularizeMetadata(rawLayerMetadata, globalMetadata) {
    // default values to the global metadata
    let layerMetadata = Object.assign({}, globalMetadata || {})

    Object.keys(rawLayerMetadata || {}).forEach(key => {
      layerMetadata[key] = Object.assign(layerMetadata[key] || {}, rawLayerMetadata[key])
    })

    // set the type of any key that has 'categories' to categorical
    for (let [key, value] of Object.entries(layerMetadata)) {
      if (value.categories !== undefined) {
        layerMetadata[key].type = 'categorical'
      }
    }

    return layerMetadata
  }

  // adds keys from global nodes if a node is present, which is important for nodeNameToIdMap
  regularizeNodes(rawNodes={}, globalNodes={}) {
    let nodes = {}
    Object.keys(globalNodes).forEach(key => {
      key = utils.isInt(key) ? +key : key
      nodes[key] = Object.assign({}, globalNodes[key])
    })

    Object.keys(rawNodes).forEach(key => {
      key = utils.isInt(key) ? +key : key
      nodes[key] = Object.assign(nodes[key] || {}, rawNodes[key])
    })

    return nodes
  }

  // this function constructs the mapping from node names to array indices (ids)
  getNodeNameToIdMap(edgeList, metadata, nodes) {
    let mentionedNodes = this.getNodesMentioned(edgeList, metadata, nodes)

    let nodeNameToIdMap = {}

    let nextId = 0
    let nextName = 0
    mentionedNodes.forEach((node) => {
      // don't assign to null nodes;
      // instead, find the largest number used in the node map
      // and use this to give them an id later.
      if (node !== null && nodeNameToIdMap[node] == undefined) {
        nodeNameToIdMap[node] = nextId

        if (utils.isInt(node)) {
          node = +node
          nodeNameToIdMap[node] = nextId

          if (node >= nextName) {
            nextName = node + 1
          }
        }

        nextId += 1
      }
    })

    // assign the unnamed nodes ids
    mentionedNodes.forEach((name) => {
      if (name == null) {
        nodeNameToIdMap[nextName] = nextId
        nodeNameToIdMap[+nextName] = nextId
        nextId += 1
        nextName += 1
      }
    })

    return nodeNameToIdMap
  }

  // retrieves the nodeNames. The ordering of these is important.
  // Pulls from:
  // - nodes referenced in edges
  // - nodes in nodes object
  // - the number of elements in each metadata attribute's values list
  getNodesMentioned(edgeList, metadata, nodes) {
    let nodeNames = []

    edgeList.forEach(function(edge) {
      nodeNames.push(edge.source)
      nodeNames.push(edge.target)
    })

    Object.keys(nodes).forEach(function(node) {
      nodeNames.push(node)
    })

    nodeNames = nodeNames.map(
      _id => isNaN(_id) ? _id : +_id
    )

    // take a set
    nodeNames = [... new Set(nodeNames)]
    
    let unusedName = 'UNUSED_NAME'

    if (utils.allInts(nodeNames)) {
      nodeNames.sort(function(a, b){return a-b});
      unusedName = Math.max.apply(Math, nodeNames) + 1
    }

    // add in the max count from the metadata values
    const metadataCount = this.maxMetadataValuesCount(metadata)

    while (nodeNames.length < metadataCount) {
      nodeNames.push(unusedName)
      unusedName += 1
    }

    return nodeNames
  }

  // Finds the maximum length of a `values` array in the metadata.
  maxMetadataValuesCount(metadata) {
    const metadataValueLengths = Object.values(metadata || {}).filter(
      metadatum => metadatum.values !== undefined
    ).map(metadatum => metadatum.values.length)

    return metadataValueLengths.length ? Math.max(...metadataValueLengths) : 0
  }

  get undirectedLinks() {
    if (! this.isDirected) {
      return this.links
    }
    else if (this._undirectedLinks === undefined) {
      this._undirectedLinks = []
      Object.keys(this.undirectedMatrix).forEach(source => {
        Object.keys(this.undirectedMatrix[source]).forEach(target => {
          const weight = this.undirectedMatrix[source][target]
          if (source <= target && weight !== 0) {
            this._undirectedLinks.push(new Link(source, target, weight))
          }
        })
      })
    }

    return this._undirectedLinks
  }

  get matrix() {
    if (! this._matrix) {
      this._matrix = utils.zerosMatrix(this.nodeCount)
      this.links.forEach(link => this._matrix[link.source][link.target] = link.weight)
    }

    return this._matrix
  }

  get undirectedMatrix() {
    if (! this.isDirected) {
      return this.matrix
    }
    else if (this._undirectedMatrix === undefined) {
      this._undirectedMatrix = utils.zerosMatrix(this.nodeCount)

      this.links.forEach(link => {
        const weight = link.weight / 2
        this._undirectedMatrix[link.source][link.target] += weight
        this._undirectedMatrix[link.target][link.source] += weight
      })
    }

    return this._undirectedMatrix
  }

  createLinks(edgeList) {
    return edgeList.map(edge => {
      return new Link(
        this.nodeNameToIdMap[edge.source],
        this.nodeNameToIdMap[edge.target],
        edge.weight,
      )
    })
  }

  // assign metadata from the metadata vector onto the nodes
  //
  // assign them their metadata values from the metadata hash of values
  // also default node naming
  createNodes(rawNodes, metadata) {
    let nodes = []
    for (let [name, _id] of Object.entries(this.nodeNameToIdMap)) {
      let node = Object.assign({}, rawNodes[name] || {})
      node['name'] = name

      for (let [key, keyMetadata] of Object.entries(metadata)) {
        let nodeKeyValue = node[key]

        if (keyMetadata.values !== undefined) {
          nodeKeyValue = keyMetadata.values[_id]
        }

        // apply categories here if they're present
        if (keyMetadata.categories !== undefined) {
          nodeKeyValue = keyMetadata.categories[nodeKeyValue]
        }

        if (nodeKeyValue !== undefined) {
          node[key] = nodeKeyValue
        }
      }

      nodes[_id] = node
    }

    return nodes
  }

  getAttributes(weighted, directed) {
    let attributes = {
      'none': {
        'class': NoneAttribute,
        'getValues': (nodes, matrix) => [],
      },
      'degree': {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.degrees(matrix),
      },
    }

    if (weighted && this.isWeighted) {
      attributes = Object.assign(attributes, this.weightedAttributes)
    }

    if (directed && this.isDirected) {
      attributes = Object.assign(attributes, this.directedAttributes)
    }

    const metadataAttributes = this.getMetadataAttributes(this.nodes, this.metadata)
    metadataAttributes.forEach(([attributeClass, key]) => {
      attributes[key] = {
        'class': attributeClass,
        'getValues': (nodes, matrix) => nodes.map(node => node[key])
      }
    })

    return attributes
  }

  get weightedAttributes() {
    return {
      'strength': {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.strengths(matrix),
      }

    }
  }

  get directedAttributes() {
    return {
      'out degree': {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.outDegrees(matrix),
      },
      'in degree': {
        'class': ScalarAttribute,
        'getValues': (nodes, matrix) => this.inDegrees(matrix),
      },
    }
  }

  getMetadataAttributes(nodes, metadata) {
    let allKeys = [] 
    Object.values(nodes).forEach(node => {
      Object.keys(node).filter(
        key => utils.keyIsObjectAttribute(key, node)
      ).filter(
        key => this.constructor.nonMetadataKeys.indexOf(key) == -1
      ).forEach(
        key => allKeys.push(key)
      )
    })

    allKeys = [...new Set(allKeys)].sort()

    let attributes = []
    allKeys.forEach((key) => {
      let keyMetadata = metadata !== undefined ? metadata[key] || {} : {}
      let type = keyMetadata.type
      const AttributeClass = this.getAttributeClassToAdd(key, type, nodes)

      if (AttributeClass !== undefined) {
        attributes.push([AttributeClass, key])
      }
    })

    return attributes
  }

  getAttributeClassToAdd(key, type, nodes) {
    if (key === 'color' && UserColorAttribute.isType(nodeValues)) {
      return UserColorAttribute
    }

    const nodeValues = Object.values(nodes).map(node => node[key])

    if ((type !== undefined) && (type === 'categorical')) {
      if (ScalarCategoricalAttribute.isType(nodeValues)) {
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
      if (AttributeClass.isType(nodeValues)) {
        return AttributeClass
      }
    }

    return undefined
  }
}

class Link {
  constructor(source, target, weight) {
    this.source = source
    this.target = target
    this.weight = weight
  }
}
