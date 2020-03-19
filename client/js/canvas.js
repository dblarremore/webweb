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
    this.visualization.draw(this.mouseState)
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
