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
  constructor(networkData, globalData, settings, menu, canvas) {
    // if there are no layers, put things into layers
    this.rawLayers = networkData.layers || [{
      'edgeList' : networkData.edgeList,
      'nodes' : networkData.nodes,
      'metadata' : networkData.metadata,
      'display': networkData.display,
    }]

    this.layers = new Array(this.rawLayers.length)

    this.settingsHandler = this.makeSettingsHandler(settings)
    this.makeSettingsHandler(settings)

    this.global = globalData
    this.menu = menu
    this.canvas = canvas
  }

  makeSettingsHandler(settings) {
    const definitions = NetworkParameters
    definitions.layer.options = [...Array(this.layers.length).keys()]

    return new SettingsHandler(
      definitions,
      settings,
      utils.getCallHandler(this.handlers),
    )
  }

  get handlers() {
    return {
      'change-layer': settings => this.displayLayer(settings),
      'change-visualization': settings => this.displayVisualization(settings),
    }
  }

  getLayer(settings) {
    const layerIndex = settings.layer
    if (this.layers[layerIndex] === undefined) {
      const rawLayer = this.rawLayers[layerIndex]
      this.layers[layerIndex] = new Layer(
        rawLayer.edgeList,
        rawLayer.nodes, rawLayer.metadata,
        this.global.nodes, this.global.metadata,
      )
    }
    return this.layers[layerIndex]
  }

  displayLayer(settings) {
    // when we start displaying, default the layer to 0 unless it's specified
    if (settings.layer === undefined || settings.layer < 0 || this.layers.length < settings.layer - 1) {
      settings.layer = 0
    }

    this.settingsHandler.updateSettings(settings)

    this.menu.addWidgets(this.settingsHandler.widgets)

    this.displayVisualization(this.settingsHandler.settings)
  }

  displayVisualization(settings) {
    if (this.visualization !== undefined) {
      this.settings = this.visualization.settingsHandler.removeFromSettingsAndMenu(settings, menu)
      this.nodePositions = this.visualization.nodePositions
    }

    this.visualization = this.settings.plotType
    this.visualization.redraw(this.settings)
  }

  get visualization() {
    return this._visualization
  }

  set visualization(plotType) {
    if (plotType === undefined) {
      this._visualization = undefined
    }
    else {
      const VisualizationConstructor = this.visualizationTypes[plotType]

      this._visualization = new VisualizationConstructor(
        this.settings,
        this.menu,
        this.canvas,
        this.getLayer(settings),
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
