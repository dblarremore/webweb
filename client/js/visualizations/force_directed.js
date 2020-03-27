import { AbstractVisualization } from './abstract_visualization'
import { Simulation } from './force_directed/simulation'
import { ForceDirectedSettings } from './force_directed/settings'
import { forceDirectedWidgets } from './force_directed/widgets'
import { Legend } from '../legend'
import { ScalarAttribute } from '../attribute'
import { Coloror } from '../coloror'
import * as shapes from '../shapes'

export class ForceDirectedVisualization extends AbstractVisualization {
  static get settingsObject() { return ForceDirectedSettings }
  static get HighlightRadiusMultiplier() { return 1.3 }
  static get TextRadiusMultiplier() { return 1.1 }

  get handlers() {
    return {
      'redraw': settings => this.redraw(settings),
      'change-force': settings => this.simulation.update(settings),
      'freeze-simulation': settings => {
        if (settings.freezeNodeMovement) {
          this.simulation.freeze()
        }
        else {
          this.simulation.unfreeze()
        }
        this.canvas.redraw()
      }
    }
  }

  get listeners() {
    return {
      "mousedown": event => this.mouseDownListener(),
      "mousemove": event => this.mouseMoveListener(),
      "mouseup": event => this.mouseUpListener(),
    }
  }

  get widgets() { return forceDirectedWidgets() }

  constructor(settings, menu, canvas, layer, previousNodePositions) {
    super(settings, menu, canvas, layer, previousNodePositions)

    this.simulationNodes = this.createSimulationNodes(this.previousNodePositions)

    this.simulation = new Simulation(this.simulationNodes, this.settings)

    this.simulation.simulation.on('tick', this.canvas.redraw.bind(this.canvas))

    this.makeLinkAttributes()
    this.updateAttributes()
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
  get nodePositions() {
    let nodePositions = {}
    for (let node of this.simulation.nodes) {
      nodePositions[node.name] = {
        'x': node.x,
        'y': node.y,
        'fx': node.fx,
        'fy': node.fy,
        'vx': node.vx,
        'vy': node.vy,
      }
    }

    return nodePositions
  }

  /*
   * previousNodePositions is a dictionary where:
   * - keys are node names
   * - values are node positions
    * */
  createSimulationNodes(previousNodePositions) {
    let simulationNodes = []
    for (let [i, node] of Object.entries(this.layer.nodes)) {
      const simulationNode = {
        'name': node.name
      }

      const previousPosition = previousNodePositions[node.name] || {}
      Object.entries(previousPosition).forEach(([key, value]) => simulationNode[key] = value)

      simulationNodes.push(node)
    }

    return simulationNodes
  }

  get simulationLinks() {
    return this.layer.links.map(link => {
      return {
        'source': this.simulationNodes[link.source],
        'target': this.simulationNodes[link.target],
      }
    })
  }

  get nodeColorAttribute() {
    const attributeName = this.settings.colorNodesBy
    return this.layer.attributes.color[attributeName]
  }

  get nodeSizeAttribute() {
    const attributeName = this.settings.sizeNodesBy
    return this.layer.attributes.size[attributeName]
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

    this.createLegend()
    // if we've frozen node movement manually tick so new edges are evaluated.
    // if (settings.freezeNodeMovement) {
    //   this.canvas.redraw()
    // }
  }

  makeLinkAttributes() {
    const weights = this.layer.links.map(link => link.weight)

    this.linkWidthAttribute = new ScalarAttribute('edgeWeight', weights)
    this.linkOpacityAttribute = new ScalarAttribute('edgeWeight', weights)
  }

  getLinksToDraw() {
    let linksToDraw = []
    for (let link of this.layer.links) {

      const width = this.linkWidthAttribute.getNumericalValue(link.weight)
      const opacity = this.linkOpacityAttribute.getNumericalValue(link.weight)
      const source = this.simulationNodes[link.source]
      const target = this.simulationNodes[link.target]

      linksToDraw.push(
        new shapes.Line(source.x, source.y, target.x, target.y, width, opacity, Coloror.defaultColor)
      )
    }

    return linksToDraw
  }

  getNodesAndTextToDraw() {
    let objects = []
    for (let [i, node] of Object.entries(this.simulationNodes)) {
      const [radius, highlightNode] = this.getNodeRadiusAndIsHighlighted(node)
      const outline = highlightNode ? 'black' : Coloror.defaultColor
      const color = this.nodeColorAttribute.getNodeColorValue(node)

      objects.push(new shapes.Circle(node.x, node.y, radius, outline, color))

      if (this.simulation.isStable) {
        if (highlightNode || this.settings.showNodeNames) {
          const annotationRadius = radius * this.constructor.TextRadiusMultiplier
          objects.push(
            new shapes.Text(node.name, node.x + annotationRadius, node.y - annotationRadius)
          )
        }
      }
    }

    return objects
  }

  getNodeRadiusAndIsHighlighted(node) {
    const sizeScale = this.nodeSizeAttribute.getNodeNumericalValue(node)
    let radius = this.settings.radius * sizeScale

    const matchesString = this.nodeMatchesNames(node, this.namesToMatch)
    const containsMouse = this.nodeContainsMouse(node, radius, this.mouseState)
    const highlightNode = matchesString || containsMouse

    if (highlightNode) {
      radius *= this.constructor.HighlightRadiusMultiplier
    }

    return [radius, highlightNode]
  }

  get namesToMatch() {
    let matchString = this.settings.nameToMatch || ''
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

  createLegend() {
    this.legend = new Legend(
      this.settings.showLegend,
      this.nodeSizeAttribute,
      this.nodeColorAttribute,
      this.settings.radius,
      this.canvas.width / 2,
      this.canvas.height / 2,
    )

    this.legendObjectsToDraw = this.legend.getObjectsToDraw()
  }

  get ObjectsToDraw() {
    const linksToDraw = this.getLinksToDraw()
    const nodesAndTextToDraw = this.getNodesAndTextToDraw()

    let objects = linksToDraw.concat(nodesAndTextToDraw).concat(this.legendObjectsToDraw)
    return objects
  }

  draw() {
    this.ObjectsToDraw.forEach(object => object.draw(this.canvas.context))
  }

  updateDraggedNode(mouseState) {
    this.draggedNode.x = mouseState.x
    this.draggedNode.y = mouseState.y
    this.draggedNode.fx = mouseState.x
    this.draggedNode.fy = mouseState.y
  }

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
        this.updateDraggedNode(this.mouseState)
      }
    }

    this.canvas.redraw()
  }

  mouseDownListener() {
    const mouseState = this.mouseState
    this.mouseDownState = this.mouseState
    this.endDragging()

    for (let node of this.simulation.nodes) {
      const [radius, highlightNode] = this.getNodeRadiusAndIsHighlighted(node)
      if (this.nodeContainsMouse(node, radius, mouseState)) {
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
}
