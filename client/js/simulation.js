import * as d3 from 'd3';

export class Simulation {
  constructor(nodes, settings) {
    this.settings = settings

    this.simulation = d3.forceSimulation(this.nodes)
      .on('tick', this.tick);

    this.simulation.alphaDecay = 0.001

    this.forces = {
      "center" : function () {
        return d3.forceCenter(this.settings.w / 2, this.settings.h / 2);
      },
      "charge" : function () {
        return d3.forceManyBody().strength(-this.settings.c);
      },
      "gravity-x" : function () {
        return d3.forceX(this.settings.w / 2).strength(this.settings.g);
      },
      "gravity-y" : function () {
        return d3.forceY(this.settings.h / 2).strength(this.settings.g);
      },
      "link" : function () {
        return d3.forceLink()
          .links(this.links)
          .distance(this.settings.l)
          .strength(this.settings.linkStrength);
      },
    }
  }

  update(force) { 
    let forcesToUpdate = Object.keys(this.forces);
    if (force && this.forces[force] !== undefined) {
      forcesToUpdate = [force]
    }

    for (let forceToUpdate of forcesToUpdate) {
        let updatedForce = this.forces[forceToUpdate].call(this)
        this.simulation.force(forceToUpdate, updatedForce)
    }
    this.simulation.alpha(1).restart()
  }

  tick () {
    if (this.canvasObject !== undefined) {
      this.canvasObject.redraw.call(this.canvasObject)
    }
  }
}
