import { Node } from './node'
import { Link } from './link'
import { AllSettings } from './controller'
import { Network } from './network'
import { Simulation } from './simulation'
import { colorbrewer } from './colors';
import { CanvasState } from './canvas';
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
    }

    this.state.global.settings['networkNames'] = this.networkNames

    // NETWORKS
    let maxNodes = 0;
    this.networks = {}
    for (let [networkName, networkData] of Object.entries(webwebData.networks)) {
      let network = new Network(networkName, networkData, this.state.global, this.globalNodes)
      this.networks[networkName] = network

      if (network.nodeCount > maxNodes) {
        maxNodes = network.nodeCount
      }
    }

    // NODES
    this.nodes = []
    for (let i = 0; i < this.maxNodeCount; i++) {
      this.nodes.push(Node(i))
    }

    this.nodesPersistence = []

    this.simulation = new Simulation(this.nodes, this.state.global.settings)

    let box = this.getBox(this.title, this.state.global.settings)
    this.state.global.settings = this.setVizualizationDimensions(box, this.state.global.settings)

    for (let networkName of Object.keys(this.networks)) {
      this.networks[networkName].updateState(new AllSettings(this.state.global.settings))
    }

    // TODO: these two below are... important
    // if (! settings.hideMenu) {
    //   this.writeMenus(box, settings);
    // }
    let canvas = new CanvasState(this)
    box.appendChild(canvas.canvas)

    this.canvas = canvas

    this.displayNetwork(this.networkNames[0], this.state.global.settings)
  }

  displayNetwork(networkName, settings) {
    let network = this.networks[networkName]
    let layer = network.layers[settings['networkLayer']]

    let links = layer.links
    console.log(layer)

    this.setVisibleNodes(layer.nodeCount)
    this.simulation.settings = settings
    // must update simulation
    // this.simulation.update()

    // updateSizeMenu();
    // updateColorMenu();

    // toggleFreezeNodes(webweb.display.freezeNodeMovement);
    // toggleShowNodeNames(webweb.display.showNodeNames);
    // toggleInvertBinaryColors(webweb.display.invertBinaryColors);
    // toggleInvertBinarySizes(webweb.display.invertBinarySizes);
    // toggleLinkWidthScaling(webweb.display.scaleLinkWidth);
    // toggleLinkOpacityScaling(webweb.display.scaleLinkOpacity);

    // // change the display of the layers widget
    // setNetworkLayerMenuVisibility();

    // // if we've frozen node movement manually tick so new edges are evaluated.
    // if (webweb.display.freezeNodeMovement) {
    //     webweb.canvas.redraw();
    // }

    // computeLegend();
  }

  ////////////////////////////////////////////////////////////////////////////////
  // adds/removes nodes from the visualization
  ////////////////////////////////////////////////////////////////////////////////
  setVisibleNodes(nodeCount) {
    const count = nodeCount || this.maxNodeCount

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

  updateScales(edgeWeights, settings) {
    for (let scale of Object.keys(this.scales)) {
      this.scales[scale].range(
        settings['scales'][scale]['min'],
        settings['scales'][scale]['max']
      )
    }
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

    var subBox = document.createElement("div")
    subBox.setAttribute('id', 'webweb-visualization-container')

    box.appendChild(subBox)

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
