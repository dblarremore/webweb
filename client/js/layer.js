import * as d3 from 'd3'
import { Node } from './node'
import { Attribute, NameAttribute, ScalarAttribute, UserColorAttribute, BinaryAttribute, DegreeAttribute, CategoricalAttribute } from './attribute'

/*********************************************************************************
 * Layer
 *
 * the fundamental unit of a network webweb displays.
 *
*********************************************************************************/
export class Layer {
  constructor(edgeList, nodes, metadata, display, globalMetadata, globalNodes) {
    this.edgeList = this.regularizeEdgeList(edgeList || [])
    this.metadata = this.regularizeMetadata(metadata || {}, globalMetadata, {})
    this.nodes = this.regularizeNodes(nodes || {}, globalNodes, {})
    this.display = display || {}

    this.nodeNameToIdMap = this.getNodeNameToIdMap(this.edgeList, this.metadata, this.nodes)

    // assign metadata from the metadata vector onto the nodes
    this.nodes = this.mergeMetadataWithNodes(this.nodes, this.metadata, this.nodeIdToNameMap)

    this.links = this.createLinks(this.edgeList, this.nodeNameToIdMap)

    this.nodes = this.addEdgeMetadataToNodes(this.links, this.nodes, this.nodeIdToNameMap)

    let [attributes, newNodes] =  this.getAttributes(
      this.nodes,
      this.metadata,
      this.isWeighted(this.nodes)
    )

    this.attributes = attributes
    this.nodes = newNodes
  }

  get nodeCount() {
    return Object.keys(this.nodeNameToIdMap).length
  }

  get edgeWeights() {
    return this.links.map(link => link[2])
  }

  get nodeIdToNameMap() {
    return Object.fromEntries(Object.entries(this.nodeNameToIdMap).map(([k, v]) => ([v, k])))
  }

  /*********************************************************************************
   * 
   *
   * regularization and initing
   * 
   *
   *********************************************************************************/

  // we want to convert "string" edges into int edges
  regularizeEdgeList(edgeList) {
    let regularizedEdgeList = []
    for (let edge of edgeList) {
      // there may or may not be a weight on the edge
      // so copy it and modify only the ids pointed to
      let source = edge[0];
      let target = edge[1];
      let weight = edge.length == 3
        ? parseFloat(edge[2])
        : 1

      source = isNaN(source) ? source : +source
      target = isNaN(target) ? target : +target
      regularizedEdgeList.push([source, target, weight])
    }

    return regularizedEdgeList
  }

  // cleans up metadata representation.
  regularizeMetadata(layerMetadata, globalMetadata) {
    let newLayerMetadata = {};

    // default values to the global metadata
    for (let [key, value] of Object.entries(globalMetadata)) {
      newLayerMetadata[key] = value
    }

    if (layerMetadata !== undefined && layerMetadata !== null) {
      // iterate over the layerMetadata keys, possibly overwriting global values
      for (let [key, value] of Object.entries(layerMetadata)) {
        if (newLayerMetadata[key] == undefined) {
          newLayerMetadata[key] = {}
        }

        if (value.categories !== undefined) {
          newLayerMetadata[key].categories = value.categories;
        }

        if (value.type !== undefined) {
          newLayerMetadata[key].type = value.type;
        }

        if (value.values !== undefined) {
          newLayerMetadata[key].values = value.values;
        }
      }
    }

    // set the type of any key that has 'categories' to categorical
    for (let [key, value] of Object.entries(newLayerMetadata)) {
      if (value.categories !== undefined) {
        newLayerMetadata[key].type = 'categorical'
      }
    }

    return newLayerMetadata;
  }

