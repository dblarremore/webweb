import { SettingsHandler, AttributeParameterGroup, Parameter } from '../settings_handler'
import * as parameters from '../parameters'
import { Widget } from '../widget'

describe("SettingsHandler", () => {
  it("tests that basics work?", () => {
    const definitions = {
      'testKey': { "default": 'testDefault' },
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

describe("AttributeParameterGroup", () => {
  it("tests isType, success", () => {
    const object = new Object()
    object.Attribute = true
    const actual = AttributeParameterGroup.isType(object)
    const expected = true
    expect(actual).toStrictEqual(expected)
  })

  it("tests isType, failure", () => {
    const object = new Object()
    const actual = AttributeParameterGroup.isType(object)
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
    )

    expect(parameter.key).toStrictEqual("testKey")
    expect(parameter.default).toStrictEqual(1)
  })
})
