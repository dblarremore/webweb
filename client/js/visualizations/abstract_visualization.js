import * as utils from '../utils'
import { NoneAttribute } from '../attribute'

export class AbstractVisualization {
  get ParameterDefinitions() { return }

  get directed() { return false }
  get weighted() { return false }

  get listeners() { return {} }
  get handlers() { return {} }

  get nodePositions() { return {} }

  constructor(controller, layer, previousNodePositions) {
    this.controller = controller
    this.controller.addParameterCollection(
      'visualization',
      this.ParameterDefinitions,
      this.callHandler,
  )

    this.layer = layer
    this.previousNodePositions = previousNodePositions || {}

    this.controller.canvas.visualization = this
    this.controller.canvas.reset()

    this.initialize()
    this.update()
    this.redraw(this.controller.settings)
  }

  get callHandler() {
    if (this._callHandler === undefined) {
      this._callHandler = utils.getCallHandler(this.handlers)
    }

    return this._callHandler
  }


  initialize() { return }
  update() { return }

  updateAttributeParameters() {
    this.controller.collections['visualization'].updateAttributeParameters(
      this.layer.getAttributes(this.weighted, this.directed),
      this.layer,
    )
    
    this.attributes = {}
    Object.entries(
      this.controller.collections['visualization'].attributeParameters
    ).forEach(([key, parameter]) => {
      this.attributes[key] = {
        'key': parameter.attribute.key,
        'attribute': parameter.attribute,
        'values': parameter.values,
      }
    })
  }

  redraw(settings) {
    this.controller.settings = settings
    this.controller.collections['visualization'].updateSettings()
    this.controller.canvas.resetObjectsToDraw()
    this.update()
    this.controller.canvas.redraw()
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
