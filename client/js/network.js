import * as d3 from 'd3'
import { AllSettings } from './controller'
import { NodeKey } from './node'
import { Link } from './link'
export class Network {
  // TODO:
  // - add in the idea of a network knowing about the metadata it has that are relevant
  //    - i.e., should _here_ call `getMetadatumType`

  // standardizes the format of a network
  constructor(name, data, globalMetadata, globalNodes) {
    this.name = name
    this.metadata = {}
    this.globalMetadata = globalMetadata
    this.globalNodes = globalNodes || {};

    this.layers = this.makeLayers(data)

  }

  updateState(metadata) {
    this.state = new AllSettings(metadata)
  }

  // if there are no layers, put things into layers
  makeLayers(data) {
    let layers = data.layers

    if (layers == undefined) {
      layers = [
        {
          'edgeList' : data.edgeList,
          'nodes' : data.nodes,
          'metadata' : data.metadata,
          'display': data.display,
        }
      ]
    }

    for (let [i, layer] of layers.entries()) {
      // edgelist operations
      let edgeList = layer.edgeList == undefined ? [] : layer.edgeList
      edgeList = this.regularizeLayerEdgeList(edgeList)

      // metadata operstions
      let metadata = layer.metadata == undefined ? {} : layer.metadata
      metadata = this.regularizeLayerMetadata(metadata, this.globalMetadata)

      // node operstions
      let nodes = layer.nodes == undefined ? {} : layer.nodes
      nodes = this.regularizeLayerNodes(nodes, this.globalNodes)

      let nodeNameToIdMap = this.getNodeNameToIdMap(edgeList, metadata, nodes)
      let nodeIdToNameMap = Object.fromEntries(Object.entries(nodeNameToIdMap).map(([k, v]) => ([v, k])))

      // assign metadata from the metadata vector onto the nodes
      nodes = this.mergeMetadataWithNodes(nodes, metadata, nodeIdToNameMap)

      // TODO:
      // console.log(JSON.stringify('must do something here with edgeWeights'));
      // this.scales.links.width.domain(d3.extent(edgeWeights));
      // this.scales.links.opacity.domain(d3.extent(edgeWeights));
      let links = this.createLinks(edgeList, nodeNameToIdMap)

      nodes = this.addEdgeMetadataToNodes(links, nodes, this.isUnweighted(nodes))

      let displayableMetadata = this.getDisplayableMetadata(nodes, metadata)

      layers[i] = {
        "edgeList": edgeList,
        "links": links,
        "displayableMetadata":displayableMetadata,
        "metadata": metadata,
        "nodes": nodes,
        "nodeNameToIdMap": nodeNameToIdMap,
        "nodeIdToNameMap": nodeIdToNameMap,
        "edgeWeights": links.map(link => link.weight),
        "nodeCount": Object.keys(nodeNameToIdMap).length,
        'display': layer.display,
      }
    }

    return layers
  }

  // iterates over all of the nodes and identifies the set of metadata we can
  // include in the visualization.
  getDisplayableMetadata(nodes, metadata) {
    let allMetadata = {
      'degree': {
        'type': 'degree',
      },
      'strength': {
        'type': 'degree',
      },
    }

    let nodeKeyer = new NodeKey()

    Object.entries(nodes).forEach(([id, node]) => {
      let metadataKeys = nodeKeyer.filterMetadataKeys(Object.keys(node), node)
      for (let key of metadataKeys) {
        if (allMetadata[key] == undefined) {
          if (metadata !== undefined) {
            let keyMetadata = metadata[key] || {}

            let values = this.getRawNodeValues(nodes, key)

            if (keyMetadata.type == undefined) {
              keyMetadata.type = this.getValuesType(values)
            }

            if (keyMetadata.type == "categorical" || keyMetadata.categories !== undefined) {
              keyMetadata = this.setCategoricalMetadataInfo(keyMetadata, values)
            }

            allMetadata[key] = keyMetadata == undefined ? {} : keyMetadata
          }
        }
      }
    })

    allMetadata['none'] = {
      'type' : 'none',
    }

    delete allMetadata['name']

    return allMetadata
  }

