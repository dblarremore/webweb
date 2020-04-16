import * as utils from '../utils'
import { NoneAttribute } from '../attribute'

export class AbstractVisualization {
  get directed() { return false }
  get weighted() { return false }

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

    this.layerAttributes = this.layer.getAttributes(this.weighted, this.directed)

    this.addWidgets()
    this.initialize()
  }

  initialize() { return }

  static get settingsObject() { return undefined }
  get nodePositions() { return {} }

  get listeners() { return {} }
  get handlers() { return {} }
  get widgets() { return { 'left': {}, 'right': {}, } }

  get callHandler() { return utils.getCallHandler(this.handlers) }

  get objectsToDraw() {
    const edges = this.edgesToDraw || []
    const nodes = this.nodesToDraw || []
    const texts = this.textsToDraw || []
    const legend = this.legend ? this.legend.objectsToDraw : []

    return edges.concat(nodes).concat(texts).concat(legend)
  }

  getSettingValueIfKeyDefined(key) {
    if (key) {
      const setting = this.settings[key]
      return setting
    }
  }

  /*
   * this function is getting gibberish. I've made some (very useful but) very
   * opaque decisions, namely about using things from settings objects
    * */
  setActiveAttributes() {
    this.attributes = {}
    this.attributeValues = {}

    for (let [name, settingKeys] of Object.entries(this.constructor.settingsObject.attributes)) {
      let attribute

      if (settingKeys.from === 'layer') {
        // if the setting is from a selection menu, set it to the value from there
        let attributeInfo = this.layerAttributes[this.settings[settingKeys.input]]
        let attributeValues = attributeInfo.getValues(Object.values(this.layer.nodes), this.layer.matrix)
        this.attributeValues[name] = attributeValues
        attribute = new attributeInfo.class(this.settings[settingKeys.input], attributeValues)
      }
      else if (settingKeys.from === 'visualization') {
        attribute = this.availableAttributes[name]
      }

      // the attribute is a None attribute if it's not on
      if (settingKeys.on !== undefined) {
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

        const widget = this.menu.getSettingWidget(settingKeys.colorPalette, 'visualization')
        widget.options = attribute.colorPalettes
        widget.refresh(this.settings)
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
        this.layerAttributes,
      )
    }
  }

  formatSettings(settings) {
    return this.constructor.settingsObject.getSettings(settings)
  }

  update() { return }
}
