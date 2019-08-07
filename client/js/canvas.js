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

    this.HTML.addEventListener("mousedown", this.HTML.mouseDownListener)
    this.HTML.addEventListener("mousemove", this.HTML.mouseMoveListener)
    this.HTML.addEventListener("mouseup", this.HTML.mouseUpListener)

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
        let nodeText = node.nodeText

        if (nodeText !== undefined) {
          nodeText.draw(ctx)
        }
      })
    }

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

  getMouseState(event) {
    let box = this.HTML.getBoundingClientRect()
    return {
      x: event.clientX - box.left - this.padding,
      y: event.clientY - box.top - this.padding,
    }
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
    this.simulation.alphaTarget(0)

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
    const mouseState = this.getMouseState(event)

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
  mouseDownListener(event) {
    const mouseState = this.getMouseState(event)
    this.endDragging()

    for (let node of this.simulation.nodes) {
      if (node.containsMouse(mouseState)) {
        this.dragging = true
        this.draggedNode = node

        this.simulation.alphaTarget(0.3).restart()
        this.updateDraggedNode(mouseState)
      }
    }
  }
}
