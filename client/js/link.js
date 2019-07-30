import * as d3 from 'd3';

export class Link {
  constructor(source, target, weight) {
    this.source = source
    this.target = target
    this.w = weight
    this.strokeStyle = d3.rgb(150, 150, 150)
  }

  set settings(settinsg) {
    this.settings = settings
  }

  get width() {
    return this.w == 0 ? 0 : this.settings.getScale('linkWidth')(this.w)
  }

  get opacity() {
      return this.settings.getScale('linkOpacity')(this.w)
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = this.opacity()
    ctx.beginPath()
    ctx.moveTo(this.source.x, this.source.y)
    ctx.lineTo(this.target.x, this.target.y)
    ctx.lineWidth = this.width()
    ctx.strokeStyle = this.strokeStyle
    ctx.stroke()
    ctx.restore()
  }

  drawSVG() {
    let link = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    link.setAttributeNS(null, 'x1', this.target.x)
    link.setAttributeNS(null, 'y1', this.target.y)
    link.setAttributeNS(null, 'x2', this.source.x)
    link.setAttributeNS(null, 'y2', this.source.y)
    link.setAttributeNS(null, 'style', 'stroke: ' + this.strokeStyle + '; stroke-opacity: ' + this.opacity() + ';' + 'stroke-width: ' + this.width() + ';' )

    return link
  }
}
