import { Legend } from './legend'
import { Simulation } from './simulation'
import { Link } from './link'
import * as d3 from 'd3'

export class WebwebCanvas {
  constructor(settings) {
    this.settings = settings

    this.w = settings.w
    this.h = settings.h
    this.dpr = window.devicePixelRatio || 1

    this.HTMLClass = "webweb-vis-canvas"
    this.HTML = this.getHTML()

    this.boxClass = "webweb-visualization-container"
    this.box = this.getBox()

    this.context = this.HTML.getContext('2d')
    this.context.scale(this.dpr, this.dpr)

    this.padding = 3
    this.dragBoundary = 15

    for (let [event, eventFunction] of Object.entries(this.listeners)) {
      this.HTML.addEventListener(event, eventFunction)
    }
  }

  get listeners() {
    return {
      "mousedown": event => this.setMouseState(event),
      "mousemove": event => this.setMouseState(event),
      "mouseup": event => this.setMouseState(event),
    }
  }

  getHTML() {
    let HTML = document.createElement("canvas")
    HTML.classList.add(this.HTMLClass)

    HTML.style.width = this.w + "px"
    HTML.style.height = this.h + "px"

    HTML.width = this.w * this.dpr
    HTML.height = this.h * this.dpr

    return HTML
  }

  getBox() {
    let box = document.createElement("div")
    box.classList.add(this.boxClass)
    box.append(this.HTML)
    return box
  }

  clear() {
    this.context.clearRect(0, 0, this.w, this.h)

    this.context.fillStyle = 'white'
    this.context.fillRect(0, 0, this.w, this.h)
  }

  redraw() {
    this.clear()
    const redrawContent = this.visualization.getRedrawContent(this.mouseState)
    const ctx = this.context

    redrawContent.forEach((element) => {
      element.draw(ctx)
    }, this)
  }

  svgDraw() {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    const redrawContent = this.visualization.getRedrawContent(this.mouseState)

    redrawContent.forEach((element) => {
      svg.appendChild(element.drawSVG())
    }, this)

    return svg
  }

  setMouseState(event) {
    let box = this.HTML.getBoundingClientRect()
    let date = new Date()
    this.visualization.mouseState = {
      x: event.clientX - box.left - this.padding,
      y: event.clientY - box.top - this.padding,
      time: date.getTime(),
    }

    this.redraw()
  }

  mouseIsWithinDragBoundary(mouseState) {
    if (
      mouseState.x < this.dragBoundary ||
      mouseState.y < this.dragBoundary ||
      mouseState.x > this.settings.w - this.dragBoundary ||
      mouseState.y > this.settings.h - this.dragBoundary
    ) {
      return true
    }
    return false
  }

  visualizationConstructor(visualization) {
    this.visualization = visualization
    for (let [event, eventFunction] of Object.entries(visualization.listeners)) {
      this.HTML.addEventListener(event, eventFunction)
    }
  }

  visualizationDestructor() {
    if (this.visualization !== undefined) {
      for (let [event, eventFunction] of Object.entries(this.visualization.listeners)) {
        this.HTML.removeEventListener(event, eventFunction)
      }
    }
  }
}

class WebwebPlot {
  constructor(settings, nodes, canvas) {
    this.settings = settings
    this.nodes = nodes
    this.canvas = canvas
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

export class ChordDiagram extends WebwebPlot {
  constructor(settings, nodes, canvas) {
    super(settings, nodes, canvas)
    let chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending)

    const chords = chord(data);

    let outerRadius = 290
    let innerRadius = 270

    let arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)

    let ribbon = d3.ribbon()
      .radius(innerRadius)

    const group = svg.append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    group.append("path")
      .attr("fill", d => color(d.index))
      .attr("stroke", d => d3.rgb(color(d.index)).darker())
      .attr("d", arc);

    svg.append("g")
      .attr("fill-opacity", 0.67)
      .selectAll("path")
      .data(chords)
      .join("path")
        .attr("d", ribbon)
        .attr("fill", d => color(d.target.index))
        .attr("stroke", d => d3.rgb(color(d.target.index)).darker());
  }
}

export class ForceDirectedPlot extends WebwebPlot {
  constructor(settings, nodes, canvas) {
    super(settings, nodes, canvas)
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

  getRedrawContent() {
    this.nodesMatchingString(this.settings.nameToMatch)
    this.nodesContainingMouse(this.mouseState)

    let elementsToDraw = []

    let ctx = this.context
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
}