  // does some cleaning on node representations.
  // - adds keys from global nodes if a node is present
  // important for nodeNameToIdMap)
  regularizeNodes(nodes, globalNodes) {
    let newNodes = {}

    for (let [_id, node] of Object.entries(nodes)) {
      // default the node to this layer's nodes
      _id = isNaN(_id) ? _id : +_id
      newNodes[_id] = node
    }

    for (let [_id, globalNode] of Object.entries(globalNodes)) {
      _id = isNaN(_id) ? _id : +_id
      let newNode = newNodes[_id] || {}

      // if there is a global node, add its values, but don't overwrite
      for (let [attributeKey, attributeValue] of Object.entries(globalNode)) {
        if (newNode[attributeKey] == undefined) {
          newNode[attributeKey] = attributeValue;
        }
      }

      newNodes[_id] = newNode
    }

    return newNodes
  }

  // this function constructs the mapping from node names to array indices (ids)
  getNodeNameToIdMap(edgeList, metadata, nodes) {
    let mentionedNodes = this.getNodesMentioned(edgeList, metadata, nodes);

    let nodeNameToIdMap = {};

    let nextId = 0;
    let nextName = 0;
    mentionedNodes.forEach((node) => {
      // don't assign to null nodes;
      // instead, find the largest number used in the node map
      // and use this to give them an id later.
      if (node !== null && nodeNameToIdMap[node] == undefined) {
        nodeNameToIdMap[node] = nextId;

        if (isInt(node)) {
          node = +node;
          nodeNameToIdMap[node] = nextId;

          if (node >= nextName) {
            nextName = node + 1;
          }
        }

        nextId += 1;
      }
    })

    // assign the unnamed nodes ids
    mentionedNodes.forEach((name) => {
      if (name == null) {
        nodeNameToIdMap[nextName] = nextId;
        nodeNameToIdMap[+nextName] = nextId;
        nextId += 1;
        nextName += 1;
      }
    })

    return nodeNameToIdMap
  }

  // iterate over nodes in the nodeIdToNameMap
  // assign them their metadata values from the metadata hash of values
  // also default node naming
  mergeMetadataWithNodes(nodes, metadata, nodeIdToNameMap) {
    for (let [_id, _name] of Object.entries(nodeIdToNameMap)) {
      if (nodes[_name] == undefined) {
        nodes[_name] = {}
      }

      if (nodes[_name]['name'] == undefined) {
        nodes[_name]['name'] = _name
      }

      for (let [key, keyMetadata] of Object.entries(metadata)) {
        let nodeKeyValue = nodes[_name][key]

        if (keyMetadata.values !== undefined) {
          nodeKeyValue = keyMetadata.values[_id]
        }

        // apply categories here if they're present
        if (keyMetadata.categories !== undefined) {
          nodeKeyValue = keyMetadata.categories[nodeKeyValue]
        }

        if (nodeKeyValue !== undefined) {
          nodes[_name][key] = nodeKeyValue
        }
      }
    }

    return nodes
  }

  createLinks(edgeList, nodeNameToIdMap) {
    let linkMatrix = {}

    // reset the node degrees
    for (let id_one of Object.values(nodeNameToIdMap)) {
      linkMatrix[id_one] = {}
      for (let id_two of Object.values(nodeNameToIdMap)) {
        linkMatrix[id_one][id_two] = 0
      }
    }

    // essentially this sums up repeated/directed edges.
    edgeList.forEach((edge) => {
      let source = nodeNameToIdMap[edge[0]]
      let target = nodeNameToIdMap[edge[1]]
      let weight = edge.length == 3
        ? parseFloat(edge[2])
        : 1

      if (source <= target) {
        linkMatrix[source][target] += weight
      }
      else {
        linkMatrix[target][source] += weight
      }
    })

    let links = []
    for (let [source, targets] of Object.entries(linkMatrix)) {
      for (let [target, edgeWeight] of Object.entries(targets)) {
        if (edgeWeight) {
          links.push([source, target, edgeWeight])
        }
      }
    }

    return links
  }

  // adds `degree`
  // if the network is weighted, adds `strength`
  addEdgeMetadataToNodes(links, nodes, nodeIdToNameMap) {
    Object.values(nodes).forEach((node) => {
      node.degree = 0
      node.strength = 0
    })

    links.forEach((l) => {
      let source = nodeIdToNameMap[l[0]]
      let target = nodeIdToNameMap[l[1]]
      nodes[source].degree += 1
      nodes[target].degree += 1
      nodes[source].strength += l[2]
      nodes[target].strength += l[2]
    })

    return nodes
  }

