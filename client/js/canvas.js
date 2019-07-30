console.log(JSON.stringify('on any update, change the settings object of all nodes and links'));

export class CanvasState {
  constructor(settings) {
    this.settings = settings

    this.dpr = window.devicePixelRatio || 1
    this.canvas = document.createElement("canvas")
    this.canvas.id = "webweb-vis-canvas"

    this.canvas.style.width = this.settings.w + "px"
    this.canvas.style.height = this.settings.h + "px"

    this.canvas.width = this.settings.w * this.dpr
    this.canvas.height = this.settings.h * this.dpr

    // this.setContext()

    this.padding = 3
    this.dragBoundary = 15

    this.dragging = false
    this.draggedNode = undefined

    this.canvas.addEventListener("mousedown", this.canvas.mouseDownListener)
    this.canvas.addEventListener("mousemove", this.canvas.mouseMoveListener)
    this.canvas.addEventListener("mouseup", this.canvas.mouseUpListener)
  }

  setContext() {
    if (this.context == undefined) {
      this.context = this.canvas.getContext('2d')
      // TODO: FIX THIS?
      // this.context.scale(this.dpr, this.dpr)
    }
  }

  clear() {
    this.context.clearRect(0, 0, this.settings.w, this.settings.h)
  }

  redraw() {
    this.clear()
    this.links.forEach(function(link) {
      link.draw(this.context)
    }, this)

    this.nodes.forEach(function(node) {
      node.draw(this.context)
    }, this);

    this.nodes.forEach(function(node) {
      node.nodeText.draw(this.context)
    }, this)

    if (this.settings.showLegend) {
      this.legendNodes.forEach(function(node) {
        node.draw(this.context);
      }, this);
      this.settings.legendText.forEach(function(text) {
        text.draw(this.context);
      }, this);
    }
  }

  getMouseState(event) {
    let box = this.canvas.getBoundingClientRect()
    const mouseState = {
      x: event.clientX - box.left - this.padding,
      y: event.clientY - box.top - this.padding,
    }

    return mouseState
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
  endDragging() {
    // TODO:
    // - fix this
    // webweb.simulation.alphaTarget(0);
    console.log(JSON.stringify('sim broke'))

    if (! this.settings.freezeNodeMovement && this.draggedNode !== undefined) {
      this.draggedNode.fx = null
      this.draggedNode.fy = null
    }
    this.draggedNode = undefined;
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

    for (let node of this.nodes) {
      if (node.containsMouse()) {
        this.dragging = true
        this.draggedNode = node

        // TODO:
        // - make this work
        // webweb.simulation.alphaTarget(0.3).restart();
        console.log(JSON.stringify('sim broke'))

        this.updateDraggedNode(mouseState)
      }
    }
  }
}
