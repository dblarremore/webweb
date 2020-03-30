import * as d3 from 'd3'
import { CheckboxWidget, SelectWidget } from './widget'

export class SettingsObject {
  static get settingDefaults() {
    return {
      'exampleKey': 'exampleValue',
    }
  }

  static get scales() { return [] }

  static get attributes() {
    return {
      'exampleAttributeName': {
        'input': 'doExampleThingBy',
        'range': 'exampleAttributeScaleRange',
        'flip': 'flipExampleAttributeScaleRange',
        'colorPalette': 'exampleAttributeColorPalette',
        'on': 'exampleAttribute',
        'type': 'color', // or 'size', but size should really be numerical
        'from': 'layer', // or 'visualization'; later should do this better
      },
    }
  }

  static get settingSynonyms() {
    return {
      'exampleKeyAlias': {
        'aliasOf': 'exampleKey',
        'valueMap': {
          'exampleValue': false,
          'falseExampleValue': true,
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