  isWeighted(nodes) {
    let networkIsWeighted = false
    Object.values(nodes).forEach((node) => {
      if (node.strength !== node.degree) {
        networkIsWeighted = true
      }
    })

    return networkIsWeighted
  }

  // retrieves the nodeNames. The ordering of these is important.
  // Pulls from:
  // - nodes referenced in edges
  // - nodes in nodes object
  // - the number of elements in each metadata attribute's values list
  getNodesMentioned(edgeList, metadata, nodes) {
    let nodeNames = [];

    edgeList.forEach(function(edge) {
      nodeNames.push(edge[0]);
      nodeNames.push(edge[1]);
    });

    Object.keys(nodes).forEach(function(node) {
      nodeNames.push(node)
    })

    nodeNames = nodeNames.map(
      _id => isNaN(_id) ? _id : +_id
    )

    // take a set
    nodeNames = [... new Set(nodeNames)]
    
    let unusedName = 'UNUSED_NAME'

    if (allInts(nodeNames)) {
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
    var maxValuesCount = 0;

    if (metadata == null || metadata == undefined) {
      return maxValuesCount;
    }

    Object.values(metadata).forEach((metadatum) => {
      let values = metadatum.values

      if (values !== undefined && values.length > maxValuesCount) {
        maxValuesCount = values.length
      }
    })

    return maxValuesCount
  }

  /********************************************************************************
   *
   *
   *
   * Node Attributes
   * 
   * 
   * 
  ********************************************************************************/
  // iterates over all of the nodes and identifies the set of metadata we can
  // include in the visualization.
  getAttributes(nodes, metadata, isWeighted) {
    let attributes = [
      [Attribute, 'none'],
      [DegreeAttribute, 'degree'],
    ]

    if (isWeighted === true) {
      attributes.push([DegreeAttribute, 'strength'])
    }

    const metadataAttributes = this.getMetadataAttributes(nodes, metadata)
    attributes = attributes.concat(metadataAttributes)

    let attributesByType = {
      'color': {},
      'size': {},
      'noType': {},
    }

    attributes.map(([attributeClass, key]) => {
      const attribute = new attributeClass(key, nodes)
      let addedAttribute = false

      if (attributeClass.DISPLAY_COLOR) {
        attributesByType.color[key] = attribute
        let addedAttribute = true
      }

      if (attributeClass.DISPLAY_SIZE) {
        attributesByType.size[key] = attribute
        let addedAttribute = true
      }

      if (! attributeClass.DISPLAY_COLOR && ! attributeClass.DISPLAY_SIZE) {
        attributesByType.noType[key] = attribute
        let addedAttribute = true
      }

      if (addedAttribute) {
        for (let [nodeKey, node] of Object.entries(nodes)) {
          nodes[nodeKey][key] = attribute.transformNodeValue(node[key])
        }
      }
    })

    return [attributesByType, nodes]
  }

  getMetadataAttributes(nodes, metadata) {
    let allKeys = [] 
    Object.values(nodes).map((node) => {
      let keys = Node.filterMetadataKeys(node)
      allKeys = allKeys.concat(keys)
    })
    allKeys = d3.set(allKeys).values().sort()

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
    if (key === 'name') {
      return NameAttribute
    }

    const nodeValues = Object.values(nodes).map(node => node[key])
    if (key === 'color' && UserColorAttribute.isType(nodeValues)) {
      return UserColorAttribute
    }

    for (let AttributeClass of [BinaryAttribute, CategoricalAttribute, ScalarAttribute]) {
      if (type !== undefined) {
        if (type === AttributeClass.TYPE) {
          return AttributeClass
        }
      }
      else if (AttributeClass.isType(nodeValues)) {
        return AttributeClass
      }
    }

    return undefined
  }
}
function allInts(vals) {
    for (var i in vals) {
        if (!isInt(vals[i])) {
            return false;
        }
    }

    return true;
}

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}
