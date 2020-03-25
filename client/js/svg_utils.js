export function drawPathSVG(d, opacity, color, outline) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  path.setAttribute('d', d)
  path.setAttribute('fill', color)
  path.setAttribute('stroke', outline)
  path.setAttribute('fill-opacity', opacity)
  return path
}

export function drawCircleSVG(x, y, radius, outline, color) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  circle.setAttribute('cx', x)
  circle.setAttribute('cy', y)
  circle.setAttribute('r', radius)
  circle.setAttribute('fill', color)
  circle.setAttribute('stroke', color)
  return circle
}
