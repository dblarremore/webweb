import { AbstractVisualization } from './abstract_visualization'
import { Simulation } from './force_directed/simulation'
import { Legend } from '../legend'
import { Link } from '../link'

export class ForceDirectedVisualization extends AbstractVisualization {
  constructor(settings, nodes, canvas, layer) {
    super(settings, nodes, canvas, layer)
    this.simulation = new Simulation(nodes, settings)

    this.simulation.simulation.on('tick', this.canvas.redraw.bind(this.canvas))
    this.simulation.simulation.alpha(1).restart()
  }

  get listeners() {
    return {
      "mousedown": event => this.mouseDownListener(),
      "mousemove": event => this.mouseMoveListener(),
      "mouseup": event => this.mouseUpListener(),
    }
  }

  get callers() {
    return {
      'freeze-nodes': settings => this.freezeNodesCaller(settings),
      'update-sim': settings => this.simulationUpdateCaller(settings),
    }
  }

  update(settings, nodes, layer, scales) {
    this.settings = settings
    this.layer = layer
    this.scales = scales

    this.simulation.links = this.getLinks(layer, nodes, this.scales)
    this.simulation.update(settings)
    this.createLegend()

    // if we've frozen node movement manually tick so new edges are evaluated.
    if (settings.freezeNodeMovement) {
      this.canvas.redraw()
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

  createLegend() {
    this.legendNodes = []
    this.legendText = []

    if (this.settings.showLegend) {
      let legend = new Legend(
        this.settings.sizeBy,
        this.layer.attributes.size[this.settings.sizeBy],
        this.settings.colorBy,
        this.layer.attributes.color[this.settings.colorBy],
        this.settings.r,
        this.simulation.nodes,
        this.scales,
      )

      let objects = legend.legendNodeAndText

      objects.nodes = objects.nodes.map((node) => {
        node.settings = this.settings
        return node
      }, this)

      this.legendNodes = objects.nodes
      this.legendText = objects.text
    }
  }

  draw(mouseState) {
    this.mouseState = mouseState
    this.nodesMatchingString(this.settings.nameToMatch)
    this.nodesContainingMouse(this.mouseState)

    let elementsToDraw = []

    if (this.simulation.links !== undefined) {
      elementsToDraw = elementsToDraw.concat(this.simulation.links)
    }

    elementsToDraw = elementsToDraw.concat(this.simulation.nodes)

    if (this.simulation.simulation.alpha() < .05 || this.settings.freezeNodeMovement) {
      this.simulation.nodes.forEach((node) => {
        if (node.matchesString || node.containsMouse || this.settings.showNodeNames) {
          let nodeText = node.nodeText

          if (nodeText !== undefined) {
            elementsToDraw.push(nodeText)
          }
        }
      })
    }

    if (this.settings.showLegend) {
      if ((this.legendNodes !== undefined) && (this.legendNodes.length)) {
        elementsToDraw = elementsToDraw.concat(this.legendNodes)
      }

      if ((this.legendText !== undefined) && (this.legendText.length)) {
        elementsToDraw = elementsToDraw.concat(this.legendText)
      }
    }
    
    let context = this.canvas.context

    elementsToDraw.forEach((element) => {
      element.draw(context)
    }, this)
    return elementsToDraw
  }

  nodesMatchingString(matchString) {
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

  nodesContainingMouse(mouseState) {
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
