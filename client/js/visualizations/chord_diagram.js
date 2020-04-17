import { AbstractVisualization } from './abstract_visualization'
import { DivergingScalarAttribute } from '../attribute'
import { ChordDiagramSettings } from './chord_diagram/settings'
import { chordDiagramWidgets } from './chord_diagram/widgets'
import * as svgUtils from '../svg_utils'
import * as shapes from '../shapes'
import * as utils from '../utils'

import * as d3 from 'd3'

export class ChordDiagramVisualization extends AbstractVisualization {
  static get settingsObject() { return ChordDiagramSettings }
  
  get directed() { return false }
  get weighted() { return true }

  get opacities() {
    return {
      'default': .5,
      'focus': .7,
      'fade': .3,
    }
  }

  get widgets() { return chordDiagramWidgets() }

  get handlers() {
    return {
      'redraw': settings =>  this.redraw(settings),
    }
  }

  get listeners() {
    return {
      "mousemove": event => {
        this.setFocusedElements()
        this.fancyNodeDetection()
        this.updateFocusedElements()
        this.canvas.redraw()
      },
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

    this.resetFocusedElements()

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

    this.edgeRatios = this.layer.edges.map(
      link => this.convertEdgesToRatios(link.source, link.target, this.layer.matrix)
    )

    this.availableAttributes = {
      'edgeColor': new DivergingScalarAttribute('edgeRatio', this.edgeRatios),
    }

    this.update()
  }

  update() {
    this.setActiveAttributes()
    this.setVisualizationObjects()

    this.setNodesToDraw()
    this.setEdgesToDraw()
    this.setTexts()
    this.updateFocusedElements()
  }

  /* fancy arc detection! 
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
  fancyNodeDetection() {
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
        if (this.focusedElements.nodes.length === 0) {
          this.focusedElements.nodes.push(pointsByDistance[0])
        }
      }
    }
    console.log('edge attributes!')
  }

  setVisualizationObjects() {
    const sortAttribute = this.settings.sortNodesBy == 'out degree' ? 'outDegrees' : 'inDegrees'

    let elementsBySortAttribute = Object.entries(
      this.layer[sortAttribute](this.layer.matrix)
    ).sort((a, b) => a[1] - b[1])

    let matrix = []
    this.nodeSortMap = []
    let counter = 0
    for (let [i, v] of elementsBySortAttribute) {
      matrix.push(this.layer.matrix[i])
      this.nodeSortMap[i] = counter
      counter += 1
    }

    const chordsD3 = this.chordPathFunction(matrix) 
    this.groups = chordsD3.groups

    this.chords = []
    for (let [key, value] of Object.entries(chordsD3)) {
      if (key !== 'groups') {
        this.chords.push(value)
      }
    }

    // we're going to do something maybe weird:
    // - split the adjacency matrix into three:
    // 1. self loops
    // 2. up the sort
    // 3. down the sort

    const selfLoops = this.layer.edges.filter(edge => edge.isSelfLoop)
    const downwardEdges = []
    const upwardEdges = []
    this.layer.edges.filter(edge => ! edge.isSelfLoop).forEach(edge => {
      const sourceIndex = this.nodeSortMap[edge.source]
      const targetIndex = this.nodeSortMap[edge.target]

      sourceIndex < targetIndex ? downwardEdges.push(edge) : upwardEdges.push(edge)
    })

    // console.log(this.layer.edges.length)
    // console.log(selfLoops.length + upwardEdges.length + downwardEdges.length)

    this.edgeSortMap = new Array(this.layer.edges.length).fill(-1)
    // this.layer.edges.forEach((edge, i) => {
    //   const edgeNodeSet = new Set(edge.nodes)
    //   // let source = link.source
    //   // let target = link.target

    //   for (let [j, chord] of Object.entries(this.chords)) {
    //     if (edgeNodeSet.has(chord.source.index) && edgeNodeSet.has(chord.target.index)) {
    //       this.edgeSortMap[i] = j
    //       break
    //     }
    //   }
    // })

    // this.layer.edges.forEach(e => console.log(e.source + ' ' + e.target))
    // console.log('HELLOJK\n')
    // this.chords.forEach(e => console.log(e.source.index + ' ' + e.target.index))
  }

  /*
    * because we sort and do fancy things, there's not a correspondence between
    * index and arc. it's a d3 bullshit thing. */
  getNodeArc(index) {
    return this.groups[this.nodeSortMap[index]]
  }

  getEdgeChord(index) {
    return this.chords[this.edgeSortMap[index]]
  }

  convertEdgesToRatios(source, target, matrix){
    let outWeight = matrix[source][target]
    let inWeight = matrix[target][source] || 1

    return outWeight / inWeight
  }

  setNodesToDraw() {
    this.nodesToDraw = []
    this.nodeToCentroidMap = []
    for (let [i, node] of Object.entries(this.layer.nodes)) {
      const color = this.attributes.nodeColor.getColorValue(this.attributeValues.nodeColor[i])
      const nodeArc = this.getNodeArc(i)
      const path = this.nodeArc(nodeArc)
      this.nodesToDraw.push(new shapes.Path(path, color))
      this.nodeToCentroidMap.push(this.nodeArc.centroid(nodeArc))
    }
  }

  setEdgesToDraw() {
    this.edgesToDraw = []
    // console.log(this.layer.edges)
    // console.log(this.edgeRatios)
    // console.log(this.edgeSortMap)
    console.log('bullshit aint working')

    // console.log(this.layer.edges.length)
    // console.log(this.layer.undirectedEdges.length)
    // console.log(this.chords.length)
    for (let [i, chord] of Object.entries(this.chords)) {
    // for (let [i, link] of Object.entries(this.layer.edges)) {
      const color = this.attributes.edgeColor.getColorValue(this.edgeRatios[i])
      // const path = this.edgePathFunction(this.getEdgeChord(i))
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
    * */
  setFocusedElements() {
    this.resetFocusedElements()

    this.groups.forEach((group, i) => {
      if (this.canvas.isPointInPath(this.nodesToDraw[i].path, this.mouseState.x, this.mouseState.y)) {
        this.focusedElements.nodes.push(i)
        for (let [j, chord] of Object.entries(this.chords)) {
          if (chord.source.index === i || chord.target.index === i) {
            this.focusedElements.edges.push(j)
          }
        }
      }
    })

    this.chords.forEach((chord, i) => {
      if (this.canvas.isPointInPath(this.edgesToDraw[i].path, this.mouseState.x, this.mouseState.y)) {
        this.focusedElements.edges.push(i)
        this.focusedElements.nodes.push(chord.source.index)

        if (chord.target.index !== chord.source.index) {
          this.focusedElements.nodes.push(chord.target.index)
        }
      }
    })
  }

  resetFocusedElements() {
    this.focusedElements = {
      'nodes': [],
      'edges': [],
    }
  }

  updateFocusedElements() {
    this.textsToDraw = this.focusedElements.nodes.map(i => this.texts[i])

    const defaultOpacity = this.focusedElements.nodes.length > 0 || this.focusedElements.edges.length > 0
      ? this.opacities.fade
      : this.opacities.default

    this.nodesToDraw.forEach(node => node.opacity = defaultOpacity)
    this.edgesToDraw.forEach(edge => edge.opacity = defaultOpacity)

    this.focusedElements.edges.forEach(i => this.edgesToDraw[i].opacity = this.opacities.focus)
    this.focusedElements.nodes.forEach(i => this.nodesToDraw[i].opacity = this.opacities.focus)
  }
}
