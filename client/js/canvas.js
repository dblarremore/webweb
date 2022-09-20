import * as d3 from 'd3'
import { CanvasParameters } from './parameters'
import * as shapes from './shapes'

/*
  * how to implement canvas saving?
  *
  * client side experience:
  * 1. on draw, save canvas with a key
  * 2. on new draw, draw on new canvas
  * 3. on some later draw, be able to draw on saved canvas
  * */

export class WebwebCanvas {
    get padding() { return 3 }
    get dragBoundary() { return 15 }
    get dpr() { return window.devicePixelRatio || 1 }
    get defaultCanvasKey() { return 'primaryCanvas' }

    constructor(controller, clientWidth, clientHeight, menuHeight) {
        this.controller = controller
        this.defineDimensions(clientWidth, clientHeight, menuHeight)

        this.initializeCanvases()
        this.listen = true
    }

    defineDimensions(clientWidth, clientHeight, menuHeight) {
        const availableHeight = this.controller.settings.HTMLParentElementId !== undefined
            ? clientWidth
            : clientHeight - menuHeight

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

    get canvasWidthHTML() { return this.width + "px" }
    get canvasHeightHTML() { return this.height + "px" }

    get canvasWidth() { return this.width * this.dpr }
    get canvasHeight() { return this.height * this.dpr }

    setTranslation(x=0, y=0) {
        this.xTranslate = x
        this.yTranslate = y
        this.context.translate(x, y)
    }

    reset() {
        this.context.restore()
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
                        if (this.listen) {
                            listener()
                        }
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

    // get HTML() {
    //   if (this._HTML === undefined) {
    //     this._HTML = this.makeCanvas()
    //   }

    //   return this._HTML
    // }

    initializeCanvases() {
        this.canvases = {}
        this.canvases[this.defaultCanvasKey] = this.makeCanvas(this.defaultCanvasKey)
        this.setActiveCanvas()
    }

    setActiveCanvas(key) {
        if (key === undefined) {
            key = this.defaultCanvasKey
        }

        if (this.canvases[key] === undefined) {
            this.canvases[key] = this.makeCanvas(key)
        }

        if ((this.activeCanvasKey === undefined) || (this.activeCanvasKey !== key)) {
            this.activeCanvas = this.canvases[key]
            this.addListeners(this.activeCanvas)

            this.context = this.activeCanvas.getContext("2d")
            this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.context.translate(this.xTranslate, this.yTranslate)

            this.activeCanvas.style.display = 'block'

            Object.entries(this.canvases).forEach(([canvasKey, canvas]) => {
                if (canvasKey !== key) {
                    this.removeListeners(canvas)

                    canvas.style.display = 'none'
                }
            })

            this.activeCanvasKey = key
        }
    }

    clearCanvases() {
        Object.entries(this.canvases).forEach(([key, canvas]) => {
            if (key !== this.defaultCanvasKey) {
                delete this.canvases[key]
            }
        })
    }

    canvasId(key) {
        if (key === undefined) {
            key = this.defaultCanvasKey
        }

        return "webweb-vis-canvas-" + key
    }

    makeCanvas(key) {
        const canvas = document.createElement("canvas")
        canvas.classList.add("webweb-vis-canvas")
        canvas.id = this.canvasId(key)

        canvas.style.display = 'none'

        canvas.style.width = this.canvasWidthHTML
        canvas.style.height = this.canvasHeightHTML

        canvas.width = this.canvasWidth
        canvas.height = this.canvasHeight

        // the below may fuck things up hard
        this.xTranslate = this.width / 2
        this.yTranslate = this.height / 2
        // canvas.getContext('2d').translate(this.xTranslate, this.yTranslate)
        // the above may fuck things up hard

        canvas.getContext('2d').scale(this.dpr, this.dpr)

        this.container.append(canvas)

        return canvas
    }

    get container() {
        if (this._container === undefined) {
            this._container = document.createElement("div")
            this._container.classList.add("webweb-visualization-container")
            // this._container.append(this.HTML)
        }

        return this._container
    }

    clear(canvasKey) {
        this.setActiveCanvas(canvasKey)

        this.context.save()
        this.context.setTransform(1, 0, 0, 1, 0, 0)
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
        this.context.fillStyle = 'white'
        this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
        this.context.restore()
    }

    redraw(canvasKey) {
        this.clear(canvasKey)
        this.draw(canvasKey)
    }

    restoreCanvasKey(canvasKey) {
        let shouldDraw = this.canvases[canvasKey] === undefined
        this.setActiveCanvas(canvasKey)

        if (shouldDraw) {
            this.draw(canvasKey)
        }
    }

    resetObjectsToDraw() {
        this.objectsByDrawProperties = undefined
        this.pathsByDrawProperties = undefined
    }

    draw(canvasKey) {
        this.setActiveCanvas(canvasKey)

        const objectsByZorder = this.sortElementsByZorder()
        const zorders = [... new Set(Object.keys(objectsByZorder))].sort((a, b) => parseInt(a) - parseInt(b))

        for (let zorder of zorders) {
            let elementsToDrawByDrawProperties = this.organizeElementsToDraw(objectsByZorder[zorder])

            for (let [key, objects] of Object.entries(elementsToDrawByDrawProperties.objects)) {
                objects[0].setCanvasContextProperties(this.context)
                objects.forEach(object => object.write(this.context))
                this.context.fill(elementsToDrawByDrawProperties.paths[key])
                this.context.stroke(elementsToDrawByDrawProperties.paths[key])
            }
        }
    }

    /*
     * Here's the order:
     * 1. text is always last (this is done implicitly by using -1 as the highest zorder)
     * 2. then go by zorder (higher zorder = drawn later)
     * */
    sortElementsByZorder() {
        let objectsByZorder = {}

        let maxZorder = -1

        for (let object of this.visualization.objectsToDraw) {
            let zorder = object.zorder
            maxZorder = Math.max(zorder, maxZorder)

            if (objectsByZorder[zorder] === undefined) {
                objectsByZorder[zorder] = []
            }
            objectsByZorder[zorder].push(object)
        }

        if (objectsByZorder[-1] !== undefined) {
            objectsByZorder[maxZorder] = objectsByZorder[-1]
            delete objectsByZorder[-1]
        }

        return objectsByZorder
    }

    organizeElementsToDraw(objects) {
        let elementsToDrawByDrawProperties = {
            'objects': {},
            'paths': {}
        }

        for (let object of objects) {
            const propertyKey = object.stringifiedDrawProperties
            if (elementsToDrawByDrawProperties.objects[propertyKey] === undefined) {
                elementsToDrawByDrawProperties.objects[propertyKey] = []
            }

            elementsToDrawByDrawProperties.objects[propertyKey].push(object)

            if (elementsToDrawByDrawProperties.paths[propertyKey] === undefined) {
                elementsToDrawByDrawProperties.paths[propertyKey] = new Path2D()
            }

            if (object.path) {
                elementsToDrawByDrawProperties.paths[propertyKey].addPath(object.path)
            }
        }

        return elementsToDrawByDrawProperties
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
        let box = this.activeCanvas.getBoundingClientRect()
        // let box = this.HTML.getBoundingClientRect()
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

    addListeners(canvas) {
        for (let [event, eventFunction] of Object.entries(this.listeners)) {
            canvas.addEventListener(event, eventFunction)
        }
    }

    removeListeners(canvas) {
        for (let [event, eventFunction] of Object.entries(this.listeners)) {
            canvas.removeEventListener(event, eventFunction)
        }
    }

    saveCanvas(url) {
        if (url === undefined) {
            url = this.controller.settings.networkName + '.png'
        }

        const link = document.createElement('a')
        link.href = this.controller.canvas.activeCanvas.toDataURL()

        link.download = url

        link.click()
    }
}
