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

  get callHandler() {
    if (this._callHandler === undefined) {
      this._callHandler = utils.getCallHandler(this.handlers)
    }

    return this._callHandler
  }

  makeParameters(settings) {
    // TODO
    // we should later slurp in `network` settings here and apply them so
    // there's 'inherited' settings
    if (this.controller.collections['network'] !== undefined) {
      this.controller.removeParameterCollection('network')
    }

    const definitions = NetworkParameters
    definitions.layer.options = [...Array(this.layers.length).keys()]

    this.controller.addParameterCollection(
      'network',
      definitions,
      this.callHandler,
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
    layer = parseInt(layer)
    this.controller.settings.layer = this.layerIsValid(layer) ? layer : 0
    this.displayVisualization(this.controller.settings.plotType)
    this.controller.menu.updateVisibilityFromSettings(this.controller.settings.widgetsToShowByKey)
  }

  displayVisualization(plotType) {
    this.controller.settings.plotType = plotType

    this.controller.removeParameterCollection('visualization')

    if (this.visualization !== undefined) {
      this.nodePositions = this.visualization.nodePositions
    }

    const VisualizationConstructor = this.visualizationTypes[this.controller.settings.plotType]
    this.visualization = new VisualizationConstructor(
      this.controller,
      this.layer,
      this.nodePositions,
    )

    this.controller.collections['network'].updateSettings()
  }

  layerIsValid(layer) {
    if (layer === undefined || ! utils.isInt(layer)) {
      return false
    }

    if ((0 < layer) && (layer < this.layers.length)) {
      return true
    }

    return false
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
