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
  get TextRadiusMultiplier() { return 1.1 }
  get NodeFocusRadiusMultiplier() { return 1.3 }

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
      const simulationNode = new shapes.Circle()
      simulationNode.name = node.name

      const previousPosition = previousNodePositions[node.name] || {}
      Object.entries(previousPosition).forEach(([key, value]) => simulationNode[key] = value)
      Object.entries(node).forEach(([key, value]) => simulationNode[key] = value)

      simulationNodes.push(simulationNode)
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

    this.legend = new Legend(
      this.settings.showLegend,
      this.settings.radius,
      this.nodeSizeAttribute,
      this.nodeColorAttribute,
      this.canvas,
    )
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

  get edgesToDraw() {
    let edgesToDraw = []
    for (let link of this.layer.links) {

      const width = this.linkWidthAttribute.getNumericalValue(link.weight)
      const opacity = this.linkOpacityAttribute.getNumericalValue(link.weight)
      const source = this.simulationNodes[link.source]
      const target = this.simulationNodes[link.target]

      edgesToDraw.push(
        new shapes.Line(source.x, source.y, target.x, target.y, width, opacity, Coloror.defaultColor)
      )
    }

    return edgesToDraw
  }

  get nodesToDraw() {
    let nodesToDraw = []
    for (let [i, node] of Object.entries(this.simulationNodes)) {
      node.radius = this.getNodeRadius(node)
      node.outline = this.focusOnNode(node) ? 'black' : Coloror.defaultColor
      node.color = this.nodeColorAttribute.getNodeColorValue(node)
      nodesToDraw.push(node)
    }

    return nodesToDraw
  }

  get textsToDraw() {
    let textsToDraw = []
    for (let node of this.nodesToShowTextFor) {
      const radius = node.radius * this.TextRadiusMultiplier
      const text = node.name
      const x = node.x + radius
      const y = node.y - radius
      textsToDraw.push(new shapes.Text(text, x, y))
    }
    
    return textsToDraw
  }

  get nodesToShowTextFor() {
    if (! this.simulation.isStable) {
      return []
    }

    let nodes = this.simulationNodes
    if (this.settings.showNodeNames) {
      return nodes
    }
    else {
      return nodes.filter(node => this.focusOnNode(node))
    }
  }

  focusOnNode(node) {
    const matchesString = this.nameMatchesNames(node.name, this.namesToMatch)
    return matchesString || node === this.mouseoverNode
  }

  getNodeRadius(node) {
    let radius = this.getDefaultNodeRadius(node)

    if (this.focusOnNode(node)) {
      radius *= this.NodeFocusRadiusMultiplier
    }

    return radius
  }

  getDefaultNodeRadius(node) {
    return this.settings.radius * this.nodeSizeAttribute.getNodeNumericalValue(node)
  }

  get namesToMatch() {
    let matchString = this.settings.nameToMatch || ''
    let namesToMatch = matchString.indexOf(',') >= 0
      ? matchString.split(',')
      : [matchString]

    namesToMatch = namesToMatch.filter(name => name.length)

    return namesToMatch
  }

  nameMatchesNames(name, namesToMatch) {
    if (name === undefined) {
      return false
    }

    return namesToMatch.filter(toMatch => name.indexOf(toMatch) >= 0).length
      ? true
      : false
  }

  get objectsToDraw() {
    const nodes = this.nodesToDraw
    const edges = this.edgesToDraw
    const texts = this.textsToDraw
    const legend = this.legend.objectsToDraw

    return edges.concat(nodes).concat(texts).concat(legend)
  }

  setMouseoverNode() {
    this.mouseoverNode = undefined
    for (let node of this.simulation.nodes) {
      if (node.containsPoint(this.mouseState.x, this.mouseState.y)) {
        this.mouseoverNode = node
        return
      }
    }
  }

  endDragging() {
    this.simulation.simulation.alphaTarget(0)

    if (! this.settings.freezeNodeMovement) {
      this.mouseoverNode.fx = null
      this.mouseoverNode.fy = null
    }

    this.dragging = false
  }

  mouseUpListener() {
    if (this.dragging) {
      this.endDragging()
    }

    if (this.mouseStatesAreVeryClose(this.mouseState, this.mouseDownState)) {
      if (this.mouseoverNode) {
        const url = this.mouseoverNode.url
        if (url !== undefined) {
          window.open(url, '_blank')
        }
      }
    }

    this.mouseDownState = undefined
  }

  mouseMoveListener() {
    if (this.dragging) {
      if (this.canvas.mouseIsWithinDragBoundary(this.mouseState)) {
        this.endDragging()
      }
      else {
        this.mouseoverNode.x = this.mouseState.x
        this.mouseoverNode.y = this.mouseState.y
        this.mouseoverNode.fx = this.mouseState.x
        this.mouseoverNode.fy = this.mouseState.y
      }
    }
    else {
      this.setMouseoverNode()
    }

    this.canvas.redraw()
  }

  mouseDownListener() {
    this.mouseDownState = this.mouseState

    if (this.mouseoverNode) {
      this.dragging = true
      this.simulation.simulation.alphaTarget(0.3).restart()
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
