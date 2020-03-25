export function drawLine(x1, y1, x2, y2, strokeColor, strokeOpacity, strokeWidth) {
  const link = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  link.setAttribute('x1', x1)
  link.setAttribute('y1', y1)
  link.setAttribute('x2', x2)
  link.setAttribute('y2', y2)
  link.setAttribute('stroke', strokeColor)
  link.setAttribute('stroke-opacity', strokeOpacity)
  link.setAttribute('stroke-width', strokeWidth)

  return link
}

export function drawCircle(x, y, radius, outline, color) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  circle.setAttribute('cx', x)
  circle.setAttribute('cy', y)
  circle.setAttribute('r', radius)
  circle.setAttribute('fill', color)
  circle.setAttribute('stroke', color)
  return circle
}

export function drawText(value, x, y, fontSize, rotation) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.textContent = value
  text.setAttribute('x', x)
  text.setAttribute('y', y)
  text.setAttribute('fill', 'black')
  text.setAttribute('font-size', fontSize)

  if (rotation !== undefined) {
    text.setAttribute("transform", "rotate(" + rotation + ")")
  }

  return text
}
export function drawPath(d, opacity, color, outline) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  path.setAttribute('d', d)
  path.setAttribute('fill', color)
  path.setAttribute('stroke', outline)
  path.setAttribute('fill-opacity', opacity)
  return path
}
