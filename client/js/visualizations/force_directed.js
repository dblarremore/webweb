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

  get widgets() { return forceDirectedWidgets() }

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

  constructor(settings, menu, canvas, layer, previousNodePositions) {
    super(settings, menu, canvas, layer, previousNodePositions)

    this.simulation = new Simulation(
      this.settings,
      this.layer.nodes,
      this.layer.links,
      previousNodePositions
  )

    this.simulation.simulation.on('tick', this.canvas.redraw.bind(this.canvas))

    this.makeLinkAttributes()
    this.updateAttributes()
  }

  get nodePositions() { return this.simulation.nodePositions }

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
    this.nodeColorAttribute.setScaleReverse(this.settings.flipNodeColorScale)

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
    for (let link of this.simulation.links) {
      const width = this.linkWidthAttribute.getNumericalValue(link.weight)
      const opacity = this.linkOpacityAttribute.getNumericalValue(link.weight)
      edgesToDraw.push(
        new shapes.Line(
          link.source.x, link.source.y,
          link.target.x, link.target.y,
          width, opacity,
          Coloror.defaultColor,
        )
      )
    }

    return edgesToDraw
  }

  get nodesToDraw() {
    let nodesToDraw = []
    for (let [i, node] of Object.entries(this.simulation.nodes)) {
      const focusOnNode = this.focusOnNode(node)
      node.radius = this.settings.radius * this.nodeSizeAttribute.getNodeNumericalValue(node)
      node.radius *= focusOnNode ? this.NodeFocusRadiusMultiplier : 1
      node.outline = focusOnNode ? 'black' : Coloror.defaultColor
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

    let nodes = this.simulation.nodes
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

  get namesToMatch() {
    let matchString = this.settings.nameToMatch || ''
    let namesToMatch = matchString.indexOf(',') >= 0
      ? matchString.split(',')
      : [matchString]

    namesToMatch = namesToMatch.filter(name => name.length)

    return namesToMatch
  }

  nameMatchesNames(name, namesToMatch) {
    return namesToMatch.filter(toMatch => name.indexOf(toMatch) >= 0).length
      ? true
      : false
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
