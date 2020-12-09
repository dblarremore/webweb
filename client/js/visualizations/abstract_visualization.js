import * as utils from '../utils'
import { NoneAttribute } from '../attribute'
import { SettingsHandler } from '../settings_handler'

export class AbstractVisualization {
  get ParameterDefinitions() { return }

  get directed() { return false }
  get weighted() { return false }

  get listeners() { return {} }
  get handlers() { return {} }

  get nodePositions() { return {} }

  constructor(settings, menu, canvas, layer, previousNodePositions) {
    this.menu = menu

    this.settingsHandler = new SettingsHandler(
      this.ParameterDefinitions,
      settings,
      this.callHandler,
      this.menu,
    )

    this.layer = layer
    this.previousNodePositions = previousNodePositions || {}

    this.canvas = canvas
    this.canvas.reset()
    this.canvas.setTranslation(canvas.width / 2, canvas.height / 2)

    this.initialize()
    this.update()
  }

  get callHandler() {
    if (this._callHandler === undefined) {
      this._callHandler = utils.getCallHandler(this.handlers)
    }

    return this._callHandler
  }


  initialize() { return }
  update() { return }

  updateAttributeParameters(nodes, matrix, edges) {
    this.settingsHandler.updateAttributeParameters(
      this.layer.getAttributes(this.weighted, this.directed),
      nodes, matrix, edges
    )

    this.attributes = {}
    Object.entries(this.settingsHandler.attributeParameters).forEach(([key, parameter]) => {
      this.attributes[key] = {
        'key': parameter.attribute.key,
        'attribute': parameter.attribute,
        'values': parameter.values,
      }
    })
  }

  redraw(settings) {
    this.settings = this.settingsHandler.updateSettings(settings)
    this.update()
    this.canvas.redraw()
  }

  get objectsToDraw() {
    const objects = []
    objects.push(...(this.edgesToDraw || []))
    objects.push(...(this.nodesToDraw || []))
    objects.push(...(this.textsToDraw || []))
    objects.push(...(this.legend ? this.legend.objectsToDraw : []))

    return objects
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
}
