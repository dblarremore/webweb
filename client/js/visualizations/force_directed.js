import { AbstractVisualization } from './abstract_visualization'
import { Simulation } from './force_directed/simulation'
import { Link } from './force_directed/link'
import { ForceDirectedSettings } from './force_directed/settings'
import * as widgets  from './force_directed/widgets'
import { Legend } from '../legend'

export class ForceDirectedVisualization extends AbstractVisualization {
  constructor(settings, menu, canvas, layer, nodes) {
    super(settings, menu, canvas, layer, nodes)
    this.simulation = new Simulation(nodes, settings)

    this.simulation.simulation.on('tick', this.canvas.redraw.bind(this.canvas))
    this.simulation.simulation.alpha(1).restart()
  }

  static get settingsObject() {
    return ForceDirectedSettings
  }

  get attributes() {
    const scales = {
      'linkWidth': {
        'extent': d3.extent(this.layer.edgeWeights),
      },
      'linkOpacity': {
        'extent': d3.extent(this.layer.edgeWeights),
      },
    }

    return scales
  }

  get listeners() {
    return {
      "mousedown": event => this.mouseDownListener(),
      "mousemove": event => this.mouseMoveListener(),
      "mouseup": event => this.mouseUpListener(),
    }
  }

  get handlers() {
    return {
      'freeze-nodes': settings => this.freezeNodesCaller(settings),
      'update-sim': settings => this.simulationUpdateCaller(settings),
    }
  }

  get widgets() {
    return {
      'left': {
        'size': [
          widgets.SizeSelectWidget,
          widgets.InvertBinarySizesWidget
        ],
        'colors': [
          widgets.ColorSelectWidget,
          widgets.ColorPaletteSelectWidget,
          widgets.InvertBinaryColorsWidget
        ],
      },
      'right': {
        'names': [
          widgets.ShowNodeNamesWidget,
          widgets.NameToMatchWidget,
        ],
        'scaleLink': [
          widgets.ScaleLinkWidthWidget,
          widgets.ScaleLinkOpacityWidget,
        ],
        'nodeProperties': [
          widgets.ChargeWidget,
          widgets.RadiusWidget,
        ],
        'linkLength': [widgets.LinkLengthWidget],
        'freezeNodes': [widgets.FreezeNodesWidget],
        'gravity' : [widgets.GravityWidget],
      }
    }
  }

  update(settings, layer, nodes) {
    this.settings = this.formatSettings(settings)

    this.layer = layer
    console.log('handle nodes over here111')
    console.log('no more scales')
    // this.scales = scales

    this.simulation.links = this.getLinks(layer, nodes, this.scales)
    this.simulation.update(settings)
    this.createLegend()

    // if we've frozen node movement manually tick so new edges are evaluated.
    if (settings.freezeNodeMovement) {
      this.canvas.redraw()
    }
  }

  getLinks(layer, nodes, scales) {
    return layer.links.map(([source, target, weight]) => {
      const width = scales.linkWidth(weight)
      const opacity = scales.linkOpacity(weight)

      return new Link(nodes[source], nodes[target], weight, width, opacity)
    })
  }

  createLegend() {
    this.legendNodes = []
    this.legendText = []

    if (this.settings.showLegend) {
      let legend = new Legend(
        this.settings.sizeBy,
        this.layer.attributes.size[this.settings.sizeBy],
        this.settings.colorBy,
        this.layer.attributes.color[this.settings.colorBy],
        this.settings.radius,
        this.simulation.nodes,
        this.scales,
      )

      this.legendNodes = objects.nodes
      this.legendText = objects.text
    }
  }

  annotateNodes() {
    this.markNodesMatchingString(this.settings.nameToMatch)
    this.markNodesContainingMouse(this.mouseState)
  }

  getObjectsToDraw() {
    this.annotateNodes()
    
    let simulationObjectsToDraw = this.simulation.getObjectsToDraw(this.settings.showNodeNames)
    let legendObjectsToDraw = this.legend.getObjectsToDraw(this.settings.showLegend)

    let objects = simulationObjectsToDraw.concat(legendObjectsToDraw)

    return objects
  }

