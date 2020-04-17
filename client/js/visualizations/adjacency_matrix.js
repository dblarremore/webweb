import { AbstractVisualization } from './abstract_visualization'
import { AdjacencyMatrixSettings } from './adjacency_matrix/settings'
// import { chordDiagramWidgets } from './chord_diagram/widgets'
// import * as svgUtils from '../svg_utils'
import * as shapes from '../shapes'
import { Coloror } from '../coloror'

import * as d3 from 'd3'

export class AdjacencyMatrixVisualization extends AbstractVisualization {
  static get settingsObject() { return AdjacencyMatrixSettings }
  // get widgets() { return chordDiagramWidgets() }

  get handlers() {
    return {
      'redraw': settings =>  this.redraw(settings),
    }
  }

  initialize() {
    this.dimensions = {
      'grid': {
        'width': 270 * 2,
        'height': 270 * 2,
      },
    }

    this.dimensions.cell = {
      'width': this.dimensions.grid.width / this.layer.nodes.length,
      'height': this.dimensions.grid.height / this.layer.nodes.length,
    }

    this.update()
  }

  update() {
    this.setActiveAttributes()

    this.setNodesToDraw()
    this.setEdgesToDraw()
    // this.setTextsToDraw()
  }

  setNodesToDraw() {
    this.nodesToDraw = []
    const test = new Object()
    const cellWidth = this.dimensions.cell.width
    const cellHeight = this.dimensions.cell.height
    for (let [i, node] of Object.entries(this.layer.nodes)) {
      const color = Coloror.defaultColor
      const x = i * cellWidth
      const y = i * cellHeight
      const rectangle = new shapes.Rectangle(x, y, cellWidth, cellHeight, 1, color, color)
      this.translate(rectangle)
      this.nodesToDraw.push(rectangle)
    }
  }

  translate(shape) {
    shape.translate(-1 * this.dimensions.grid.width / 2, -1 * this.dimensions.grid.height / 2)
  }

  setEdgesToDraw() {
    this.edgesToDraw = []
    const cellWidth = this.dimensions.cell.width
    const cellHeight = this.dimensions.cell.height
    for (let i = 0; i <= this.layer.nodes.length; i++) {
      const x = i * cellWidth
      const y = i * cellWidth
      this.edgesToDraw.push(new shapes.Line(x, 0, x, this.dimensions.grid.width))
      this.edgesToDraw.push(new shapes.Line(0, y, this.dimensions.grid.height, y))
    }
    this.edgesToDraw.forEach(edge => this.translate(edge))
  }

  setTextsToDraw() {
    this.textsToDraw = []
    // for (let [i, nodeToDraw] of Object.entries(this.nodesToDraw)) {
    //   if (nodeToDraw.containsPoint(this.mouseState.x, this.mouseState.y)) {
    //     const [x, y] = this.annotationsArc.centroid(this.groups[i])
    //     const textAlign = x > 0 ? 'left' : 'right'
    //     const text = this.nodes[i].name
    //     this.textsToDraw.push(new shapes.Text(text, x, y, undefined, undefined, textAlign))
    //   }
    // }
  }
}
