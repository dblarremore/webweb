export class Text {
  constructor(value, x, y, font) {
    this.value = value
    this.x = x
    this.y = y
    this.font = font
  }

  draw(ctx) {
    ctx.save()
    ctx.fillStyle = "black"
    ctx.font = this.font
    ctx.fillText(this.value, this.x, this.y)
    ctx.restore()
  }

  drawSVG() {
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.textContent = this.value
    text.setAttributeNS(null, 'x', this.x)
    text.setAttributeNS(null, 'y', this.y)
    text.setAttributeNS(null, 'style', 'fill: black; font-size: ' + this.font + ';' )
    return text
  }
}
