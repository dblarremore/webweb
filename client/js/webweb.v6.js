import { Menu } from './menu'
import { Node } from './node'
import { Link } from './link'
import { AllSettings } from './controller'
import { Network } from './network'
import { Simulation } from './simulation'
import { CanvasState } from './canvas'
import * as d3 from 'd3';

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
    }

    // STATE
    this.state = {
      'global': {},
      'on_display': {},
    }

    this.state.global = new AllSettings(webwebData.display)

    if (this.state.global.settings['networkName'] == undefined) {
      this.state.global.settings['networkName'] = this.networkNames[0]
      this.networkName = this.networkNames[0]
    }
    else {
      this.networkName = this.state.global.settings['networkName']
    }

    this.state.global.settings['networkNames'] = this.networkNames

    // NETWORKS
    this.maxNodes = 0
    this.networks = {}
    this.state.global.settings['networkLayers'] = {}
    for (let [networkName, networkData] of Object.entries(webwebData.networks)) {
      let network = new Network(networkName, networkData, this.state.global, this.globalNodes)
      this.networks[networkName] = network

      for (let layer of network.layers) {
        if (layer.nodeCount > this.maxNodes) {
          this.maxNodes = layer.nodeCount
        }
      }

      this.state.global.settings['networkLayers'][networkName] = network.layers.length
    }

    // NODES
    this.nodes = []
    for (let i = 0; i < this.maxNodes; i++) {
      let node = new Node(i)
      this.nodes.push(node)
    }

    this.nodesPersistence = []

    this.simulation = new Simulation(this.nodes, this.state.global.settings)

    let box = this.getBox(this.title, this.state.global.settings)
    this.state.global.settings = this.setVizualizationDimensions(box, this.state.global.settings)

    for (let networkName of Object.keys(this.networks)) {
      this.networks[networkName].updateState(new AllSettings(this.state.global.settings))
    }

    // TODO: these two below are... important
    if (! this.state.global.settings.hideMenu) {
      this.menu = new Menu(this.state.global.settings, this.getCallHandler())
      box.appendChild(this.menu.HTML)
    }

    let canvas = new CanvasState(this.state.global.settings, this.simulation)
    box.append(canvas.box)
    // this.canvas = canvas

    this.displayNetwork(this.networkName, this.state.global.settings)
  }

  // object that will hopefully make things nicer and give only restricted
  // access to the widgets
  getCallHandler() {
    // allows:
    // - `display-network`: displays the network specified in the settings
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
        },
        'update-sim': function(settings) {
          _this.simulation.update()
        },
        'update-links': (settings) => {
          _this.updateScales(settings)
        },
        // TODO
        // TODO
        'save-svg': () => {},
        'node-text': () => {},
        'change-sizes': () => {},
        'change-colors': () => {},
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
        node.setMetadata(nodeMetadata[_name])
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

  displayNetwork(networkName, settings) {
    let network = this.networks[networkName]
    let layer = network.layers[settings['networkLayer']]

    let links = layer.links
    let displayableMetadata = layer.displayableMetadata

    this.menu.refresh(settings, displayableMetadata)

    this.setVisibleNodes(layer.nodeCount)
    this.applyNodeMetadata(settings, layer.nodes, layer.nodeNameToIdMap, layer.nodeIdToNameMap)

    this.updateScales(settings)

    // TODO: SIMULATION
    // this.simulation.links= layer.edgeList
    this.simulation.update(settings)

    // toggleFreezeNodes(webweb.display.freezeNodeMovement);

    // // if we've frozen node movement manually tick so new edges are evaluated.
    // if (webweb.display.freezeNodeMovement) {
    //     webweb.canvas.redraw();
    // }

    // computeLegend();
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

  updateScales(settings) {
    let layer = this.getLayerDisplayedBySettings(settings)
    for (let scale of Object.keys(this.scales)) {
      this.scales[scale].range(
        settings['scales'][scale]['min'],
        settings['scales'][scale]['max']
      )
    }

    this.scales['linkWidth'].domain(d3.extent(layer.edgeWeights))
    this.scales['linkOpacity'].domain(d3.extent(layer.edgeWeights))
  }

  displayedNetworkData() {
    return 1
    // return this.networks[this.settings.networkName].layers[this.display.networkLayer]
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
}
