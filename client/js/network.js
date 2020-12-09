import { Layer } from './layer'
import { ForceDirectedVisualization } from './visualizations/force_directed'
import { ChordDiagramVisualization } from './visualizations/chord_diagram'
import { AdjacencyMatrixVisualization } from './visualizations/adjacency_matrix'
import { NetworkParameters } from './parameters'
import { SettingsHandler } from './settings_handler'
import * as utils from './utils'

export class Network {
  get visualizationTypes() {
    return {
      'Force Directed': ForceDirectedVisualization,
      'Chord Diagram': ChordDiagramVisualization,
      'Adjacency Matrix': AdjacencyMatrixVisualization,
    }
  }

  constructor(networkData, global, controller) {
    this.controller = controller
    this.global = global

    // if there are no layers, put things into layers
    this.rawLayers = networkData.layers || [{
      'edgeList' : networkData.edgeList,
      'nodes' : networkData.nodes,
      'metadata' : networkData.metadata,
      'display': networkData.display,
    }]

    this.layers = new Array(this.rawLayers.length)

    this.makeParameters()
  }

  makeParameters(settings) {
    // TODO
    // we should later slurp in `network` settings here and apply them so
    // there's 'inherited' settings
    if (this.controller.collections['network'] !== undefined) {
      return
    }

    const definitions = NetworkParameters
    definitions.layer.options = [...Array(this.layers.length).keys()]


    this.controller.addParameterCollection(
      'network',
      definitions,
      utils.getCallHandler(this.handlers),
    )
  }

  get handlers() {
    return {
      'change-layer': settings => this.displayLayer(settings.layer),
      'change-visualization': settings => this.displayVisualization(settings.plotType),
    }
  }

  get layer() {
    const layerIndex = this.controller.settings.layer

    if (this.layers[layerIndex] === undefined) {
      const rawLayer = this.rawLayers[layerIndex]
      this.layers[layerIndex] = new Layer(this.rawLayers[layerIndex], this.global)
    }

    return this.layers[layerIndex]
  }

  displayLayer(layer) {
    // when we start displaying, default the layer to 0 unless it's specified
    if (layer === undefined || layer < 0 || this.layers.length < layer - 1) {
      layer = 0
    }

    this.controller.settings.layer = layer
    this.controller.updateSettings(this.controller.settings)
    this.displayVisualization(this.controller.settings.plotType)
  }

  displayVisualization(plotType) {
    this.controller.plotType = plotType

    if (this.visualization !== undefined) {
      this.controller.removeParameterCollection('visualization')
      this.nodePositions = this.visualization.nodePositions
    }

    const VisualizationConstructor = this.visualizationTypes[this.controller.plotType]
    this.visualization = new VisualizationConstructor(
      this.controller,
      this.layer,
      this.nodePositions,
    )
  }

  get nodePositions() { return this._nodePositions }
  set nodePositions(newNodePositions) {
    if (this._nodePositions == undefined) {
      this._nodePositions = {}
    }

    Object.entries(newNodePositions).forEach(
      ([name, position]) => this._nodePositions[name] = position
    )
  }
}
