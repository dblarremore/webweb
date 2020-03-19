export class AbstractVisualization {
  constructor(settings, nodes, canvas, layer) {
    this.settings = settings
    this.nodes = nodes
    this.canvas = canvas
    this.layer = layer
  }

  update(settings, nodes, layer, scales) {
    this.settings = settings
    this.layer = layer
    this.scales = scales
  }

  get listeners() {
    return {}
  }

  get callers() {
    return {}
  }
}
