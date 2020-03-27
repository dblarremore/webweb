import * as d3 from 'd3'

export class Simulation {
  constructor(nodes, settings) {
    this.settings = settings
    this.nodes = nodes
    this.isFrozen = false

    this.simulation = d3.forceSimulation(this.nodes)
    this.simulation.alphaDecay = 0.001
  }

  get forces() {
    return {
      "center" : () => {
        return d3.forceCenter(0)
      },
      "gravity-x" : () => {
        return d3.forceX(0).strength(this.settings.gravity)
      },
      "gravity-y" : () => {
        return d3.forceY(0).strength(this.settings.gravity)
      },
      "charge" : () => {
        return d3.forceManyBody().strength(-this.settings.charge)
      },
      "link" : () => {
        return d3.forceLink()
          .links(this.links)
          .distance(this.settings.linkLength)
          .strength(this.settings.linkStrength)
      },
    }
  }

  get isStable() {
    return this.simulation.alpha() < .05 || this.isFrozen
  }

  update(settings) { 
    if (this.settings !== undefined) {
      this.settings = settings
    }
    let forcesToUpdate = Object.keys(this.forces)

    for (let [forceName, forceFunction] of Object.entries(this.forces)) {
      try {
        this.simulation.force(forceName, forceFunction.call(this))
      } catch(error) {
        continue
      }
    }

    this.simulation.alpha(1).restart()
  }

  freeze() {
    this.simulation.stop()
    this.isFrozen = true
    this.nodes.forEach(node => {
      node.fx = node.x
      node.fy = node.y
    })
  }

  unfreeze() {
    this.isFrozen = false
    this.nodes.forEach(node => {
      node.fx = undefined
      node.fy = undefined
    })

    this.simulation.restart()
  }
}
