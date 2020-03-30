import { SettingsObject } from '../settings_object'

describe("settings object", () => {
  it("tests that keys without values are defaulted", () => {
    let settings = SettingsObject.getSettings({})
    expect(settings).toStrictEqual({
      'exampleKey': 'exampleValue'
    })
  })

  it("tests that keys with values are not defaulted", () => {
    let settings = {
      'exampleKey': 'exampleValue'
    }
    let _settings = SettingsObject.getSettings(settings)
    expect(_settings).toStrictEqual(settings)
  })

  it("tests that aliases with values are properly handled", () => {
    let settings = {
      'exampleKeyAlias': 'exampleValue',
    }
    let _settings = SettingsObject.getSettings(settings)
    expect(_settings).toStrictEqual({
      'exampleKey': false,
    })
  })
})
