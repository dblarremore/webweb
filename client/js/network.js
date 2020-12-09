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
  constructor(networkData, global, menu, canvas) {
    this.global = global
    this.menu = menu
    this.canvas = canvas

    // if there are no layers, put things into layers
    this.rawLayers = networkData.layers || [{
      'edgeList' : networkData.edgeList,
      'nodes' : networkData.nodes,
      'metadata' : networkData.metadata,
      'display': networkData.display,
    }]

    this.layers = new Array(this.rawLayers.length)

    // TODO
    // we should later slurp in `network` settings here
    // and apply them so there's 'inherited' settings
    this.settingsHandler = this.makeSettingsHandler(this.global.settings)
  }

  makeSettingsHandler(settings) {
    const definitions = NetworkParameters
    definitions.layer.options = [...Array(this.layers.length).keys()]

    return new SettingsHandler(
      definitions,
      settings,
      utils.getCallHandler(this.handlers),
      this.menu,
    )
  }

  get handlers() {
    return {
      'change-layer': settings => this.displayLayer(settings.layer),
      'change-visualization': settings => this.displayVisualization(settings.plotType),
    }
  }

  get layer() {
    const layerIndex = this.settingsHandler.settings.layer

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

    this.settingsHandler.settings.layer = layer
    this.settingsHandler.updateSettings(this.settingsHandler.settings)
    this.displayVisualization(this.settingsHandler.settings.plotType)
  }

  displayVisualization(plotType) {
    this.settingsHandler.plotType = plotType

    if (this.visualization !== undefined) {
      this.settingsHandler.settings = this.visualization.settingsHandler.remove(
        this.settingsHandler.settings
    )
      this.nodePositions = this.visualization.nodePositions
    }

    this.visualization = plotType
    this.visualization.redraw(this.settingsHandler.settings)
  }

  get visualization() { return this._visualization }
  set visualization(plotType) {
    if (plotType === undefined) {
      this._visualization = undefined
    }
    else {
      const VisualizationConstructor = this.visualizationTypes[plotType]
      this._visualization = new VisualizationConstructor(
        this.global.settings,
        this.menu,
        this.canvas,
        this.layer,
        this.nodePositions,
      )

      this.canvas.visualization = this._visualization
    }
    
    return this._visualization
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
