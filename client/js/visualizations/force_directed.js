import { AbstractVisualization } from './abstract_visualization'
import { Simulation } from './force_directed/simulation'
import { Line, Circle } from '../shapes'
import { ForceDirectedSettings } from './force_directed/settings'
import * as widgets  from './force_directed/widgets'
import { Legend } from '../legend'
import { ScalarAttribute } from '../attribute'
import { Coloror } from '../coloror'

import * as d3 from 'd3'

export class ForceDirectedVisualization extends AbstractVisualization {
  static get HighlightRadiusMultiplier() { return 1.3 }
  constructor(settings, menu, canvas, layer, nodes) {
    super(settings, menu, canvas, layer, nodes)
    this.simulation = new Simulation(this.nodes, this.settings)

    this.simulation.simulation.on('tick', this.canvas.redraw.bind(this.canvas))

    this.makeLinkAttributes()
    this.updateAttributes()
  }

  static get settingsObject() { return ForceDirectedSettings }

  get nodeColorAttribute() {
    const attributeName = this.settings.colorNodesBy
    return this.layer.attributes.color[attributeName]
  }

  get nodeSizeAttribute() {
    const attributeName = this.settings.sizeNodesBy
    return this.layer.attributes.size[attributeName]
  }

  get simulationLinks() {
    return this.layer.links.map(link => {
      return {
        'source': this.nodes[link.source],
        'target': this.nodes[link.target],
      }
    })
  }

  updateAttributes() {
    this.linkWidthAttribute.setScaleRange(this.settings.scaleLinkWidth ? [0.5, 2] : [1, 1])
    this.linkOpacityAttribute.setScaleRange(this.settings.scaleLinkOpacity ? [0.3, 1] : [1, 1])

    this.nodeSizeAttribute.setScaleRange(this.settings.flipNodeSizeScale ? [1.5, 0.5] : [0.5, 1.5])

    this.nodeColorAttribute.coloror.setPalette(this.settings.nodeColorPalette)

    // this won't work for categorical
    this.nodeColorAttribute.setScaleRange(this.settings.flipNodeColorScale ? [1, 0] : [0, 1])

    this.simulation.links = this.simulationLinks
    this.simulation.update(this.settings)

    // if we've frozen node movement manually tick so new edges are evaluated.
    // if (settings.freezeNodeMovement) {
    //   this.canvas.redraw()
    // }
  }

  makeLinkAttributes() {
    const weights = this.layer.links.map(link => link.weight)

    this.edgeWeights = {}
    Object.entries(weights).forEach(
      ([i, weight]) => this.edgeWeights[i] = { 'edgeWeight': weight }
    )

    this.linkWidthAttribute = new ScalarAttribute('edgeWeight', this.edgeWeights)
    this.linkOpacityAttribute = new ScalarAttribute('edgeWeight', this.edgeWeights)
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
      'redraw': settings => this.redraw(settings),
      'freeze-nodes': settings => this.freezeNodesCaller(settings),
      'update-sim': settings => this.simulationUpdateCaller(settings),
    }
  }

  get widgets() {
    return {
      'left': {
        'size': [
          widgets.SizeNodesSelectWidget,
          widgets.FlipNodeSizeScaleWidget,
        ],
        'colors': [
          widgets.ColorNodesSelectWidget,
          widgets.NodeColorPaletteSelectWidget,
          widgets.FlipNodeColorScaleWidget
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

  getLinksToDraw() {
    let linksToDraw = []
    for (let link of this.layer.links) {

      const width = this.linkWidthAttribute.getNumericalValue(link.weight)
      const opacity = this.linkOpacityAttribute.getNumericalValue(link.weight)
      const source = this.nodes[link.source]
      const target = this.nodes[link.target]

      linksToDraw.push(
        new Line(source.x, source.y, target.x, target.y, width, opacity, Coloror.defaultColor)
      )
    }

    return linksToDraw
  }

  getNodesToDraw() {
    let nodesToDraw = []
    for (let [i, node] of Object.entries(this.nodes)) {
      const sizeScale = this.nodeSizeAttribute.getNodeNumericalValue(node)
      let radius = this.settings.radius * sizeScale

      const matchesString = this.nodeMatchesNames(node, this.namesToMatch)
      const containsMouse = this.nodeContainsMouse(node, radius, this.mouseState)
      const highlight = matchesString || containsMouse

      const outline = highlight ? 'black' : Coloror.defaultColor

      if (highlight) {
        radius *= this.constructor.HighlightRadiusMultiplier
      }

      const color = this.nodeColorAttribute.getNodeColorValue(node)

      nodesToDraw.push(new Circle(node.x, node.y, radius, outline, color))
    }

    return nodesToDraw
  }

  getObjectsToDraw() {
    const linksToDraw = this.getLinksToDraw()
    const nodesToDraw = this.getNodesToDraw()

    // let simulationObjectsToDraw = this.simulation.getObjectsToDraw(this.settings.showNodeNames)
    // let legendObjectsToDraw = this.legend.getObjectsToDraw(this.settings.showLegend)

    // let objects = simulationObjectsToDraw.concat(legendObjectsToDraw)

    let objects = linksToDraw.concat(nodesToDraw)
    return objects
  }

  draw() {
    let objects = this.getObjectsToDraw()
    this.getObjectsToDraw().forEach(object => object.draw(this.canvas.context), this)
  }

  get namesToMatch() {
    let matchString = this.settings.namesToMatch || ''
    let namesToMatch = matchString.indexOf(',') >= 0
      ? matchString.split(',')
      : [matchString]

    namesToMatch = namesToMatch.filter(name => name.length)

    return namesToMatch
  }

  nodeMatchesNames(node, namesToMatch) {
    for (let nameToMatch of namesToMatch) {
      if (nameToMatch.length > 0) {
        if (node.name !== undefined) {
          if (node.name.indexOf(nameToMatch) >= 0) {
            return true
          }
        }
      }
    }
    return false
  }

  nodeContainsMouse(node, radius, mouseState) {
    if (mouseState !== undefined) {
      radius *= this.constructor.HighlightRadiusMultiplier

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

  // I don't really understand the dragging logic
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
    if (this.dragging) {
      if (this.canvas.mouseIsWithinDragBoundary(this.mouseState)) {
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
