import { SettingsHandler, AttributeSettingGroup, Parameter } from '../settings_handler'
import * as parameters from '../parameters'
import { Widget } from '../widget'

describe("SettingsHandler", () => {
  it("tests that ", () => {
    const definitions = {
      'parameters': {
        'testKey': { "default": 'testDefault' },
      }
    }
    const rawSettings = {}

    const handler = new SettingsHandler(definitions, rawSettings)

    const actual = handler.settings
    const expected = {
      'testKey': 'testDefault',
    }
    expect(actual).toStrictEqual(expected)

  })
})

describe("AttributeSettingGroup", () => {
  it("tests isType, success", () => {
    const object = new Object()
    object.Attribute = true
    const actual = AttributeSettingGroup.isType(object)
    const expected = true
    expect(actual).toStrictEqual(expected)
  })

  it("tests isType, failure", () => {
    const object = new Object()
    const actual = AttributeSettingGroup.isType(object)
    const expected = false
    expect(actual).toStrictEqual(expected)
  })
})

describe("Parameter", () => {
  it("tests basic creation", () => {
    const parameter = new Parameter(
      "testKey",
      {
        "testKey": 5
      },
      {
        "default": 1,
        "defaultVisibility": true,
        "widgetClass": Widget,
      },
      {
        "default": 2,
      },
    )

    expect(parameter.key).toStrictEqual("testKey")
    expect(parameter.default).toStrictEqual(2)
  })
})
