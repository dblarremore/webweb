/*
 * webweb makes pretty interactive network diagrams in your browser
 *
 * Daniel Larremore + Contributors
 * daniel.larremore@colorado.edu
 * http://github.com/dblarremore/webweb
 * Comments and suggestions always welcome.
 *
 */

import { colorbrewer } from './colors'
import { Menu } from './menu'
import { GlobalListeners } from './listeners'
import { Node } from './node'
import { WebwebSettings, AllSettings } from './settings_object'
import { Network } from './network'
import { WebwebCanvas } from './canvas'
import { ForceDirectedVisualization } from './visualizations/force_directed'
import { ChordDiagramVisualization } from './visualizations/chord_diagram'
import  * as widgets  from './widget'

import '../css/style.css'

import * as d3 from 'd3'
import { saveAs } from 'file-saver'

export class Webweb {
  constructor(webwebData) {
    window.addEventListener("load", () => this.init(webwebData))
  }

  init(webwebData) {
    this.title = webwebData.title || 'webweb'

    const networkNames = Object.keys(webwebData.networks) || ['webweb']
    const globalNodes = webwebData.display.nodes

    this.scales = {
      'nodeSize' : d3.scaleLinear(),
      'scalarColors' : d3.scaleLinear(),
    }

    this.globalSettings = webwebData.display

    this.settings = WebwebSettings.getSettings(webwebData.display)
    this.settings['networkNames'] = networkNames

    if (this.settings['networkName'] === undefined) {
      this.settings['networkName'] = networkNames[0]
    }

    // NETWORKS
    this.maxNodes = 0
    this.networks = {}
    this.settings['networkLayers'] = {}
    for (let [networkName, networkData] of Object.entries(webwebData.networks)) {
      let network = new Network(networkName, networkData, this.settings.metadata, globalNodes)
      this.networks[networkName] = network
      this.maxNodes = Math.max(this.maxNodes, network.maxNodes)
      this.settings['networkLayers'][networkName] = network.layers.length
    }

    // NODES
    this.nodes = []
    for (let i = 0; i < this.maxNodes; i++) {
      this.nodes.push(new Node(i))
    }

    this.nodesPersistence = []

    let box = this.getBox(this.title, this.settings)
    this.settings = this.setVizualizationDimensions(box, this.settings)

    this.menu = new Menu(this.settings.hideMenu)
    box.appendChild(this.menu.HTML)

    this.menu.addWidgets('webweb-all', 'left', this.defaultMenuWidgets, this.settings, this.callHandler)

    this.canvas = new WebwebCanvas(this.settings)
    box.append(this.canvas.box)

    let listeners = new GlobalListeners(this.callHandler)

    this.displayNetwork(this.settings)
  }

  get defaultMenuWidgets() {
    return {
      'network': [
        widgets.NetworkSelectWidget,
        widgets.NetworkLayerSelectWidget
      ],
      'save': [
        widgets.SaveSVGWidget,
        widgets.SaveCanvasWidget
      ]
    }
  }

  // object that will hopefully make things nicer and give only restricted
  // access to the widgets
  get callHandler() {
    let _this = this
    let handleFunction = (request, settings) => {
      const handler = {
        'display-network': function(settings) {
          _this.displayNetwork(settings)
        },
        'redraw': (settings) => {
          _this.canvas.settings = settings
          _this.canvas.redraw()
        },
        'save-svg': () => {
          let svg = _this.canvas.svgDraw()
          const title = _this.settings.networkName
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
          link.href = _this.canvas.HTML.toDataURL()
          link.click()
        }
      }

      let fn = handler[request]
      if (fn !== undefined) {
        fn(settings)
      }
    }

    return handleFunction
  }

  /* nodes persist between layers (for the simulation's sake), so when the
   * network changes:
   * - reset the node metadata
   *    - save those nodes' x/y positions under their name, for later layer-coherence
   * - for all the nodes in the layer metadata, use the nodeNameToIdMap to set
   *   corresponding node's values
   * - for any node in the old network that also exists in the new one:
   *    - set that new node's x/y positions to the old one's
    * */
  applyNodeMetadata(settings, nodeMetadata, nodeNameToIdMap, nodeIdToNameMap) {
    let nodeNamesToPositions = {}

    // save coords & reset metadata
    for (let node of this.nodes) {
      let nodeName = node.name
      nodeNamesToPositions[nodeName] = {
        'x': node.x,
        'y': node.y,
        'fx': node.fx,
        'fy': node.fy,
        'vx': node.vx,
        'vy': node.vy,
      }
      node.resetMetadata()
      node.settings = settings
    }

    // set metadata of nodes in new network
    for (let [_id, node] of Object.entries(this.nodes)) {
      let _name = nodeIdToNameMap[_id]

      if (_name !== undefined) {
        Object.entries(nodeMetadata[_name]).forEach(([key, value]) => {
          node[key] = value
        })
      }
    }

    // reapply coords of nodes in old & new network
    for (let [name, coords] of Object.entries(nodeNamesToPositions)) {
      let _id = nodeNameToIdMap[name]
      if (_id !== undefined) {
        Object.entries(coords).forEach(([key, val]) => {
          this.nodes[_id][key] = val
        })
      }
    }
  }

