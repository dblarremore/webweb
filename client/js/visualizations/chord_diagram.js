import { AbstractVisualization } from './abstract_visualization'
import { NoneAttribute, DivergingScalarAttribute } from '../attribute'
import { ChordDiagramSettings } from './chord_diagram/settings'
import { chordDiagramWidgets } from './chord_diagram/widgets'
import * as svgUtils from '../svg_utils'
import * as shapes from '../shapes'

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

  get listeners() {
    return {
      "mousemove": event => this.mouseMoveListener(),
    }
  }

  get widgets() { return chordDiagramWidgets() }

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

    this.arc = d3.arc()
      .innerRadius(this.objectSettings.radius.inner)
      .outerRadius(this.objectSettings.radius.outer)
      
    this.annotationsArc = d3.arc()
      .innerRadius(this.objectSettings.radius.outer)
      .outerRadius(this.objectSettings.radius.outside)
      
    this.ribbon = d3.ribbon()
      .radius(this.objectSettings.radius.inner)

    this.noneAttribute = new NoneAttribute()
    this.updateAttributes()
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

    this.edgeRatios = this.chords.map(chord => this.convertEdgesToRatios(this.matrix, chord))
    this.edgeColor = new DivergingScalarAttribute('edgeRatio', this.edgeRatios)

    this.texts = this.nodeTexts
  }

  get nodeTexts() {
    let texts = []
    for (let [i, arc] of Object.entries(this.groups)) {
      let [x, y] = this.annotationsArc.centroid(arc)

      const textAlign = x > 0 ? 'left' : 'right'
      texts.push(new shapes.Text(this.nodes[i].name, x, y, undefined, undefined, textAlign))
    }
    return texts
  }

  updateAttributes() {
    this.setVisualizationObjects()

    this.edgeColor.coloror.setPalette(this.settings.edgeColorPalette)
    this.edgeColor.setScaleRange(this.settings.flipEdgeColorScale ? [1, 0] : [0, 1])

    this.nodeColorAttribute.coloror.setPalette(this.settings.nodeColorPalette)
    // this won't work for categorical
    this.nodeColorAttribute.setScaleRange(this.settings.flipNodeColorScale ? [1, 0] : [0, 1])

    this.setPathsToDrawByColor()
  }

  convertEdgesToRatios(matrix, object){
    let source = object.source.index
    let target = object.target.index

    let outWeight = matrix[source][target]
    let inWeight = matrix[target][source] || 1

    return outWeight / inWeight
  }

  mouseMoveListener(event) {
    if (this.mouseContained == true) {
      this.mouseContained = false
      this.redraw(this.settings)
    }

    for (let [i, points] of Object.entries(this.nodePoints)) {
      if (this.containsMouse(points)) {
        this.mouseContained = true
        this.texts[i].draw(this.canvas.context)
      }
    }
  }

  containsMouse(points) {
    if (this.mouseState == undefined) {
      return false
    }

    return d3.polygonContains(points, this.mouseState)
  }

  getChordsToDraw() {
    let chords = []
    for (const [i, chord] of Object.entries(this.chords)) {
      // const color = this.edgeColorAttribute.getNodeColorValue(this.edgeRatios[i])
      const color = this.edgeColorAttribute.getColorValue(this.edgeRatios[i])
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

  /*
   * This is very much a hack. Basically we sample along the path to get a
   * series of points to then do an inside/outside check later for mouse
   * presence
    * */
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
    return svgUtils.drawPath(path, opacity, color, outline)
  }

  setPathsToDrawByColor() {
    let chords = this.getChordsToDraw()
    let arcs = this.getArcsToDraw()

    this.pathsToDrawByColor = {}
    for (let [color, rawPath] of chords.concat(arcs)) {
      color = color.hex()
      if (this.pathsToDrawByColor[color] == undefined) {
        this.pathsToDrawByColor[color] = new Path2D()
      }

      this.pathsToDrawByColor[color].addPath(new Path2D(rawPath))
    }
  }

  draw() {
    for (let [color, path] of Object.entries(this.pathsToDrawByColor)) {
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
