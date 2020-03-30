import * as utils from '../utils'
import { NoneAttribute } from '../attribute'

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

  get objectsToDraw() {
    const edges = this.edgesToDraw
    const nodes = this.nodesToDraw
    const texts = this.textsToDraw
    const legend = this.legend ? this.legend.objectsToDraw : []

    return edges.concat(nodes).concat(texts).concat(legend)
  }

  getSettingValueIfKeyDefined(key) {
    if (key) {
      const setting = this.settings[key]
      return setting
    }
  }

  setActiveAttributes() {
    this.attributes = {}

    for (let [name, settingKeys] of Object.entries(this.constructor.settingsObject.attributes)) {
      let attribute

      if (settingKeys.from === 'layer') {
        // if the setting is from a selection menu, set it to the value from there
        attribute = this.layer.attributes[settingKeys.type][this.settings[settingKeys.input]]
      }
      else if (settingKeys.from === 'visualization') {
        attribute = this.availableAttributes[name]
      }

      // the attribute is a None attribute if it's not on
      if (settingKeys.on) {
        if (! this.settings[settingKeys.on]) {
          attribute = new NoneAttribute()
        }
      }
      else if (attribute === undefined) {
        attribute = new NoneAttribute()
      }

      this.attributes[name] = attribute

      if (attribute instanceof NoneAttribute) {
        continue
      }

      if (settingKeys.range) {
        attribute.scaleReversed = false
        attribute.setScaleRange(this.settings[settingKeys.range])
      }

      if (settingKeys.colorPalette) {
        attribute.colorPalette = this.settings[settingKeys.colorPalette]
      }

      if (settingKeys.flip) {
        attribute.setScaleReverse(this.settings[settingKeys.flip])
      }
    }
  }

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
    this.update()
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

  update() { return }
}
