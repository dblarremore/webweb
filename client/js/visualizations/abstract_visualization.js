import * as utils from '../utils'

export class AbstractVisualization {
  constructor(settings, menu, canvas, layer, previousNodePositions) {
    this.settings = this.formatSettings(settings)
    this.menu = menu
    this.canvas = canvas
    this.layer = layer
    this.previousNodePositions = previousNodePositions || {}

    this.canvas.reset()
    this.canvas.setTranslation(canvas.width / 2, canvas.height / 2)
    this.canvas.addListeners(this.listeners)
    this.canvas.visualization = this

    this.addWidgets()
  }

  static get settingsObject() { return undefined }
  get nodePositions() { return {} }

  get listeners() { return {} }
  get handlers() { return {} }
  get widgets() { return { 'left': {}, 'right': {}, } }

  get callHandler() { return utils.getCallHandler(this.handlers) }
  get objectsToDraw() { return [] }

  set mouseState(value) { this._mouseState = value }
  get mouseState() {
    if (this._mouseState === undefined) {
      this._mouseState = {
        'x': 0,
        'y': 0,
        'time': 0,
      }
    }
    return this._mouseState
  }

  redraw(settings) {
    this.settings = this.formatSettings(settings)
    this.menu.updateWidgets(this.settings, 'visualization')
    this.updateAttributes()
    this.canvas.redraw()
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

  formatSettings(settings) {
    return this.constructor.settingsObject.getSettings(settings)
  }

  updateAttributes() {
    return
  }
}
