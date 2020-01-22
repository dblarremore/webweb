import { SettingsObject } from './settings_object'
import * as d3 from 'd3';

export class AllSettings extends SettingsObject {
  get settingDefaults() {
    return {
      // node settings
      'c' : 60,
      'r' : 5,
      'colorPalette' : 'Set1',
      'invertBinaryColors' : false,
      'invertBinarySizes' : false,
      'g' : 0.1,
      // link settings
      'linkStrength' : 1,
      'l' : 20,
      'scaleLinkWidth' : false,
      'scaleLinkOpacity' : false,
      // network settings
      "networkLayer": 0,
      "sizeBy": "none",
      "colorBy": "none",
      // top level settings
      'metadata' : {},
      'nameToMatch' : "",
      'freezeNodeMovement' : false,
      'hideMenu' : false,
      'showLegend': true,
      'showNodeNames': false,
      'networkName' : undefined,
      'w': undefined,
      'h': undefined,
      'attachWebwebToElementWithId': undefined,
    }
  }

  get scaleDefaults() {
    return {
      'nodeSize' : {
        'type': 'linear',
        'min': 0.5,
        'max': 1.5,
      },
      'scalarColors': {
        'type': 'linear',
        'min': 0,
        'max': 1,
      },
      'categoricalColors': {
        'type': 'ordinal',
      },
      'linkWidth' : {
        'min': 1,
        'max': 1,
        'type': 'linear',
      },
      'linkOpacity' : {
        'min': 0.4,
        'max': 0.9,
        'type': 'linear',
      },
    }
  }

  get settingSynonyms() {
    return {
      'gravity' : {
        'aliasOf': 'g',
      },
      'height' : {
        'aliasOf': 'h',
      },
      'width': {
        'aliasOf': 'w',
      },
      'linkLength': {
        'aliasOf': 'l',
      },
      'charge': {
        'aliasOf': 'c',
      },
      'radius': {
        'aliasOf': 'r',
      },
    }
  }

  getScale(name, items) {
    let scaleSettings = this.settings['scales'][name]

    let scale;
    if (scaleSettings['type'] == 'linear'){
      scale = d3.scaleLinear()
    }
    else if (scaleSettings['type'] == 'ordinal') {
      scale = d3.scaleOrdinal()
    }

    scale.domain(d3.extent(items)).range([scaleSettings['min'], scaleSettings['max']])
    return scale
  }
}
