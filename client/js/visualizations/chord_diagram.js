import { AbstractVisualization } from './abstract_visualization'
import { DivergingScalarAttribute } from '../attribute'
import { ChordDiagramSettings } from './chord_diagram/settings'
import { chordDiagramWidgets } from './chord_diagram/widgets'
import * as svgUtils from '../svg_utils'
import * as shapes from '../shapes'

import * as d3 from 'd3'

export class ChordDiagramVisualization extends AbstractVisualization {
  static get settingsObject() { return ChordDiagramSettings }
  static get opacity() { return .5 }

  get widgets() { return chordDiagramWidgets() }

  get handlers() {
    return {
      'redraw': settings =>  this.redraw(settings),
    }
  }

  get listeners() {
    return {
      "mousemove": event => {
        this.setTextsToDraw()
        this.canvas.redraw()
      },
    }
  }

  constructor(settings, menu, canvas, layer) {
    super(settings, menu, canvas, layer)

    // FIX SETTINGS
    this.objectSettings = {
      'radius': {
        'outside': 290,
        'outer': 270,
        'inner': 250,
      },
    }

    this.chordFunction = d3.chord()
      .padAngle(0.03)
      .sortSubgroups(d3.descending)

    this.nodePathFunction = d3.arc()
      .innerRadius(this.objectSettings.radius.inner)
      .outerRadius(this.objectSettings.radius.outer)
      
    this.annotationsArc = d3.arc()
      .innerRadius(this.objectSettings.radius.outer)
      .outerRadius(this.objectSettings.radius.outside)
      
    this.edgePathFunction = d3.ribbon()
      .radius(this.objectSettings.radius.inner)

    this.update()
  }

  update() {
    this.setVisualizationObjects()

    this.setActiveAttributes()

    this.setNodesToDraw()
    this.setEdgesToDraw()
    this.setTextsToDraw()
  }

  setVisualizationObjects() {
    const sortAttribute = this.settings.sortNodesBy == 'out degree' ? 'outDegrees' : 'inDegrees'

    let elementsBySortAttribute = Object.entries(
      this.layer.constructor[sortAttribute](this.layer.matrix)
    ).sort((a, b) => a[1] - b[1])

    if (this.settings.sortNodes == 'descending') {
      elementsBySortAttribute = elementsBySortAttribute.reverse()
    }

    this.matrix = []
    this.nodes = {}
    let counter = 0
    for (let [i, v] of elementsBySortAttribute) {
      this.matrix.push(this.layer.matrix[i])
      this.nodes[counter] = this.layer.nodes[i]
      counter += 1
    }

    const chordsD3 = this.chordFunction(this.matrix) 
    this.groups = chordsD3.groups

    this.chords = []
    for (let [key, value] of Object.entries(chordsD3)) {
      if (key !== 'groups') {
        this.chords.push(value)
      }
    }

    this.edgeRatios = this.chords.map(chord => this.convertEdgesToRatios(this.matrix, chord))

    this.availableAttributes = {
      'edgeColor': new DivergingScalarAttribute('edgeRatio', this.edgeRatios),
    }
  }

  convertEdgesToRatios(matrix, object){
    let source = object.source.index
    let target = object.target.index

    let outWeight = matrix[source][target]
    let inWeight = matrix[target][source] || 1

    return outWeight / inWeight
  }

  setNodesToDraw() {
    this.nodesToDraw = []
    for (let [i, arc] of this.groups.entries()) {
      const color = this.attributes.nodeColor.getNodeColorValue(this.nodes[i])
      const path = this.nodePathFunction(arc)
      this.nodesToDraw.push(new shapes.Path(path, color, this.constructor.opacity))
    }
  }

  setEdgesToDraw() {
    this.edgesToDraw = []
    for (let [i, chord] of Object.entries(this.chords)) {
      const color = this.attributes.edgeColor.getColorValue(this.edgeRatios[i])
      const path = this.edgePathFunction(chord)
      this.edgesToDraw.push(new shapes.Path(path, color, this.constructor.opacity))
    }
  }

  setTextsToDraw() {
    this.textsToDraw = []
    for (let [i, nodeToDraw] of Object.entries(this.nodesToDraw)) {
      if (nodeToDraw.containsPoint(this.mouseState.x, this.mouseState.y)) {
        const [x, y] = this.annotationsArc.centroid(this.groups[i])
        const textAlign = x > 0 ? 'left' : 'right'
        const text = this.nodes[i].name
        this.textsToDraw.push(new shapes.Text(text, x, y, undefined, undefined, textAlign))
      }
    }
  }
}
