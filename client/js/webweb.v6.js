/*
 * webweb makes pretty interactive network diagrams in your browser
 *
 * Daniel Larremore + Contributors
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */

import { Menu } from './menu'
import { GlobalListeners } from './listeners'
import { WebwebSettings } from './settings_object'
import { Network } from './network'
import { WebwebCanvas } from './canvas'
import { ForceDirectedVisualization } from './visualizations/force_directed'
import { ChordDiagramVisualization } from './visualizations/chord_diagram'
import { AdjacencyMatrixVisualization } from './visualizations/adjacency_matrix'
import { BasicWebwebWidgets } from './widget'
import * as widgets  from './widget'
import * as utils from './utils'

import * as d3 from 'd3'
import { saveAs } from 'file-saver'

import '../css/style.css'

export class Webweb {
  constructor(webwebData) {
    window.addEventListener("load", () => this.init(webwebData))
  }

  init(webwebData) {
    this.title = webwebData.title || 'webweb'

    const networkNames = Object.keys(webwebData.networks) || ['webweb']
    const globalNodes = webwebData.display.nodes

    this.globalSettings = webwebData.display

    this.settings = WebwebSettings.getSettings(webwebData.display)
    this.settings['networkNames'] = networkNames

    if (this.settings['networkName'] === undefined) {
      this.settings['networkName'] = networkNames[0]
    }

    this.networks = {}
    this.settings['networkLayers'] = {}
    for (let [networkName, networkData] of Object.entries(webwebData.networks)) {
      let network = new Network(networkName, networkData, this.settings.metadata, globalNodes)
      this.networks[networkName] = network
      this.settings['networkLayers'][networkName] = network.layers.length
    }

    let box = this.getBox(this.title, this.settings)
    this.settings = this.setVizualizationDimensions(box, this.settings)

    this.menu = new Menu(this.settings.hideMenu)
    box.appendChild(this.menu.HTML)

    this.menu.addWidgets(this.widgetKey, 'left', BasicWebwebWidgets(), this.settings, this.callHandler)

    this.canvas = new WebwebCanvas(this.settings.width, this.settings.height)
    box.append(this.canvas.box)

    this.listeners = new GlobalListeners(this.callHandler)

    this.displayNetwork(this.settings)
  }

  get widgetKey() { return 'webweb-all' }
  get callHandler() { return utils.getCallHandler(this.handlers) }

  get handlers() {
    return {
      'display-network': settings => this.displayNetwork(settings),
      'redraw': settings => this.canvas.redraw(),
      'save-svg': () => {
        let svg = this.canvas.svgDraw()
        const title = this.settings.networkName
        svg.setAttribute("title", title)
        svg.setAttribute("version", 1.1)
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")

        try {
          let blob = new Blob([svg.outerHTML], {type: "image/svg+xml"})
          saveAs(blob, title);
        } catch (e) {
          alert("can't save :(")
        }
      },
      'save-canvas': (settings) => {
        const link = document.createElement('a')
        link.download = settings.networkName + ".png"
        link.href = this.canvas.HTML.toDataURL()
        link.click()
      }
    }
  }

  displayNetwork(settings) {
    this.cleanSlate()

    // TODO: nix
    settings = this.defaultSettingsAfterNetworkChange(settings)
    // TODO: ^nix

    this.listeners.settings = settings
    let layer = this.getLayerDisplayedBySettings(settings)

    console.log('changing settings is going to fuck everything up.')
    const Visualizer = this.getVisualizer(settings)
    settings = this.globalSettings

    this.visualization = new Visualizer(settings, this.menu, this.canvas, layer, this.nodePositions)
    this.canvas.draw()
  }

  cleanSlate() {
    this.menu.removeWidgets('visualization')

    if (this.visualization !== undefined) {
      this.nodePositions = this.visualization.nodePositions
      this.canvas.removeListeners(this.visualization.listeners)
    }
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

  getVisualizer(settings) {
    let Visualizer = undefined
    if (settings.plotType == 'Force Directed') {
      Visualizer = ForceDirectedVisualization
    }
    else if (settings.plotType == 'Chord Diagram') {
      Visualizer = ChordDiagramVisualization
    }
    else if (settings.plotType == 'Adjacency Matrix') {
      Visualizer = AdjacencyMatrixVisualization
    }
    return Visualizer
  }

  defaultSettingsAfterNetworkChange(settings) {
    let network = this.networks[settings.networkName]

    // would be nice to cache last network layer :|
    if ((settings['networkLayer'] < 0) || (network.layers.length <= settings['networkLayer'])) {
      settings['networkLayer'] = 0
    }

    let layer = network.layers[settings['networkLayer']]

    this.menu.updateWidgets(settings, this.widgetKey)

    // settings = this.defaultDoByAttribute(settings, layer.attributes, 'size')
    // settings = this.defaultDoByAttribute(settings, layer.attributes, 'color')

    return settings
  }

  defaultDoByAttribute(settings, attributes, doByType) {
    let doByKey = doByType + 'By'
    if (! Object.keys(attributes[doByType]).includes(settings[doByKey])) {
      settings[doByKey] = 'none'
    }

    return settings
  }

  getLayerDisplayedBySettings(settings) {
    let networkName = settings.networkName
    let network = this.networks[networkName]

    let layerIndex = settings.networkLayer
    let layer = network.layers[layerIndex]

    return layer
  }

  ////////////////////////////////////////////////////////////////////////////////
  // HTML Manipulations
  ////////////////////////////////////////////////////////////////////////////////
  getBox(title, settings) {
    let box

    if (settings.attachWebwebToElementWithId !== undefined) {
      box = document.getElementById(settings.attachWebwebToElementWithId)
    }
    else {
      box = document.createElement('div')
      box.classList.add('webweb-center')
      document.getElementsByTagName("body")[0].appendChild(box)

      if (title !== undefined) {
        document.title = title
      }
    }

    return box
  }

  setVizualizationDimensions(box, settings) {
    if (settings.width == undefined) {
        let heuristic = box.clientWidth - 3 * 20

        if (heuristic <= 0) {
            heuristic = 1000
        }
        settings.width = Math.min.apply(null, [heuristic, 1000])
    }

    if (settings.height == undefined) {
        settings.height = Math.min.apply(null, [settings.width, 600])
    }

    return settings
  }
}
