export class CanvasState {
  constructor(settings, simulation) {
    this.settings = settings
    this.simulation = simulation

    this.w = settings.w
    this.h = settings.h
    this.dpr = window.devicePixelRatio || 1

    this.HTMLId = "webweb-vis-canvas"
    this.HTML = this.getHTML()

    this.boxId = "webweb-visualization-container"
    this.box = this.getBox()

    this.context = this.HTML.getContext('2d')
    this.context.scale(this.dpr, this.dpr)

    this.padding = 3
    this.dragBoundary = 15

    this.dragging = false
    this.draggedNode = undefined

    let _this = this
    this.HTML.addEventListener("mousedown", (event) => {
      _this.setMouseState(event)
      _this.mouseDownListener()
    })
    this.HTML.addEventListener("mousemove", (event) => {
      _this.setMouseState(event)
      _this.mouseMoveListener()
    })
    this.HTML.addEventListener("mouseup", (event) => {
      _this.setMouseState(event)
      _this.mouseUpListener()
    })

    this.simulation.simulation.on('tick', this.redraw.bind(this))
    this.simulation.simulation.alpha(1).restart()
  }

  getBox() {
    let box = document.createElement("div")
    box.setAttribute('id', this.boxId)
    box.append(this.HTML)
    return box
  }

  getHTML() {
    let HTML = document.createElement("canvas")
    HTML.id = this.HTMLId

    HTML.style.width = this.w + "px"
    HTML.style.height = this.h + "px"

    HTML.width = this.w * this.dpr
    HTML.height = this.h * this.dpr

    return HTML
  }

  clear() {
    this.context.clearRect(0, 0, this.w, this.h)
  }

  redraw() {
    this.clear()
    this.nodesMatchingString(this.settings.nameToMatch)
    this.nodesContainingMouse(this.mouseState)

    let ctx = this.context
    if (this.simulation.links !== undefined) {
      this.simulation.links.forEach((link) => {
        link.draw(this.context)
      }, this)
    }

    this.simulation.nodes.forEach((node) => {
      node.draw(ctx)
    })

    if (this.simulation.simulation.alpha() < .05 || this.settings.freezeNodeMovement) {
      this.simulation.nodes.forEach((node) => {
        if (node.matchesString || node.containsMouse || this.settings.showNodeNames) {
          let nodeText = node.nodeText

          if (nodeText !== undefined) {
            nodeText.draw(ctx)
          }
        }
      })
    }

    this.legendNodes.forEach((node) => {
      node.draw(ctx)
    })

    this.legendText.forEach((text) => {
      text.draw(ctx)
    })

    // this.nodes.forEach(function(node) {
    //   node.nodeText.draw(this.context)
    // }, this)

    // if (this.settings.showLegend) {
    //   this.legendNodes.forEach(function(node) {
    //     node.draw(this.context);
    //   }, this);
    //   this.settings.legendText.forEach(function(text) {
    //     text.draw(this.context);
    //   }, this);
    // }
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

  setMouseState(event) {
    let box = this.HTML.getBoundingClientRect()
    this.mouseState = {
      x: event.clientX - box.left - this.padding,
      y: event.clientY - box.top - this.padding,
    }
    return this.mouseState
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
  }

  mouseMoveListener(event) {
    const mouseState = this.mouseState

    if (this.dragging) {
      if (this.mouseIsWithinDragBoundary(mouseState)) {
        this.endDragging()
      }
      else {
        this.updateDraggedNode(mouseState)
      }
    }

    this.redraw()
  }
  mouseDownListener() {
    const mouseState = this.mouseState
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
}