  setCategoricalMetadataInfo(keyMetadata, values) {
    if (keyMetadata.categories == undefined) {
      keyMetadata.categories = d3.set(values).values().sort()
    }

    if (keyMetadata.categories.length >= 9) {
      keyMetadata.type = 'scalarCategorical'
    }
    else {
      keyMetadata.type = 'categorical'
    }

    return keyMetadata
  }

  getRawNodeValues(nodes, key) {
    return Object.values(nodes).map(node => node[key])
  }

  getValuesType(values) {
    let q = d3.set(values).values().sort()

    // check if this is a binary relation
    if (q.length == 2 && q[0] == 'false' && q[1] == 'true') {
        return 'binary'
    }
    else if (q.length == 2 && q[0] == 'false' && q[1] == 'undefined') {
        return 'binary'
    }
    else if (q.length == 2 && q[0] == 'true' && q[1] == 'undefined') {
        return 'binary'
    }
    else if (q.length == 1 && (q[0] == 'false' || q[0] == 'true')) {
      return 'binary'
    }
    else if (q.some(isNaN)) {
      return 'categorical'
    }

    return 'scalar'
  }

  // adds `degree`
  // if the network is weighted, adds `strength`
  addEdgeMetadataToNodes(links, nodes, isUnweighted) {
    Object.values(nodes).forEach((node) => {
      node.degree = 0
      node.strength = 0
    })

    links.forEach((l) => {
      nodes[l['source']].degree += 1
      nodes[l['target']].degree += 1
      nodes[l['source']].strength += l['weight']
      nodes[l['target']].strength += l['weight']
    })

    if (isUnweighted) {
      Object.values(nodes).forEach((node) => {
        delete node.strength
      })
    }

    return nodes
  }

  isUnweighted(nodes) {
    let networkIsUnweighted = true
    Object.values(nodes).forEach((node) => {
      if (node.strength !== node.degree) {
        networkIsUnweighted = false
      }
    })

    return networkIsUnweighted
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
          links.push({
            'source': source,
            'target': target,
            'weight': edgeWeight
          })
        }
      }
    }

    return links
  }

  // does some cleaning on node representations.
  // - adds keys from global nodes if a node is present
  // important for nodeNameToIdMap)
  regularizeLayerNodes(nodes, globalNodes) {
    let newNodes = {}

    for (let [_id, node] of Object.entries(nodes)) {
      // default the node to this layer's nodes
      let newNode = node

      let globalNode = globalNodes[_id] !== undefined ? globalNodes[_id] : {}

      // if there is a global node, add its values, but don't overwrite
      for (let [attributeKey, attributeValue] of Object.entries(globalNode)) {
        if (newNode[attributeKey] == undefined) {
          newNode[attributeKey] = attributeValue;
        }
      }

      _id = isNaN(_id) ? _id : +_id
      newNodes[_id] = newNode
    }
    return newNodes
  }

  // cleans up metadata representation.
  regularizeLayerMetadata(layerMetadata, globalMetadata) {
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

    return newLayerMetadata;
  }

  // we want to convert "string" edges into int edges
  regularizeLayerEdgeList(edgeList) {
    let regularizedEdgeList = []
    for (let edge of edgeList) {
      // there may or may not be a weight on the edge
      // so copy it and modify only the ids pointed to
      let regularizedEdge = edge.slice(0)

      let source = edge[0];
      let target = edge[1];

      regularizedEdge[0] = isNaN(source) ? source : +source
      regularizedEdge[1] = isNaN(target) ? target : +target
      regularizedEdgeList.push(regularizedEdge)
    }

    return regularizedEdgeList
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

    if (allInts(nodeNames)) {
        nodeNames.sort(function(a, b){return a-b});
    }
    
    // add in the max count from the metadata values
    const metadataCount = this.maxMetadataValuesCount(metadata)

    while (nodeNames.length < metadataCount) {
      nodeNames.push(null)
    }

    return nodeNames
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

      for (let [metadataKey, metadataValues] of Object.entries(metadata)) {
        if (metadataValues.values !== undefined) {
          nodes[_name][metadataKey] = metadataValues.values[_id]
        }
      }
    }

    return nodes
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
