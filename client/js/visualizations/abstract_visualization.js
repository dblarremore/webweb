export class AbstractVisualization {
  constructor(settings, menu, canvas, layer, nodes) {
    this.settings = this.formatSettings(settings)
    this.menu = menu
    this.canvas = canvas
    this.layer = layer
    this.nodes = nodes

    this.canvas.context.translate(canvas.width / 2, canvas.height / 2)
    this.canvas.addListeners(this.listeners)
    this.addWidgets()

  }

  set mouseState(mouseState) {
    this._mouseState = mouseState
    this._mouseState.x  -= this.canvas.width / 2
    this._mouseState.y  -= this.canvas.height / 2
  }

  get mouseState() { return this._mouseState }

  redraw(settings) {
    this.settings = this.formatSettings(settings)
    this.updateWidgets()
    this.updateAttributes()
    this.canvas.redraw()
  }

  static get settingsObject() { return undefined }

  get listeners() { return {} }
  get handlers() { return {} }
  
  get widgets() {
    return {
      'left': {},
      'right': {},
    }
  }

  get callHandler() {
    const handlers = this.handlers
    let handleFunction = (handlerRequest, settings) => {
      let fn = handlers[handlerRequest]
      if (fn !== undefined) {
        fn(settings)
      }
    }

    return handleFunction
  }

  addWidgets() {
    for (let [side, widgets] of Object.entries(this.widgets)) {
      this.menu.addWidgets(
        'visualization',
        side,
        widgets,
        this.settings,
        this.callHandler,
        this.layer.attributes,
      )
    }
  }

  updateWidgets() {
    for (let side of Object.keys(this.menu.widgets)) {
      const sideWidgets = this.menu.widgets[side]['visualization'] || []
      for (let widget of sideWidgets) {
        widget.refresh(this.settings)
      }
    }
  }

  formatSettings(settings) {
    return this.constructor.settingsObject.getSettings(settings)
  }

  updateAttributes() {
    return
  }
}
