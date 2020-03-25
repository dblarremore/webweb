import * as d3 from 'd3'

export class WebwebCanvas {
  constructor(settings) {
    this.settings = settings

    this.width = settings.width
    this.height = settings.height

    this.w = this.width
    this.h = this.height

    this.dpr = window.devicePixelRatio || 1

    this.canvasWidth = this.width * this.dpr
    this.canvasHeight = this.height * this.dpr

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

    HTML.style.width = this.width + "px"
    HTML.style.height = this.height + "px"

    HTML.width = this.canvasWidth
    HTML.height = this.canvasHeight

    return HTML
  }

  getBox() {
    let box = document.createElement("div")
    box.classList.add(this.boxClass)
    box.append(this.HTML)
    return box
  }

  clear() {
    this.context.save()
    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.clearRect(0, 0, this.HTML.width, this.HTML.height)
    this.context.fillStyle = 'white'
    this.context.fillRect(0, 0, this.HTML.width, this.HTML.height)
    this.context.restore()
  }

  redraw() {
    this.clear()
    this.visualization.draw()
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
    this.mouseState = {
      x: event.clientX - box.left - this.padding,
      y: event.clientY - box.top - this.padding,
      time: date.getTime(),
    }
    
    this.visualization.mouseState = this.mouseState
  }

  mouseIsWithinDragBoundary(mouseState) {
    if (
      mouseState.x < this.dragBoundary ||
      mouseState.y < this.dragBoundary ||
      mouseState.x > this.settings.width - this.dragBoundary ||
      mouseState.y > this.settings.height - this.dragBoundary
    ) {
      return true
    }
    return false
  }

  addListeners(listeners) {
    for (let [event, eventFunction] of Object.entries(listeners)) {
      this.HTML.addEventListener(event, eventFunction)
    }
  }

  removeListeners(listeners) {
    for (let [event, eventFunction] of Object.entries(listeners)) {
      this.HTML.removeEventListener(event, eventFunction)
    }
  }
}
