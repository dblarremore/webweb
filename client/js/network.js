import { Layer } from './layer'

export class Network {
  constructor(name, data, globalMetadata, globalNodes) {
    this.name = name
    this.globalMetadata = globalMetadata
    this.globalNodes = globalNodes

    this.layers = this.makeLayers(data)
  }

  // if there are no layers, put things into layers
  makeLayers(data) {
    let rawLayers = data.layers || [{
      'edgeList' : data.edgeList,
      'nodes' : data.nodes,
      'metadata' : data.metadata,
      'display': data.display,
    }]

    let layers = []
    for (let rawLayer of rawLayers) {
      let layer = new Layer(
        rawLayer.edgeList, rawLayer.nodes, rawLayer.metadata, rawLayer.display,
        this.globalMetadata, this.globalNodes
      )
      layers.push(layer)
    }

    return layers
  }
}
