import { AbstractVisualization } from './abstract_visualization'
import { NoneAttribute, DivergingScalarAttribute } from '../attribute'
import { ChordDiagramSettings } from './chord_diagram/settings'
import * as widgets  from './chord_diagram/widgets'
import * as svgUtils from '../svg_utils'

import * as d3 from 'd3'

export class ChordDiagramVisualization extends AbstractVisualization {
  static get settingsObject() { return ChordDiagramSettings }
  static get opacity() { return .67 }
  static get pathSamples() { return 200 }

  get handlers() {
    return {
      'redraw': settings =>  this.redraw(settings),
    }
  }

  get widgets() {
    return {
      'left': {
        'nodeSort': [
          widgets.SortNodesByWidget,
          widgets.SortNodesWidget,
        ],
        'nodeColor': [
          widgets.ColorNodesSelectWidget,
          widgets.NodeColorPaletteSelectWidget,
          widgets.FlipNodeColorScaleWidget,
        ],
        'edges': [
          widgets.ColorEdgesWidget,
          widgets.EdgeColorPaletteSelectWidget,
          widgets.FlipEdgeColorScaleWidget,
        ],
      }
    }
  }

  get listeners() {
    return {
      "mousemove": event => this.mouseMoveListener(),
    }
  }

  constructor(settings, menu, canvas, layer, nodes) {
    super(settings, menu, canvas, layer, nodes)

    // FIX SETTINGS
    this.objectSettings = {
      'radius': {
        'outer': 290,
        'inner': 270,
      },
    }

    this.canvas.context.translate(canvas.width / 2, canvas.height / 2)

    this.chordFunction = d3.chord()
      .padAngle(0.05)
      // .sortSubgroups(d3.descending)

    this.arc = d3.arc()
      .innerRadius(this.objectSettings.radius.inner)
      .outerRadius(this.objectSettings.radius.outer)
      
    this.ribbon = d3.ribbon()
      .radius(this.objectSettings.radius.inner)

    this.noneAttribute = new NoneAttribute()
    this.setVisualizationObjects()
  }

  translateMouseState(mouseState) {
    return [
      this.mouseState.x - (this.canvas.width / 2),
      this.mouseState.y - (this.canvas.height / 2)
    ]
  }

  get edgeColorAttribute() {
    return this.settings.colorEdges ? this.edgeColor : this.noneAttribute
  }

  get nodeColorAttribute() {
    const attributeName = this.settings.colorNodesBy
    return this.layer.attributes.color[attributeName]
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

    const edgeRatios = this.chords.map(chord => this.convertEdgesToRatios(this.matrix, chord))

    this.edgeRatios = {}
    for (let [i, ratio] of Object.entries(edgeRatios)) {
      this.edgeRatios[i] = {
        'edgeRatio': ratio
      }
    }

    this.edgeColor = new DivergingScalarAttribute('edgeRatio', this.edgeRatios, 'color')
  }

  updateAttributes() {
    this.setVisualizationObjects()

    this.edgeColor.coloror.setPalette(this.settings.edgeColorPalette)
    this.edgeColor.setScaleRange(this.settings.flipEdgeColorScale ? [1, 0] : [0, 1])

    this.nodeColorAttribute.coloror.setPalette(this.settings.nodeColorPalette)
    // this won't work for categorical
    this.nodeColorAttribute.setScaleRange(this.settings.flipNodeColorScale ? [1, 0] : [0, 1])
  }

  convertEdgesToRatios(matrix, object){
    let source = object.source.index
    let target = object.target.index

    let outWeight = matrix[source][target]
    let inWeight = matrix[target][source] || 1

    return outWeight / inWeight
  }

  mouseMoveListener(event) {
    for (let [i, points] of Object.entries(this.nodePoints)) {
      if (this.containsMouse(points)) {
        console.log(this.nodes[i])
      }
    }
  }

  containsMouse(points) {
    if (this.mouseState == undefined) {
      return false
    }

    return d3.polygonContains(points, this.translateMouseState(this.mouseState))
  }

  getChordsToDraw() {
    let chords = []
    for (const [i, chord] of Object.entries(this.chords)) {
      const color = this.edgeColorAttribute.getNodeColorValue(this.edgeRatios[i])
      const path = this.ribbon(chord)

      chords.push([color, path])
    }
    return chords
  }

  getArcsToDraw() {
    let arcs = []
    this.nodePoints = []
    for (const [i, arc] of this.groups.entries()) {
      const color = this.nodeColorAttribute.getNodeColorValue(this.nodes[i])
      const path = this.arc(arc)

      this.nodePoints.push(this.getPathPoints(path))

      arcs.push([color, path])
    }
    return arcs
  }

  getPathPoints(path) {
    const element = this.drawObjectSVG(path, 'black')

    const totalLength = element.getTotalLength()
    const points = []
    for (let i = 0; i < this.constructor.pathSamples; i++) {
      const length = (i / this.constructor.pathSamples) * totalLength
      const svgPoint = element.getPointAtLength(length)
      points.push([svgPoint.x, svgPoint.y])
    }

    return points
  }

  drawObjectSVG(path, color) {
    const opacity = this.constructor.opacity
    const outline = d3.rgb(color).darker().hex()
    return svgUtils.drawPathSVG(path, opacity, color, outline)
  }

  redraw(settings) {
    this.settings = this.formatSettings(settings)
    this.updateWidgets()
    this.updateAttributes()
    this.canvas.redraw()
  }

  draw(mouseState) {
    this.mouseState = mouseState

    let chords = this.getChordsToDraw()
    let arcs = this.getArcsToDraw()

    let polygons = []
    let pathsByColor = {}
    for (let [color, rawPath] of chords.concat(arcs)) {
      color = color.hex()
      if (pathsByColor[color] == undefined) {
        pathsByColor[color] = new Path2D()
      }

      polygons.push(rawPath)
      pathsByColor[color].addPath(new Path2D(rawPath))
    }

    for (let [color, path] of Object.entries(pathsByColor)) {
      this.drawObjects(this.canvas.context, color, path)
    }
  }

  drawObjects(context, color, path) {
    context.beginPath()
    context.fillStyle = color
    context.strokeStyle = d3.rgb(color).darker().hex()
    context.globalAlpha = this.constructor.opacity
    context.stroke(path)
    context.fill(path)
  }
}