  displayNetwork(settings) {
    settings = this.defaultSettingsAfterNetworkChange(settings)
    let layer = this.getLayerDisplayedBySettings(settings)

    if ((settings.colorPalette == undefined) && (settings.colorBy !== 'none')) {
      settings.colorPalette = layer.attributes.color[settings.colorBy].colorScales[0]
    }

    console.log('this is going to fuck everyting up. what this is is: changing settings')
    settings = this.globalSettings

    if (this.visualization !== undefined) {
      this.canvas.removeListeners(this.visualization.listeners)
    }

    this.canvas.context.restore()
    this.canvas.settings = settings

    this.setVisibleNodes(layer.nodeCount)
    this.applyNodeMetadata(settings, layer.nodes, layer.nodeNameToIdMap, layer.nodeIdToNameMap)

    let Visualizer = undefined
    if (settings.plotType == 'ForceDirected') {
      Visualizer = ForceDirectedVisualization
    }
    else if (settings.plotType == 'ChordDiagram') {
      Visualizer = ChordDiagramVisualization
    }
    
    this.canvas.context.save()
    this.visualization = new Visualizer(settings, this.menu, this.canvas, layer, this.nodes)
    this.canvas.visualization = this.visualization

    // this.visualization.update(settings, layer, this.nodes)
    this.visualization.draw(this.canvas.mouseState)
  }

  defaultSettingsAfterNetworkChange(settings) {
    let network = this.networks[settings.networkName]

    // would be nice to cache last network layer :|
    if ((settings['networkLayer'] < 0) || (network.layers.length <= settings['networkLayer'])) {
      settings['networkLayer'] = 0
    }

    let layer = network.layers[settings['networkLayer']]

    settings = this.defaultDoByAttribute(settings, layer.attributes, 'size')
    settings = this.defaultDoByAttribute(settings, layer.attributes, 'color')

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
  // adds/removes nodes from the visualization
  ////////////////////////////////////////////////////////////////////////////////
  setVisibleNodes(nodeCount) {
    const count = nodeCount || this.maxNodes

    if (count < this.nodes.length) {
        while (count != this.nodes.length) {
            var node = this.nodes.pop()
            this.nodesPersistence.push(node)
        }
    }
    else if (count > this.nodes.length) {
        while (count != this.nodes.length) {
            var node = this.nodesPersistence.pop()
            this.nodes.push(node)
        }
    }
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

  ////////////////////////////////////////////////////////////////////////////////
  // Scales
  ////////////////////////////////////////////////////////////////////////////////
  updateScales(settings) {
    let layer = this.getLayerDisplayedBySettings(settings)
    let nodes = this.nodes

    let sizeAttribute = layer.attributes.size[settings.sizeBy]
    let colorAttribute = layer.attributes.color[settings.colorBy]

    if (sizeAttribute == undefined) {
      sizeAttribute = layer.attributes.size.none
    }

    if (colorAttribute == undefined) {
      colorAttribute = layer.attributes.color.none
    }

    // const scales = {
    //   'linkWidth': {
    //     'extent': layer.edgeWeights,
    //   },
    //   'linkOpacity': {
    //     'extent': layer.edgeWeights,
    //   },
    // }

    // for (let [name, data] of Object.entries(scales)) {
    //   let range = []
    //   if (settings.scales[name] !== undefined) {
    //     range = [settings.scales[name].min, settings.scales[name].max]
    //   }

    //   let extent = d3.extent(data.extent)

    //   if (name !== 'none' && this.scales[name] !== undefined) {
    //     if (extent !== undefined) {
    //       this.scales[name].domain(extent)
    //     }

    //     if (range) {
    //       this.scales[name].range(range)
    //     }
    //   }
    // }

    Object.entries(nodes).forEach(([i, node]) => {
      node.__scaledSize = sizeAttribute.getNodeNumericalValue(node)
      node.__scaledColor = colorAttribute.getNodeColorValue(node)
    })
  }
}
