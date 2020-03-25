import * as utils from '../utils'

export class AbstractVisualization {
  constructor(settings, menu, canvas, layer, previousNodePositions) {
    this.settings = this.formatSettings(settings)
    this.menu = menu
    this.canvas = canvas
    this.layer = layer
    this.previousNodePositions = previousNodePositions || {}

    this.canvas.reset()
    this.canvas.context.translate(canvas.width / 2, canvas.height / 2)
    this.canvas.addListeners(this.listeners)
    this.canvas.visualization = this

    this.addWidgets()
  }

  get nodePositions() { return {} }

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

  get callHandler() { return utils.getCallHandler(this.handlers) }

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
