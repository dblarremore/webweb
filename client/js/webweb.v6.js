import { colorbrewer } from './colors'
import { Menu } from './menu'
import { GlobalListeners } from './listeners'
import { Node } from './node'
import { Link } from './link'
import { Legend } from './legend'
import { AllSettings } from './controller'
import { Network } from './network'
import { Simulation } from './simulation'
import { CanvasState } from './canvas'
import * as d3 from 'd3'

import { saveAs } from 'file-saver'
import { Blob } from 'blob-polyfill'

export class Webweb {
  constructor(webwebData) {
    this.title = webwebData.title || 'webweb'

    this.networkNames = Object.keys(webwebData.networks) || ['webweb']
    this.globalNodes = webwebData.display.nodes

    this.scales = {
      'nodeSize' : d3.scaleLinear(),
      'scalarColors' : d3.scaleLinear(),
      'categoricalColors' : d3.scaleOrdinal(),
      'linkWidth' : d3.scaleLinear(),
      'linkOpacity' : d3.scaleLinear(),
      'none': x => x,
    }

    // STATE
    this.state = {
      'global': {},
      'on_display': {},
    }

    this.state.global = new AllSettings(webwebData.display)
    let settings = this.state.global.settings

    if (settings['networkName'] == undefined) {
      settings['networkName'] = this.networkNames[0]
      this.networkName = this.networkNames[0]
    }
    else {
      this.networkName = settings['networkName']
    }

    settings['networkNames'] = this.networkNames

    // NETWORKS
    this.maxNodes = 0
    this.networks = {}
    settings['networkLayers'] = {}
    for (let [networkName, networkData] of Object.entries(webwebData.networks)) {
      let network = new Network(networkName, networkData, this.state.global, this.globalNodes)
      this.networks[networkName] = network

      for (let layer of network.layers) {
        if (layer.nodeCount > this.maxNodes) {
          this.maxNodes = layer.nodeCount
        }
      }

      settings['networkLayers'][networkName] = network.layers.length
    }

    // NODES
    this.nodes = []
    for (let i = 0; i < this.maxNodes; i++) {
      let node = new Node(i)
      this.nodes.push(node)
    }

    this.nodesPersistence = []

    this.simulation = new Simulation(this.nodes, settings)

    let box = this.getBox(this.title, settings)
    settings = this.setVizualizationDimensions(box, settings)

    for (let networkName of Object.keys(this.networks)) {
      this.networks[networkName].updateState(new AllSettings(settings))
    }

    let layer = this.getLayerDisplayedBySettings(settings)

    if (! settings.hideMenu) {
      this.menu = new Menu(settings, layer.attributes, this.getCallHandler())
      box.appendChild(this.menu.HTML)
    }

    let canvas = new CanvasState(settings, this.simulation)
    box.append(canvas.box)
    this.canvas = canvas

    let listeners = new GlobalListeners(settings, this.getCallHandler())

    this.displayNetwork(this.networkName, settings)
  }

