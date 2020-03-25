import * as svgUtils from './svg_utils'

export class Text {
  constructor(value, x, y, font, rotation, align) {
    this.value = value
    this.x = x
    this.y = y
    this.font = font || '12px'
    this.rotation = rotation || 0
    this.align = align || 'left'
  }

  draw(context) {
    context.save()
    context.fillStyle = "black"
    context.font = this.font
    context.translate(this.x, this.y)
    context.rotate(this.rotation)
    context.textAlign = this.align
    context.textBaseline = 'middle'
    context.fillText(this.value, 0, 0)
    context.restore()
  }

  drawSVG() {
    // rotation is currently in radians, which isn't how it's expected to be
    // also currently doesn't deal with textAlign
    return svgUtils.drawText(this.value, x, y, this.font, this.rotation)
  }
}
