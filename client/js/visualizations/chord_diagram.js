import { colorbrewer } from '../colors'
import {AbstractVisualization } from './abstract_visualization'

import * as d3 from 'd3'

export class ChordDiagramVisualization extends AbstractVisualization {
  init_circle() {
    this.chordFunction = d3.chord()
      .padAngle(0.05)
      // .sortSubgroups(d3.descending)

    this.matrix = this.layer.matrix
    this.chords = this.chordFunction(this.matrix)

    this.arc = d3.arc()
      .innerRadius(this.objectSettings.radius.inner)
      .outerRadius(this.objectSettings.radius.outer)

    this.ribbon = d3.ribbon()
      .radius(this.objectSettings.radius.inner)
  }

  outDegrees() {
    return this.matrix.forEach(row => row.reduce((a, b) => a + b, 0))
  }

  get scale() {

  }

  constructor(settings, nodes, canvas, layer) {
    super(settings, nodes, canvas, layer)

    // FIX SETTINGS
    this.objectSettings = {
      'radius': {
        'outer': 290,
        'inner': 270,
      },
    }

    this.init_circle()
    this.draw(this.canvas.mouseState)


    // const group = svg.append("g")
    //   .selectAll("g")
    //   .data(chords.groups)
    //   .join("g");

    // group.append("path")
    //   .attr("fill", d => color(d.index))
    //   .attr("stroke", d => d3.rgb(color(d.index)).darker())
    //   .attr("d", arc);

    // svg.append("g")
    //   .attr("fill-opacity", 0.67)
    //   .selectAll("path")
    //   .data(chords)
    //   .join("path")
    //     .attr("d", ribbon)
    //     .attr("fill", d => color(d.target.index))
    //     .attr("stroke", d => d3.rgb(color(d.target.index)).darker());
  }

  setUpCanvas(canvas) {
    canvas.context.save()
    canvas.context.translate(canvas.w / 2, canvas.h / 2)
    this.arc.context(canvas.context)
    this.ribbon.context(canvas.context)
  }

  draw(mouseState) {
    this.mouseState = mouseState

    // test:
    let extent = d3.extent([0, 1])
    let range = [.5, 1.5]
    let scale = d3.scaleLinear().domain(extent).range(range)

    // THIS IS FUCKED
    let chords = []
    for (let chord of chords) {
      const edgeRatio = this.convertEdgesToRatios(this.matrix, chord)
      const color = scale(edgeRatio)
      const chord = new Chord(chord, this.ribbon, color)
      chords.push(chord)
    }

    let arcs = []
    for (const [i, arc] of this.chords.entries()) {
      const color = this.nodes[i].__scaledColor
      const arc = new Arc(arc, this.arc, color)
      arcs.push(arc)
    }

    let objectsByColor = {}
    for (let object of chords.concat(arcs)) {
      let color = object.color
      if (objectsByColor[color] == undefined) {
        objectsByColor[color] = []
      }
      objectsByColor[color].push(object)
    }

    this.setUpCanvas(this.canvas)
    let context = this.canvas.context
    Object.entries(objectsByColor).forEach(([color, objects]) => {
      this.drawObjects(context, color, objects)
    }, this)
    context.restore()
  }

  convertEdgesToRatios(matrix, object){
    let source = object.source.index
    let target = object.target.index

    let value = matrix[source][target]
    let otherValue = matrix[target][source] | 1
    let min = value < otherValue ? value : otherValue
    let max = value > otherValue ? value : otherValue

    return min / max
  }

  drawObjects(context, fill, objects) {
    context.beginPath()
    context.fillStyle = fill
    context.strokeStyle = d3.rgb(fill).darker()
    context.globalAlpha = 0.67
    objects.forEach(object => object.pathFunction(object.object))
    context.stroke()
    context.fill()
  }

  getScaledColorValue(value, scale) {
    return 
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


class Chord  {
  constructor(object, pathFunction, color) {
    this.object = object
    this.pathFunction = pathFunction

    const interpolators = [
      // These are from d3-scale.
      "Viridis",
      "Inferno",
      "Magma",
      "Plasma",
      "Warm",
      "Cool",
      "Rainbow",
      "CubehelixDefault",
      // These are from d3-scale-chromatic
      "Blues",
      "Greens",
      "Greys",
      "Oranges",
      "Purples",
      "Reds",
      "BuGn",
      "BuPu",
      "GnBu",
      "OrRd",
      "PuBuGn",
      "PuBu",
      "PuRd",
      "RdPu",
      "YlGnBu",
      "YlGn",
      "YlOrBr",
      "YlOrRd"
    ];

    const scaleName = 'YlGn'
    this.color = d3['interpolate' + scaleName](color)
  }

  colorProperty() {
    return this.color
  }
}

class Arc  {
  constructor(object, pathFunction, color) {
    this.object = object
    this.color = color
    this.pathFunction = pathFunction
  }

  colorProperty() {
    return this.color
  }
}
