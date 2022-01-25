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
      "mousemove": event => this.mouseMoveEvent(),
    }
  }

  get handlers() {
    return {
      'redraw': settings =>  this.redraw(settings),
    }
  }

  get opacities() {
    return {
      'default': .8,
      'focus': 1,
      'fade': .5,
    }
  }

  initialize() {
    this.objectSettings = this.defineObjectSettings()

    this.chordPathFunction = d3.chord()
      .padAngle(this.objectSettings.padAngle)
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

    this.resetFocusState()
    this.exteriorAnnotationLabels = this.defineExteriorAnnotationLabels()
  }

  defineObjectSettings() {
    let objectSettings = {
      'radius': {},
    }

    const radiusFraction = this.controller.settings.chordDiagramRadiusFraction
    const ringDepth = this.controller.settings.chordDiagramRingDepth

    const smallerDimension = Math.min(this.controller.canvas.width, this.controller.canvas.height)
    const maxRadius = smallerDimension / 2

    objectSettings.radius.inner = maxRadius * radiusFraction
    objectSettings.radius.outer = (ringDepth * maxRadius) + objectSettings.radius.inner
    objectSettings.radius.outside = (ringDepth * maxRadius) + objectSettings.radius.outer

    objectSettings.padAngle = this.controller.settings.chordDiagramPadAngle
    
    return objectSettings
  }

  update() {
    this.clearDefaultStateVisualizationElements()
    console.log('maybe deleted default-case visualization data appropriately, but check')

    this.updateAttributeParameters()
    this.setVisualizationObjects()

    this.setNodesToDraw()
    this.setEdgesToDraw()
    this.setTexts()
    this.makeLegendElements()

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
    
    this.nodeSortMap = {}
    this.reverseNodeSortMap = {}
    let counter = 0
    sortedNodeIndices.forEach(index => {
      this.nodeSortMap[index] = counter
      this.reverseNodeSortMap[counter] = parseInt(index)

      counter += 1
    })

    let matrix = utils.zerosMatrix(sortedNodeIndices.length)
    for (let edge of this.layer.edges) {
      const source = this.nodeSortMap[edge.source]
      const target = this.nodeSortMap[edge.target]
      matrix[source][target] = edge.weight
    }

    matrix = this.sizeNodes(matrix)

    const chordsD3 = this.chordPathFunction(matrix) 
    this.groups = chordsD3.groups

    this.chords = []
    for (let [key, value] of Object.entries(chordsD3)) {
      if (key !== 'groups') {
        const chord = value

        const source = this.reverseNodeSortMap[chord.source.index]
        const target = this.reverseNodeSortMap[chord.target.index]

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
    const parameter = this.controller.collections['visualization'].attributeParameters.nodeColor
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

    const attribute = this.controller.collections['visualization'].attributeParameters.edgeColor.attribute

    for (let [i, chord] of Object.entries(this.chords)) {
      const metadata = this.edgeMetadata(chord)

      let valueToColor = undefined
      if (['weight', 'none'].includes(attribute.key)) {
        valueToColor = chord.source.value
      }
      else {
        valueToColor = metadata[attribute.key]
      }

      const color = attribute.getColorValue(valueToColor)
      const path = this.edgePathFunction(chord)

      let edge = new shapes.Path(path, color)
      edge.weight = metadata.weight

      this.edgesToDraw.push(edge)
    }
  }

  setTexts() {
    this.texts = []
    for (let [i, nodeToDraw] of Object.entries(this.nodesToDraw)) {
      const [x, y] = this.annotationsArc.centroid(this.getNodeArc(i))
      const rotate = -1 * Math.atan2(x, y) + (Math.PI / 2)

      let align = 'left'

      if (x < 0) {
        rotate += Math.PI
        align = 'right'
      }

      this.texts.push(
        new shapes.Text(
          this.layer.nodes[i].name,
          x,
          y,
          '8px',
          align,
          'black',
          rotate,
        )
      )
    }
  }

  edgeMetadata(chord) {
    const source = this.reverseNodeSortMap[chord.source.index]
    const target = this.reverseNodeSortMap[chord.target.index]

    if (this.layer.edgeMetadata[source] === undefined) {
      return this.layer.edgeMetadata[target][source]
    }
    else {
      return this.layer.edgeMetadata[source][target]
    }
  }

  /*
    * there's some fancy logic involved in mouse movement.
    * basically, for a chord diagram, we are often going to be showing one
    * particular state: the "no nodes/edges highlighted" state. This is also
    * the most expensive state to compute, as there are the most edges being
    * shown. 
    *
    * So, we are going to save the objects to draw for that visualization
    * state, and if we ever get into that state again, we just draw it
    * immediately, because we know what it looks like
    *
    * (for now we're not doing this, because of weird bugs)
  */
  mouseMoveEvent() {
    this.setFocusedElements()

    // if ((this.defaultState) && (this.defaultStateElements === undefined)) {
    //   this.controller.canvas.saveState = true
    // }
    // if ((this.defaultState) && (this.defaultStateElements !== undefined)) {
    //   this.controller.canvas.elementsToDrawByDrawProperties = this.defaultStateElements
    // }
    // else {
    //   this.updateFocusedElements()
    // }
    this.updateFocusedElements()

    this.controller.canvas.redraw()

    if (this.defaultState) {
      this.storeDefaultStateVisualizationElements()
    }
  }

  storeDefaultStateVisualizationElements() {
    this.defaultStateElements = this.controller.canvas.previousElementsToDrawByDrawProperties
  }

  clearDefaultStateVisualizationElements() {
    this.defaultStateElements = undefined
  }

  resetFocusState() {
    this.focalNode = undefined
    this.focalEdge = undefined
    this.nodeEdges = []
    this.hiddenEdges = []

    this.labeledNodes = []
  }

  /*
    * there are three cases for the mouse:
    * 1. outside ring
    * 2. on a node in the ring
    * 3. inside the ring
    *
    * breakdown for each case:
    * 1. mouse is outside the ring:
    *    - unhighlight everything
    *    - display all nodes and edges
    *
    * 2. mouse is on a node in the ring:
    *    - highlight the node
    *    - highlight edges from node
    *    - display tooltip for node
    *    - hide edges from other nodes
    *
    * 3. mouse is inside ring:
    *    - intersect with edge from node?
    *        - highlight edge
    *        - display tooltip for edge
  */
  setFocusedElements() {
    const nodes = []
    const edges = []

    const mX = this.mouseState.x
    const mY = this.mouseState.y

    const distanceFromOrigin = Math.sqrt((mX * mX) + (mY * mY))

    this.defaultState = false

    if (distanceFromOrigin > this.objectSettings.radius.outer) {
      // case: outside the ring
      //
      // action: 
      //  - unhighlight nodes and edges
      //  - show all edges
      this.resetFocusState()
      this.defaultState = true
    }
    else if ((distanceFromOrigin < this.objectSettings.radius.inner) && (this.focalNode !== undefined)) {
      // case: inside the ring
      //
      // action: 
      //  - reset edge highlights
      //  - if the cursor is over an edge, highlight the edge
      //    - if the endpoint of the edge is not the start, label that node too

      this.focalEdge = undefined
      this.labeledNodes = [this.focalNode]

      for (let i of this.nodeEdges) {
        if (this.controller.canvas.isPointInPath(this.edgesToDraw[i].path, mX, mY)) {
          this.focalEdge = i
        }
      }

      if (this.focalEdge !== undefined) {
        const focalChord = this.chords[this.focalEdge]

        // label the other end of the chord if it's not a self loop
        if (focalChord.target.index !== focalChord.source.index) {
          this.labeledNodes = [
            this.reverseNodeSortMap[focalChord.source.index],
            this.reverseNodeSortMap[focalChord.target.index],
          ]
        }
      }
    }
    else if (this.controller.canvas.isPointInPath(this.nodeCirclePath, mX, mY)) {
      // case: on the ring
      //
      // action: 
      //  - reset edge highlights
      //  - if the cursor is over an edge, highlight the edge
      //    - if the endpoint of the edge is not the start, label that node too

      this.resetFocusState()

      let pointsMouseIsIn = []
      for (let [i, node] of Object.entries(this.nodesToDraw)) {
        if (this.controller.canvas.isPointInPath(node.path, mX, mY)) {
          pointsMouseIsIn.push(i)
        }
      }

      // if the cursor is within one of the nodes, highlight that one
      if (pointsMouseIsIn.length) {
        this.focalNode = parseInt(pointsMouseIsIn[0])
      }
      else {
        const pointsByDistance = this.nodeToCentroidMap.map(
          (centroid, index) => [index, utils.distance(mX, mY, ...centroid)]
        ).sort(
          (a, b) => a[1] - b[1]
        ).map(
          ([index, distance]) => index
        )

        // otherwise, highlight the one whose centroid is nearest
        if (pointsByDistance.length) {
          this.focalNode = parseInt(pointsByDistance[0])
        }
      }

      if (this.focalNode !== undefined) {
        this.labeledNodes.push(this.focalNode)

        for (let [i, chord] of Object.entries(this.chords)) {
          const source = this.reverseNodeSortMap[chord.source.index]
          const target = this.reverseNodeSortMap[chord.target.index]

          if ((source === this.focalNode) || (target === this.focalNode)) {
            this.nodeEdges.push(i)
          }
          else {
            this.hiddenEdges.push(i)
          }
        }
      }
    }
  }

  refocusElements() {
    this.setFocusedElements()
    this.updateFocusedElements()
  }

  get edgeText() {
    const offset = 5
    const x = this.mouseState.x + offset
    const y = this.mouseState.y - offset

    const chord = this.chords[this.focalEdge]
    const metadata = this.edgeMetadata(chord)

    const string = metadata['mouseOverLabel'] !== undefined
      ? metadata['mouseOverLabel']
      : "edge weight: " + metadata['weight']

    const text = new shapes.Text(string, x, y)
    text.textAlign = 'left'
    text.textBaseline = 'bottom'

    return text
  }

  defineExteriorAnnotationLabels() {
    const annotationLabels = this.controller.settings.chordDiagramCircleAnnotationLabels

    let annotationTexts = []
    if (annotationLabels !== undefined) {
      Object.entries(annotationLabels).forEach(([angle, label]) => {
        angle = parseInt(angle)
        const radians = -1 * utils.degreeToRadians(angle)
        const x = this.objectSettings.radius.outside * Math.cos(radians)
        const y = this.objectSettings.radius.outside * Math.sin(radians)

        const text = new shapes.Text(label, x, y)

        if ([0, 180].includes(angle)) {
          text.textBaseline = 'middle'
          text.textAlign = angle === 0 ? 'left' : 'right'
        }
        else if ([90, 270].includes(angle)) {
          text.textAlign = 'center'
          text.textBaseline = angle === 90 ? 'top' : 'bottom'
        }

        annotationTexts.push(text)
      })
    }

    return annotationTexts
  }

  updateFocusedElements() {
    this.textsToDraw = []
    this.textsToDraw = this.labeledNodes.map(i => this.texts[i])

    if (this.controller.settings.showNodeNames) {
      this.textsToDraw = [...this.texts]
    }

    // node drawing
    const defaultNodeOpacity = this.focalNode === undefined
      ? this.opacities.default
      : this.opacities.fade

    this.nodesToDraw.forEach(node => node.opacity = defaultNodeOpacity)

    if (this.focalNode !== undefined) {
      this.nodesToDraw[this.focalNode].opacity = this.opacities.focus
    }

    // edge drawing
    const defaultEdgeOpacity = this.focalEdge === undefined
      ? this.opacities.default
      : this.opacities.fade

    this.edgesToDraw.forEach(edge => edge.opacity = defaultEdgeOpacity)

    for (let i of this.hiddenEdges) {
      this.edgesToDraw[i].opacity = 0
    }

    if (this.focalEdge !== undefined) {
      this.edgesToDraw[this.focalEdge].opacity = this.opacities.focus

      this.textsToDraw.push(this.edgeText)
    }

    this.edgesToDraw.forEach(edge => {
      edge.outline = edge.color

      edge.outline.opacity = edge.opacity

      if ((this.focalNode === undefined) && (this.edgesToDraw.length > 1000)) {
        if (edge.weight === 1) {
          edge.outline.opacity = edge.opacity * .5
        }
      }

      // edge.outline.opacity = edge.opacity
      // edge.outline = 
      // edge.outline = edge.outline.darker().hex()
    })


    if (this.exteriorAnnotationLabels.length) {
      this.textsToDraw = this.textsToDraw.concat(this.exteriorAnnotationLabels)
    }

    this.legendTexts.forEach(text => this.textsToDraw.push(text))
    this.legendNodes.forEach(node => this.textsToDraw.push(node))
  }

  ////////////////////////////////////////////////////////////////////////////////
  // legend stuff
  ////////////////////////////////////////////////////////////////////////////////
  /*
   * Parameters:
   *  - location: (x, y) values of 1 or -1, indicates quadrant on graph. e.g.,
   *   (-1, -1) is bottom left; (1, 1) is top right
   *  - colorBox: dict.
   *    - width: pixels. default: 25
   *    - hieght: pixels. default: 15
   *  - data: list of dicts. dicts should have the following keys:
   *    - value: color (0 to 1) to display
   *    - text: text to display
   *  - pad: dict.
   *    - x: pixels. default: 10
   *    - y: pixels. default: 10
  */
  makeLegendElements() {
    this.legendTexts = []
    this.legendNodes = []

    const edgeLegendSettings = this.controller.settings.chordDiagramEdgeLegend
    if (edgeLegendSettings === undefined) {
      return
    }

    let [xQuadrant, yQuadrant] = edgeLegendSettings.location === undefined
      ? [-1, -1]
      : edgeLegendSettings.location

    const writeBottomToTop = yQuadrant === -1
    const writeRightToLeft = xQuadrant === 1

    // invert the yQuadrant because we write things upside-down
    yQuadrant *= -1

    const legendXPad = edgeLegendSettings.pad.x === undefined ? edgeLegendSettings.pad.x : 10
    const legendYPad = edgeLegendSettings.pad.y === undefined ? edgeLegendSettings.pad.y : 10

    let xLocation = xQuadrant * (this.controller.canvas.width / 2)
    let yLocation = yQuadrant * (this.controller.canvas.height / 2)

    xLocation = xLocation < 0 ? xLocation + legendXPad : xLocation - legendXPad
    yLocation = yLocation < 0 ? yLocation + legendYPad : yLocation - legendYPad

    const colorBoxWidth = edgeLegendSettings.colorBox.width === undefined
      ? edgeLegendSettings.colorBox.width
      : 25

    const colorBoxHeight = edgeLegendSettings.colorBox.height === undefined
      ? edgeLegendSettings.colorBox.height
      : 15

    const attribute = this.controller.collections['visualization'].attributeParameters.edgeColor.attribute

    const data = edgeLegendSettings.data

    const colorBoxToTextPad = 5
    const legendItemVerticalPad = colorBoxHeight + 5

    let yCoordinate = yLocation

    const totalHeight = legendItemVerticalPad * data.length

    if (writeBottomToTop) {
      yCoordinate -= totalHeight
    }

    let colorBoxXCoordinate = xLocation
    let textXCoordinate = colorBoxXCoordinate + colorBoxWidth + colorBoxToTextPad
    let textAlign = 'left'

    if (writeRightToLeft) {
      colorBoxXCoordinate = xLocation - colorBoxWidth
      textXCoordinate = colorBoxXCoordinate - colorBoxToTextPad
      textAlign = 'right'
    }

    if (! writeBottomToTop) {
      data.reverse()
    }

    data.forEach(legendItem => {
      let color = attribute.getColorValue(legendItem['value'], false)

      let colorBox = new shapes.Rectangle(
        colorBoxXCoordinate,
        yCoordinate,
        colorBoxWidth,
        colorBoxHeight,
        this.opacities.default,
        color,
        color,
      )

      let text = new shapes.Text(
        legendItem.text,
        textXCoordinate,
        yCoordinate + (colorBoxHeight / 2),
      )

      text.textAlign = textAlign
      text.baseline = 'bottom'

      this.legendNodes.push(colorBox)
      this.legendTexts.push(text)

      yCoordinate += legendItemVerticalPad
    })
  }
}
