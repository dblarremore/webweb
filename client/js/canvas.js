import * as d3 from 'd3'
import { CanvasParameters } from './parameters'
import { SettingsHandler } from './settings_handler'

export class WebwebCanvas {
  get padding() { return 3 }
  get dragBoundary() { return 15 }
  get dpr() { return window.devicePixelRatio || 1}

  constructor(settings, clientWidth, box) {
    [this.width, this.height] = this.getDimensions(settings, clientWidth)

    this.canvasWidth = this.width * this.dpr
    this.canvasHeight = this.height * this.dpr

    this.context = this.HTML.getContext('2d')
    this.context.scale(this.dpr, this.dpr)

    this.addListeners(this.listeners)
  }

  getDimensions(settings, clientWidth) {
    let heuristic = clientWidth - 3 * 20

    if (heuristic <= 0) {
      heuristic = 1000
    }

    const widthDefault = Math.min(heuristic, 1000)
    const heightDefault = Math.min(widthDefault, 600)

    CanvasParameters.width.default = widthDefault
    CanvasParameters.height.default = heightDefault
    const settingHandler = new SettingsHandler(CanvasParameters, settings)
    return [settingHandler.settings.width, settingHandler.settings.height]
  }

  get xTranslate() { return this._xTranslate || 0 }
  set xTranslate(value) { this._xTranslate = value }

  get yTranslate() { return this._yTranslate || 0 }
  set yTranslate(value) { this._yTranslate = value }

  setTranslation(x=0, y=0) {
    this.xTranslate = x
    this.yTranslate = y
    this.context.translate(x, y)
  }

  reset() {
    this.context.restore()
    this.setTranslation()
    this.context.save()
    this.clear()
  }

  getListener(eventName) {
    return (event) => {
      this.setMouseState(event)

      if (this.visualization !== undefined) {
        const listeners = this.visualization.listeners

        if (listeners !== undefined) {
          const listener = listeners[eventName]

          if (listener !== undefined) {
            listener()
          }
        }
      }
    }
  }

  get listeners() {
    return {
      "mousedown": this.getListener("mousedown"),
      "mousemove": this.getListener("mousemove"),
      "mouseup": this.getListener("mouseup"),
    }
  }

  get HTML() {
    if (this._HTML === undefined) {

      this._HTML = document.createElement("canvas")
      this._HTML.classList.add("webweb-vis-canvas")

      this._HTML.style.width = this.width + "px"
      this._HTML.style.height = this.height + "px"

      this._HTML.width = this.canvasWidth
      this._HTML.height = this.canvasHeight
    }

    return this._HTML
  }

  get container() {
    if (this._container === undefined) {
      this._container = document.createElement("div")
      this._container.classList.add("webweb-visualization-container")
      this._container.append(this.HTML)
    }

    return this._container
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
    this.draw()
  }

  draw() {
    let objectsByDrawProperties = {}
    let pathsByDrawProperties = {}
    for (let object of this.visualization.objectsToDraw) {
      const propertyKey = object.stringifiedDrawProperties
      if (objectsByDrawProperties[propertyKey] === undefined) {
        objectsByDrawProperties[propertyKey] = []
      }
      
      objectsByDrawProperties[propertyKey].push(object)

      if (pathsByDrawProperties[propertyKey] === undefined) {
        pathsByDrawProperties[propertyKey] = new Path2D()
      }

      if (object.path) {
        pathsByDrawProperties[propertyKey].addPath(object.path)
      }
    }

    for (let [key, objects] of Object.entries(objectsByDrawProperties)) {
      objects[0].setCanvasContextProperties(this.context)
      objects.forEach(object => object.write(this.context))
      this.context.fill(pathsByDrawProperties[key])
      this.context.stroke(pathsByDrawProperties[key])
    }
  }

  isPointInPath(path, x, y) {
    return this.context.isPointInPath(
      path,
      this.dpr * (x + this.xTranslate),
      this.dpr * (y + this.yTranslate)
    )
  }

  svgDraw() {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.visualization.objectsToDraw.forEach(object => svg.appendChild(object.svg))
    return svg
  }

  setMouseState(event) {
    let box = this.HTML.getBoundingClientRect()
    let date = new Date()
    this.mouseState = {
      x: event.clientX - box.left - this.padding - this.xTranslate,
      y: event.clientY - box.top - this.padding - this.yTranslate,
      time: date.getTime(),
    }
    
    if (this.visualization !== undefined) {
      this.visualization.mouseState = this.mouseState
    }
  }

  mouseIsWithinDragBoundary(mouseState) {
    const widthMargin = this.width / 2
    const heightMargin = this.height / 2

    if (
      mouseState.x < this.dragBoundary - widthMargin ||
      mouseState.y < this.dragBoundary - heightMargin ||
      mouseState.x > widthMargin - this.dragBoundary ||
      mouseState.y > heightMargin - this.dragBoundary
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
