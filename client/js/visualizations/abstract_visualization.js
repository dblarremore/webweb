export class AbstractVisualization {
  constructor(settings, menu, canvas, layer, nodes) {
    this.settings = this.formatSettings(settings)
    this.menu = menu
    this.canvas = canvas
    this.layer = layer
    this.nodes = nodes

    this.canvas.addListeners(this.listeners)
    this.addWidgets()

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

  get widgets() {
    return {
      'left': {},
      'right': {}
    }
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

  static get settingsObject() { return undefined }

  formatSettings(settings) {
    return this.constructor.settingsObject.getSettings(settings)
  }

  update(settings, nodes, layer, scales) {
    this.settings = settings
    this.nodes = nodes
    this.layer = layer
    this.scales = scales
  }

  get attributes() {
    return {}
  }

  get listeners() {
    return {}
  }

  get handlers() {
    return {}
  }
}
