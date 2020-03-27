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

  getNodeAndTextObjects() {
    let objects = [this.titleText]

    for (let [text, value] of this.rawObjects) {
      const radius = this.sizeAttribute.getNumericalValue(value) * this.radius
      const color = this.colorAttribute.getColorValue(value)
      const outline = this.colorAttribute.coloror.constructor.defaultColor

      objects.push(new shapes.Text(text, this.textXCoordinate, this.YCoordinate))
      objects.push(new shapes.Circle(this.nodeXCoordinate, this.YCoordinate, radius, outline, color))
      this.stepYCoordinate()
    }

    return objects
  }

  get titleText() {
    let text = new shapes.Text(this.title, this.titleXCoordinate, this.YCoordinate)
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
  constructor(showLegend, sizeAttribute, colorAttribute, radius, xOffset, yOffset) {
    this.showLegend = showLegend
    this.sizeAttribute = sizeAttribute
    this.colorAttribute = colorAttribute
    this.radius = radius
    this.xOffset = xOffset
    this.yOffset = yOffset

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
      // we'll just show the color legend, and size the nodes
      this.showSizeLegend = false
    }
  }

  getObjectsToDraw() {
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
      objects = objects.concat(this.sizeLegend.getNodeAndTextObjects())
      verticalShift = this.sizeLegend.YCoordinate
    }

    if (this.showColorLegend) {
      this.colorLegend = new NodeLegend(
        'color',
        this.radius,
        this.colorAttribute,
        colorLegendSizeAttribute
      )

      let colorObjects = this.colorLegend.getNodeAndTextObjects()

      // move the legend down to account for the other legend
      colorObjects.forEach(object => object.y += verticalShift)

      objects = objects.concat(colorObjects)
    }

    objects.forEach(object => {
      object.x -= this.xOffset
      object.y -= this.yOffset
    })

    return objects
  }
}
