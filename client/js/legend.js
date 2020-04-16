import * as shapes from './shapes'
import { NoneAttribute } from './attribute'

export class NodeLegend {
  get JUSTIFY_UNIT() { return 5 }
  get MARGIN_TOP() { return 3 * this.JUSTIFY_UNIT }

  constructor(legendType, radius, colorAttribute, sizeAttribute) {
    this.radius = radius
    this.colorAttribute = colorAttribute
    this.sizeAttribute = sizeAttribute

    const legendAttribute = legendType === 'size' ? sizeAttribute : colorAttribute
    this.title = legendAttribute.key
    this.rawObjects = legendAttribute.getLegendNodes(legendAttribute.values)

    this.radiusMultiplier = Math.max(...this.sizeAttribute.scale.range())
    this.Radius = this.radius * this.radiusMultiplier
    this.YCoordinate = this.MARGIN_TOP
  }

  get nodeXCoordinate() { return Math.max(this.Radius, this.JUSTIFY_UNIT) + this.JUSTIFY_UNIT }
  get textXCoordinate() { return 2 * this.nodeXCoordinate }
  get titleXCoordinate() { return this.JUSTIFY_UNIT }
  stepYCoordinate() { this.YCoordinate += 2.3 * Math.max(this.Radius, 7.5) }

  get objectsToDraw() {
    let objects = [this.titleText]

    for (let [string, value] of this.rawObjects) {
      const radius = this.sizeAttribute.getNumericalValue(value) * this.radius
      const color = this.colorAttribute.getColorValue(value)
      const outline = this.colorAttribute.coloror.constructor.defaultColor

      let text = new shapes.Text(string, this.textXCoordinate, this.YCoordinate)
      text.textAlign = 'left'
      text.textBaseline = 'middle'
      objects.push(text)
      objects.push(new shapes.Circle(this.nodeXCoordinate, this.YCoordinate, radius, outline, color))
      this.stepYCoordinate()
    }

    return objects
  }

  get titleText() {
    let text = new shapes.Text(this.title, this.titleXCoordinate, this.YCoordinate)
    text.textAlign = 'left'
    text.textBaseline = 'middle'
    this.YCoordinate += (3 * this.JUSTIFY_UNIT) + this.Radius
    return text
  }
}

////////////////////////////////////////////////////////////////////////////////
// draw legend(s) for size and color
// 
// If size and color are tied to the same attribute, make one legend
// Otherwise, keep em separate
//
// prefer integer boundaries in our legends... but only if the values that are
// getting passed in are integers... etc. (etc... etc...)
//
// steps through what we think of as standard human preference.
////////////////////////////////////////////////////////////////////////////////
export class Legend {
  constructor(showLegend, radius, sizeAttribute, colorAttribute, canvas) {
    this.showLegend = showLegend
    this.radius = radius
    this.sizeAttribute = sizeAttribute
    this.colorAttribute = colorAttribute
    this.canvas = canvas

    this.showSizeLegend = this.sizeAttribute.hasLegend
    this.showColorLegend = this.colorAttribute.hasLegend

    if (! this.showLegend) {
      return
    }
    else if (! this.showSizeLegend && ! this.showColorLegend) {
      return
    }

    this.sameColorAndSizeAttributes = this.sizeAttribute.key === this.colorAttribute.key

    if (this.sameColorAndSizeAttributes) {
      this.showSizeLegend = false
    }
  }

  get objectsToDraw() {
    if (! this.showLegend) {
      return []
    }

    let verticalShift = 0
    const colorLegendSizeAttribute = this.sameColorAndSizeAttributes
      ? this.sizeAttribute
      : new NoneAttribute()

    let objects = []
    if (this.showSizeLegend) {
      this.sizeLegend = new NodeLegend('size', this.radius, new NoneAttribute(), this.sizeAttribute)
      objects = objects.concat(this.sizeLegend.objectsToDraw)
      verticalShift = this.sizeLegend.YCoordinate
    }

    if (this.showColorLegend) {
      this.colorLegend = new NodeLegend(
        'color',
        this.radius,
        this.colorAttribute,
        colorLegendSizeAttribute
      )

      let colorObjects = this.colorLegend.objectsToDraw

      // move the legend down to account for the other legend
      colorObjects.forEach(object => object.translate(0, verticalShift))

      objects = objects.concat(colorObjects)
    }

    objects.forEach(object => object.translate(-1 * this.canvas.xTranslate, -1 * this.canvas.yTranslate))

    return objects
  }
}
