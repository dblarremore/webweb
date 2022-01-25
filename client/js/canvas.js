import * as d3 from 'd3'
import { CanvasParameters } from './parameters'
import * as shapes from './shapes'

export class WebwebCanvas {
  get padding() { return 3 }
  get dragBoundary() { return 15 }
  get dpr() { return window.devicePixelRatio || 1}

  constructor(controller, clientWidth, clientHeight, menuHeight) {
    this.controller = controller
    this.setDimensions(clientWidth, clientHeight, menuHeight)

    this.canvasWidth = this.width * this.dpr
    this.canvasHeight = this.height * this.dpr

    this.context = this.HTML.getContext('2d')
    this.context.scale(this.dpr, this.dpr)

    this.addListeners(this.listeners)
  }

  setDimensions(clientWidth, clientHeight, menuHeight) {
    const availableHeight = clientHeight - menuHeight

    // const widthDefault = Math.min(clientWidth, availableHeight)
    const widthDefault = clientWidth
    const heightDefault = availableHeight

    CanvasParameters.width.default = widthDefault
    CanvasParameters.height.default = heightDefault

    this.controller.addParameterCollection('canvas', CanvasParameters)

    this.width = this.controller.settings.width
    this.height = this.controller.settings.height
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

  resetObjectsToDraw() {
    this.objectsByDrawProperties = undefined
    this.pathsByDrawProperties = undefined
  }

  draw() {
    if (this.elementsToDrawByDrawProperties === undefined) {
      this.organizeElementsToDraw()
    }

    for (let [key, objects] of Object.entries(this.elementsToDrawByDrawProperties.objects)) {
      objects[0].setCanvasContextProperties(this.context)
      objects.forEach(object => object.write(this.context))
      this.context.fill(this.elementsToDrawByDrawProperties.paths[key])
      this.context.stroke(this.elementsToDrawByDrawProperties.paths[key])
    }

    if (this.saveState) {
      this.savePreviousElementsToDrawByDrawProperties()
    }

    // reset the objects to draw afterward so that the default behavior is to recalculate what to draw
    this.elementsToDrawByDrawProperties = undefined
    this.saveState = false
  }

  savePreviousElementsToDrawByDrawProperties() {
    this.previousElementsToDrawByDrawProperties = {
      'objects': {},
      'paths': this.elementsToDrawByDrawProperties.paths,
    }

    for (let [key, objects] of Object.entries(this.elementsToDrawByDrawProperties.objects)) {
      let deepCopiedObjects = []
      for (let object of objects) {
        let newObjectClass = shapes.getClassForInstanceOfClass(object)

        let constructorArgs = []
        newObjectClass.constructorArgs.forEach(key => constructorArgs.push(object[key]))

        let newObject = new newObjectClass(...constructorArgs)

        for (let [_key, _val] of Object.entries(object)) {
          newObject[_key] = _val
        }

        deepCopiedObjects.push(newObject)
      }

      this.previousElementsToDrawByDrawProperties.objects[key] = deepCopiedObjects
    }
  }

  organizeElementsToDraw() {
    this.elementsToDrawByDrawProperties = {
      'objects': {},
      'paths': {}
    }

    for (let object of this.visualization.objectsToDraw) {
      const propertyKey = object.stringifiedDrawProperties
      if (this.elementsToDrawByDrawProperties.objects[propertyKey] === undefined) {
        this.elementsToDrawByDrawProperties.objects[propertyKey] = []
      }
      
      this.elementsToDrawByDrawProperties.objects[propertyKey].push(object)

      if (this.elementsToDrawByDrawProperties.paths[propertyKey] === undefined) {
        this.elementsToDrawByDrawProperties.paths[propertyKey] = new Path2D()
      }

      if (object.path) {
        this.elementsToDrawByDrawProperties.paths[propertyKey].addPath(object.path)
      }
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
