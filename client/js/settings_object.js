import * as d3 from 'd3'

export class SettingsObject {
  static get settingDefaults() {
    return {
      'example_key': 'example_value',
    }
  }

  static get scaleDefaults() { return {} }
  static get scales() { return [] }

  static get settingSynonyms() {
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

  static replaceAliases(settings) {
    // - convert aliases in the settings into their unaliased version
    // - take the keys in the settings 

    for (let [key, value] of Object.entries(settings)) {
      const synonym = this.settingSynonyms[key]

      if (synonym !== undefined) {
        const aliasKey = synonym.aliasOf
        const valueMap = synonym.valueMap

        if (valueMap !== undefined) {
          if (valueMap[value] !== undefined) {
            value = valueMap[value]
          }
        }

        settings[aliasKey] = value
        delete settings[key]
      }
    }

    return settings
  }

  // - takes in a set of settings
  // - applies defaults to them
  // - replaces setting aliases
  static getSettings(settings) {
    settings = JSON.parse(JSON.stringify(settings))
    settings = this.replaceAliases(settings)

    const constructedSettings = {}
    for (let [key, value] of Object.entries(this.settingDefaults)) {
      constructedSettings[key] = settings[key] !== undefined
        ? settings[key]
        : value
    }

    return constructedSettings
    // // apply the user settings to the scales.
    // Object.entries(this.scaleDefaults).forEach(([name, scale]) => {
    //   if (userScales !== undefined) {
    //     const userScale = userScales[name]

    //     if (userScale !== undefined) {
    //       const min = userScale['min']
    //       if (min !== undefined) {
    //         scale['min'] = min
    //       }

    //       const max = userScale['max']
    //       if (max !== undefined) {
    //         scale['max'] = max
    //       }
    //     }
    //   }

    //   this.settings['scales'][name] = scale
    // })
  }
}

export class WebwebSettings extends SettingsObject {
  static get settingDefaults() {
    return {
      "networkLayer": 0,
      'metadata' : {},
      'hideMenu' : false,
      'showLegend': true,
      'networkName' : undefined,
      'width': undefined,
      'height': undefined,
      'attachWebwebToElementWithId': undefined,
      'plotType': 'Force Directed',
    }
  }

  static get settingSynonyms() {
    return {
      'h' : { 'aliasOf': 'height', },
      'w': { 'aliasOf': 'width', },
    }
  }
}

export class AllSettings extends SettingsObject {
  static get settingDefaults() {
    return {
      // node settings
      'colorPalette' : undefined,
      'invertBinaryColors' : false,
      'invertBinarySizes' : false,
    }
  }

  static get scaleDefaults() {
    return {
      'nodeSize' : {
        'type': 'linear',
        'min': 0.5,
        'max': 1.5,
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
}
