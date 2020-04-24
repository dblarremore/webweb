import { AbstractVisualization } from './abstract_visualization'
import { DivergingScalarAttribute } from '../attribute'
import { ChordDiagramParameters } from '../parameters'
import * as shapes from '../shapes'
import * as utils from '../utils'

import * as d3 from 'd3'

export class ChordDiagramVisualization extends AbstractVisualization {
  get ParameterDefinitions() { return ChordDiagramParameters }
  
  get directed() { return false }
  get weighted() { return true }

  get listeners() {
    return {
      "mousemove": event => {
        this.refocusElements()
        this.canvas.redraw()
      },
    }
  }

  get handlers() {
    return {
      'redraw': settings =>  this.redraw(settings),
    }
  }

  get opacities() {
    return {
      'default': .5,
      'focus': .7,
      'fade': .3,
    }
  }

  initialize() {
    // FIX SETTINGS
    this.objectSettings = {
      'radius': {
        'outside': 290,
        'outer': 270,
        'inner': 250,
      },
    }

    this.chordPathFunction = d3.chord()
      .padAngle(0.03)
      .sortSubgroups(d3.descending)

    this.nodeArc = d3.arc()
      .innerRadius(this.objectSettings.radius.inner)
      .outerRadius(this.objectSettings.radius.outer)
      
    this.nodeCirclePath = new Path2D(d3.arc()
      .innerRadius(this.objectSettings.radius.inner)
      .outerRadius(this.objectSettings.radius.outer)
      .startAngle(0)
      .endAngle(2 * Math.PI)())

    this.annotationsArc = d3.arc()
      .innerRadius(this.objectSettings.radius.outer)
      .outerRadius(this.objectSettings.radius.outside)
      
    this.edgePathFunction = d3.ribbon()
      .radius(this.objectSettings.radius.inner)
  }

  update() {
    this.updateAttributeParameters(this.layer.nodes, this.layer.matrix, this.layer.edges)
    this.setVisualizationObjects()

    this.setNodesToDraw()
    this.setEdgesToDraw()
    this.setTexts()
    this.refocusElements()
  }

  sortNodes() {
    const parameter = this.attributes.nodeSort
    
    let sortedNodeIndices = []
    if (parameter.key === 'none') {
      sortedNodeIndices = Object.keys(this.layer.nodes)
    }
    else {
      sortedNodeIndices = Object.entries(parameter.values).sort(
        (a, b) => a[1] - b[1]
      ).map(([index, value]) => index)
    }

    if (parameter.attribute.scaleFlip) {
      sortedNodeIndices = sortedNodeIndices.reverse()
    }

    return sortedNodeIndices
  }

  sizeNodes(matrix) {
    const parameter = this.attributes.nodeSize
    if (parameter.key === 'none') {
      return matrix
    }

    Object.entries(matrix).forEach(([i, row]) => {
      const nodeValue = parameter.values[this.reverseNodeSortMap[i]]
      if (nodeValue !== 0) {
        const valuesSum = row.reduce((a, b) => a + b, 0)
        matrix[i] = row.map(element => (element / valuesSum) * nodeValue)
      }
      else {
        matrix[i] = new Array(row.length).fill(0)
      }
    })
    return matrix
  }

  setVisualizationObjects() {
    const sortedNodeIndices = this.sortNodes()

    let matrix = []
    this.nodeSortMap = {}
    this.reverseNodeSortMap = {}
    let counter = 0
    sortedNodeIndices.forEach(index => {
      matrix.push(this.layer.matrix[index].map(x => x))
      this.nodeSortMap[index] = counter
      this.reverseNodeSortMap[counter] = parseInt(index)
      counter += 1
    })

    matrix = this.sizeNodes(matrix)

    const chordsD3 = this.chordPathFunction(matrix) 
    this.groups = chordsD3.groups

    this.chords = []
    for (let [key, value] of Object.entries(chordsD3)) {
      if (key !== 'groups') {
        const chord = value
        const source = this.reverseNodeSortMap[chord.source.index]
        const target = this.reverseNodeSortMap[chord.source.subindex]

        chord.source.index = source
        chord.target.index = target
        chord.source.subindex = target
        chord.target.subindex = source
        chord.source.value = this.layer.matrix[source][target]
        chord.target.value = this.layer.matrix[target][source]

        this.chords.push(chord)
      }
    }
  }

