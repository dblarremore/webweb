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

    // // apply the user settings to the scales.
    if (this.scaleDefaults !== undefined) {
      this.settings['scales'] = {}

      Object.entries(this.scaleDefaults).forEach(([name, scale]) => {
        let userScales = settings['scales'];

        if (userScales !== undefined) {
          let userScale = userScales[name]

          if (userScale !== undefined) {
            let min = userScale['min']
            if (min !== undefined) {
              scale['min'] = min
            }

            let max = userScale['max']
            if (max !== undefined) {
              scale['max'] = max
            }
          }
        }

        this.settings['scales'][name] = scale
      })
    }
  }
}
