import { controller } from './controller';

// import { Legend } from './legend';
// import { colorbrewer } from './colors';
// import { Blob } from 'blob-polyfill';
// import { saveAs } from 'file-saver';
// import * as d3 from 'd3';

class Webweb() {
  constructor (data) {
    const settings = data.settings

    // there are:
    // - links
    // - nodes
    // - networks
    // - a canvas
    // - a force
    // - menus
  }
}

function Webweb(wwdata) {
    this.networkNames = Object.keys(wwdata.networks);

    this.display = this.standardizeDisplayParameterSynonyms(wwdata.display);
    this.standardizeNetworks(wwdata.networks);

    this.createNodes();
    this.createSimulation();

    this.legendNodes = [];
    this.legendText = [];
}
