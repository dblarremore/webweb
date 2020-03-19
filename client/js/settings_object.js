import * as d3 from 'd3';

export class SettingsObject {
  get scales() {
    return {}
  }

  get settingDefaults() {
    return {
      'example_key': 'example_value',
    }
  }

  get scaleDefaults() {
    return undefined
  }

  get settingSynonyms() {
    return {
      'example_key_alias': {
        'aliasOf': 'example_key',
        'valueMap': {
          'example_value': false,
          'false_example_value': true,
        }
      }
    }
  }

  // - takes in a set of settings
  // - applies defaults to them
  // - replaces setting aliases
  constructor(settings) {
    settings = JSON.parse(JSON.stringify(settings))
    this.settings = {}

    // the idea is this:
    // - convert aliases in the settings into their unaliased version
    // - take the keys in the settings 

    // replace aliases
    for (let [key, value] of Object.entries(settings)) {
      const synonymInfo = this.settingSynonyms[key];

      if (synonymInfo !== undefined) {
        const aliasKey = synonymInfo.aliasOf
        const valueMap = synonymInfo.valueMap

        if (valueMap !== undefined) {
          if (valueMap[value] !== undefined) {
            value = valueMap[value];
          }
        }

        settings[aliasKey] = value
        delete settings[key]
      }
    }

    // apply the user settings to the settings.
    Object.entries(this.settingDefaults).forEach(([key, value]) => {
      this.settings[key] = settings[key] !== undefined
        ? settings[key]
        : value
    })

    this.settings['scales'] = {}
    const userScales = settings['scales']

    // apply the user settings to the scales.
    Object.entries(this.scaleDefaults).forEach(([name, scale]) => {
      if (userScales !== undefined) {
        const userScale = userScales[name]

        if (userScale !== undefined) {
          const min = userScale['min']
          if (min !== undefined) {
            scale['min'] = min
          }

          const max = userScale['max']
          if (max !== undefined) {
            scale['max'] = max
          }
        }
      }

      this.settings['scales'][name] = scale
    })
  }
}

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
      'plotType': 'ForceDirected',
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