  draw(mouseState) {
    this.mouseState = mouseState
    this.getObjectsToDraw().forEach(object => object.draw(this.canvas.context), this)
  }

  markNodesMatchingString(matchString) {
    let namesToMatch
    if (matchString.indexOf(',') >= 0) {
      namesToMatch = matchString.split(',')
    }
    else {
      namesToMatch = [matchString]
    }

    namesToMatch = namesToMatch.filter(name => name.length)

    this.simulation.nodes.forEach((node) => {
      node.matchesString = false
      for (let nameToMatch of namesToMatch) {
        if (nameToMatch.length > 0) {
          if (node.name !== undefined) {
            if (node.name.indexOf(nameToMatch) >= 0) {
              node.matchesString = true
            }
          }
        }
      }
    })
  }

  markNodesContainingMouse(mouseState) {
    this.simulation.nodes.forEach((node) => {
      node.containsMouse = this.nodeContainsMouse(node, mouseState)
    })
  }

  nodeContainsMouse(node, mouseState) {
    if (mouseState !== undefined) {
      let radius = 1.3 * node.radius

      if (
        node.x + radius >= mouseState.x &&
        node.x - radius <= mouseState.x &&
        node.y + radius >= mouseState.y &&
        node.y - radius <= mouseState.y
      ) {
        return true
      }
    }

    return false
  }

  updateDraggedNode(mouseState) {
    this.draggedNode.x = mouseState.x
    this.draggedNode.y = mouseState.y
    this.draggedNode.fx = mouseState.x
    this.draggedNode.fy = mouseState.y
  }

  // don't really understand the dragging logic atm
  endDragging() {
    this.simulation.simulation.alphaTarget(0)

    if (! this.settings.freezeNodeMovement && this.draggedNode !== undefined) {
      this.draggedNode.fx = null
      this.draggedNode.fy = null
    }
    this.draggedNode = undefined
    this.dragging = false
  }

  mouseUpListener() {
    if (this.dragging) {
      this.endDragging()
    }

    const mouseState = this.mouseState

    if (this.mouseStatesAreVeryClose(mouseState, this.mouseDownState)) {
      for (let node of this.simulation.nodes) {
        if (this.nodeContainsMouse(node, mouseState)) {
          if (node.url !== undefined) {
            window.open(node.url, '_blank')
          }
        }
      }
    }

    this.mouseDownState = undefined
  }
  mouseMoveListener(event) {
    const mouseState = this.mouseState

    if (this.dragging) {
      if (this.canvas.mouseIsWithinDragBoundary(mouseState)) {
        this.endDragging()
      }
      else {
        this.updateDraggedNode(mouseState)
      }
    }

    this.canvas.redraw()
  }

  mouseDownListener() {
    const mouseState = this.mouseState
    this.mouseDownState = this.mouseState
    this.endDragging()

    for (let node of this.simulation.nodes) {
      if (this.nodeContainsMouse(node, mouseState)) {
        this.dragging = true
        this.draggedNode = node

        this.simulation.simulation.alphaTarget(0.3).restart()
        this.updateDraggedNode(mouseState)
      }
    }
  }

  mouseStatesAreVeryClose(stateOne, stateTwo) {
    const pxThreshold = 5
    const timeThreshold = 100
    if (Math.abs(stateOne.x - stateTwo.x) > pxThreshold) {
      return false
    }
    else if (Math.abs(stateOne.y - stateTwo.y) > pxThreshold) {
      return false
    }
    else if (Math.abs(stateOne.time - stateTwo.time) > timeThreshold) {
      return false
    }

    return true
  }

  freezeNodesCaller(settings) {
    if (! this.simulation) {
      return
    }

    if (settings.freezeNodeMovement) {
      this.simulation.freeze()
    }
    else {
      this.simulation.unfreeze()
    }
    this.canvas.redraw()
  }

  simulationUpdateCaller(settings) {
    if (! this.simulation) {
      return
    }

    this.simulation.update(settings)
  }
}
