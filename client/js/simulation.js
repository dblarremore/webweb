import * as d3 from 'd3'

export class Simulation {
  constructor(nodes, settings) {
    this.settings = settings
    this.nodes = nodes

    this.simulation = d3.forceSimulation(this.nodes)

    this.simulation.alphaDecay = 0.001

    this.forces = {
      "center" : () => {
        return d3.forceCenter(this.settings.w / 2, this.settings.h / 2)
      },
      "gravity-x" : () => {
        return d3.forceX(this.settings.w / 2).strength(this.settings.g)
      },
      "gravity-y" : () => {
        return d3.forceY(this.settings.h / 2).strength(this.settings.g)
      },
      "charge" : () => {
        return d3.forceManyBody().strength(-this.settings.c)
      },
      "link" : () => {
        return d3.forceLink()
          .links(this.links)
          .distance(this.settings.l)
          .strength(this.settings.linkStrength)
      },
    }
  }

  update(settings) { 
    if (this.settings !== undefined) {
      this.settings = settings
    }
    let forcesToUpdate = Object.keys(this.forces);

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
    for (let node of this.nodes) {
      node.fx = node.x
      node.fy = node.y
    }
  }

  unfreeze() {
    for (let node of this.nodes) {
      node.fx = undefined
      node.fy = undefined
    }
    this.update()
  }
}