  // object that will hopefully make things nicer and give only restricted
  // access to the widgets
  getCallHandler() {
    let _this = this
    let handleFunction = (request, settings) => {
      const handler = {
        'display-network': function(settings) {
          _this.displayNetwork(settings.networkName, settings)
        },
        'freeze-nodes':  function(settings) {
          if (settings.freezeNodeMovement) {
            _this.simulation.freeze()
          }
          else {
            _this.simulation.unfreeze()
          }
          _this.simulation.simulation.tick()
        },
        'update-sim': function(settings) {
          _this.simulation.update(settings)
        },
        'redraw': (settings) => {
          _this.canvas.settings = settings
          _this.canvas.redraw()
        },
        'update-scales': (settings) => {
          _this.updateScales(settings)
          _this.canvas.settings = settings
          _this.canvas.redraw()
        },
        'save-svg': () => {
          var svg = _this.canvas.svgDraw()
          const title = _this.state.global.settings.networkName
          svg.setAttribute("title", title)
          svg.setAttribute("version", 1.1)
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")

          try {
            var isFileSaverSupported = !!new Blob()
            var blob = new Blob([svg.outerHTML], {type: "image/svg+xml"})
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
    for (let node of this.simulation.nodes) {
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
    for (let [_id, node] of Object.entries(this.simulation.nodes)) {
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
          this.simulation.nodes[_id][key] = val
        })
      }
    }
  }

  displayNetwork(networkName, settings) {
    let network = this.networks[networkName]

    // would be nice to cache last network layer :|
    if ((settings['networkLayer'] < 0) || (network.layers.length <= settings['networkLayer'])) {
      settings['networkLayer'] = 0
    }
    let layer = network.layers[settings['networkLayer']]

    this.canvas.settings = settings

    this.menu.refresh(settings, layer.attributes)

    this.setVisibleNodes(layer.nodeCount)
    this.applyNodeMetadata(settings, layer.nodes, layer.nodeNameToIdMap, layer.nodeIdToNameMap)

    this.updateScales(settings)

    this.simulation.links = this.getLinks(layer, this.simulation.nodes, this.scales)
    this.simulation.update(settings)

    // if we've frozen node movement manually tick so new edges are evaluated.
    if (settings.freezeNodeMovement) {
      this.simulation.simulation.tick()
    }

  }

  getLinks(layer, nodes, scales) {
    return layer.links.map((edge) => {
      const source = nodes[edge[0]]
      const target = nodes[edge[1]]
      const weight = edge[2]
      const width = scales.linkWidth(weight)
      const opacity = scales.linkOpacity(weight)

      return new Link(source, target, weight, width, opacity)
    })
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
      box.setAttribute('id', 'webweb-center')
      document.getElementsByTagName("body")[0].appendChild(box)

      if (title !== undefined) {
        document.title = title
      }
    }

    return box
  }

  setVizualizationDimensions(box, settings) {
    if (settings.w == undefined) {
        let heuristic = box.clientWidth - 3 * 20

        if (heuristic <= 0) {
            heuristic = 1000
        }
        settings.w = Math.min.apply(null, [heuristic, 1000])
    }

    if (settings.h == undefined) {
        settings.h = Math.min.apply(null, [settings.w, 600])
    }

    return settings
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Scales
  ////////////////////////////////////////////////////////////////////////////////
  updateScales(settings) {
    let layer = this.getLayerDisplayedBySettings(settings)
    let nodes = this.simulation.nodes

    let sizeAttribute = layer.attributes.size[settings.sizeBy]
    let colorAttribute = layer.attributes.color[settings.colorBy]

    if (sizeAttribute == undefined) {
      sizeAttribute = layer.attributes.size.none
    }
    if (colorAttribute == undefined) {
      colorAttribute = layer.attributes.color.none
    }

    sizeAttribute.nodes = nodes
    colorAttribute.nodes = nodes

    let sizeScaleName = sizeAttribute.sizeScale
    let colorScaleName = colorAttribute.colorScale

    const scales = {
      'linkWidth': {
        'extent': layer.edgeWeights,
      },
      'linkOpacity': {
        'extent': layer.edgeWeights,
      },
    }

    scales[sizeScaleName] = {
      'attribute': sizeAttribute,
      'extent': sizeAttribute.extent(nodes),
    }

    scales[colorScaleName] = {
      'attribute': colorAttribute,
      'extent': colorAttribute.colorExtent(nodes),
    }

    for (let [name, data] of Object.entries(scales)) {
      const extent = data.extent

      let range
      if (name == 'categoricalColors') {
        let valueSetSize = colorAttribute.valueSetSize(nodes)
        range = colorbrewer[settings.colorPalette][valueSetSize] 
      }
      else {
        if (settings.scales[name] !== undefined) {
          range = [settings.scales[name].min, settings.scales[name].max]
        }
      }

      if (name !== 'none' && this.scales[name] !== undefined) {
        this.scales[name].domain(d3.extent(extent)).range(range)
      }
    }

    Object.entries(nodes).forEach(([i, node]) => {
      node.__rawSize = sizeAttribute.getRawSizeValue(node)
      node.__scaledSize = sizeAttribute.getScaledSizeValue(node, this.scales[sizeScaleName])

      node.__rawColor = colorAttribute.getRawColorValue(node)
      node.__scaledColor = colorAttribute.getScaledColorValue(node, this.scales[colorScaleName])
    })

    let legend = new Legend(
      settings.sizeBy,
      sizeAttribute,
      settings.colorBy,
      colorAttribute,
      settings.r,
      nodes,
      this.scales,
    )

    let objects = legend.legendNodeAndText

    objects.nodes = objects.nodes.map((node) => {
      node.settings = settings
      return node
    })

    if (settings.showLegend) {
      this.canvas.legendNodes = objects.nodes
      this.canvas.legendText = objects.text
    }
  }
}
