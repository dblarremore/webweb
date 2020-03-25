import { SettingsObject } from '../settings_object'

describe("settings object", () => {
  it("tests that keys without values are defaulted", () => {
    let settings = SettingsObject.getSettings({})
    expect(settings).toStrictEqual({
      'example_key': 'example_value'
    })
  })

  it("tests that keys with values are not defaulted", () => {
    let settings = {
      'example_key': 'test_value',
    }
    let _settings = SettingsObject.getSettings(settings)
    expect(_settings).toStrictEqual(settings)
  })

  it("tests that aliases with values are properly handled", () => {
    let settings = {
      'example_key_alias': 'example_value',
    }
    let _settings = SettingsObject.getSettings(settings)
    expect(_settings).toStrictEqual({
      'example_key': false,
    })
  })
})