  /*
    * because we sort and do fancy things, there's not a correspondence between
    * index and arc. it's a d3 bullshit thing. */
  getNodeArc(index) {
    return this.groups[this.nodeSortMap[index]]
  }

  convertEdgesToRatios(source, target, matrix){
    let outWeight = matrix[source][target]
    let inWeight = matrix[target][source] || 1

    return outWeight / inWeight
  }

  getNodeColor(index) {
    const parameter = this.settingsHandler.attributeParameters.nodeColor
    return parameter.attribute.getColorValue(parameter.values[index])
  }

  setNodesToDraw() {
    this.nodesToDraw = []
    this.nodeToCentroidMap = []
    for (let [i, node] of Object.entries(this.layer.nodes)) {
      const color = this.getNodeColor(i)
      const nodeArc = this.getNodeArc(i)
      const path = this.nodeArc(nodeArc)
      this.nodesToDraw.push(new shapes.Path(path, color))
      this.nodeToCentroidMap.push(this.nodeArc.centroid(nodeArc))
    }
  }

  setEdgesToDraw() {
    this.edgesToDraw = []
    for (let [i, chord] of Object.entries(this.chords)) {
      const color = this.settingsHandler.attributeParameters.edgeColor.attribute.getColorValue(
        chord.source.value
      )
      const path = this.edgePathFunction(chord)
      this.edgesToDraw.push(new shapes.Path(path, color))
    }
  }

  setTexts() {
    this.texts = []
    for (let [i, nodeToDraw] of Object.entries(this.nodesToDraw)) {
      const [x, y] = this.annotationsArc.centroid(this.getNodeArc(i))
      this.texts.push(new shapes.Text(this.layer.nodes[i].name, x, y))
    }
  }

  /*
   * If the mouse is in a node, highlight:
   * - the node's arc 
   * - the edges it is involved in
   *
   * If the mouse is in an edge, highlight:
   * - the edge's chord
   * - the nodes it connects
   *
   * the problem:
   * - zero width nodes can't be higlighted
   *
   * the solution: 
   * - make a circular area that covers all of the chord diagram node area
   * - store the node centroids
   * - when the mouse moves, check if it is in the circle
   *   - if not, no highlight at all
   *   - if so, highlight the node of the nearest centroid
    * */
  getFocusedElements() {
    const nodes = []
    const edges = []

    const mX = this.mouseState.x
    const mY = this.mouseState.y

    if (this.canvas.isPointInPath(this.nodeCirclePath, mX, mY)) {
      const pointsByDistance = this.nodeToCentroidMap.map(
        (centroid, index) => [index, utils.distance(mX, mY, ...centroid)]
      ).sort(
        (a, b) => a[1] - b[1]
      ).map(
        ([index, distance]) => index
      )

      if (pointsByDistance.length) {
        // we'll check the two nearest points
        let point = pointsByDistance[0]
        if (pointsByDistance.length > 2) {
          const secondNearestPoint = pointsByDistance[1]
          if (this.canvas.isPointInPath(this.nodesToDraw[secondNearestPoint].path, mX, mY)) {
            point = secondNearestPoint
          }
        }

        nodes.push(point)
        for (let [j, chord] of Object.entries(this.chords)) {
          if (chord.source.index === point || chord.target.index === point) {
            edges.push(j)
          }
        }
      }
    }

    this.chords.forEach((chord, i) => {
      if (this.canvas.isPointInPath(this.edgesToDraw[i].path, mX, mY)) {
        edges.push(i)
        nodes.push(chord.source.index)

        if (chord.target.index !== chord.source.index) {
          nodes.push(chord.target.index)
        }
      }
    })

    return [nodes, edges]
  }

  refocusElements() {
    const [nodes, edges] = this.getFocusedElements()
    this.updateFocusedElements(nodes, edges)
  }

  updateFocusedElements(nodes, edges) {
    this.textsToDraw = nodes.map(i => this.texts[i])

    const defaultOpacity = nodes.length > 0 || edges.length > 0
      ? this.opacities.fade
      : this.opacities.default

    this.nodesToDraw.forEach(node => node.opacity = defaultOpacity)
    this.edgesToDraw.forEach(edge => edge.opacity = defaultOpacity)

    edges.forEach(i => this.edgesToDraw[i].opacity = this.opacities.focus)
    nodes.forEach(i => this.nodesToDraw[i].opacity = this.opacities.focus)
  }
}
