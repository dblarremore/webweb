// import { Attribute, NoneAttribute, ScalarAttribute, CategoricalAttribute } from '../attribute'
import * as attributes from '../attribute'
import * as d3 from 'd3'

describe("Attribute object", () => {
  const AttributeClass = attributes.Attribute
  const key = 'testKey'
  let nodes = {
    0: {},
    1: {},
    2: {},
  }
  nodes[0][key] = 1
  nodes[1][key] = 2
  nodes[2][key] = 3

  let values = [1, 2, 3]

  it("tests extent", () => {
    const attribute = new AttributeClass(key, nodes)
    expect(attribute.extent).toStrictEqual([1, 3])
  })

  it("tests construction when values is Array", () => {
    const attribute = new AttributeClass(key, values)
    expect(attribute.values).toStrictEqual([1, 2, 3])
  })

  it("tests construction when values is Object", () => {
    nodes = {
      'test': {},
      1: {}
    }
    nodes['test'][key] = 1
    nodes[1][key] = 2
    values = [1, 2]

    const attribute = new AttributeClass(key, nodes)
    expect(attribute.values).toStrictEqual(values)
  })
})

describe("NoneAttribute object", () => {
  const AttributeClass = attributes.NoneAttribute
  const key = 'testKey'
  let nodes = {
    0: {},
    1: {},
    2: {},
  }
  nodes[0][key] = 1
  nodes[1][key] = 2
  nodes[2][key] = 3

  it("doesn't die", () => {
    const attribute = new AttributeClass(key, nodes)
    expect(attribute.key).toStrictEqual(key)
  })

  it("returns properly for numericals", () => {
    const attribute = new AttributeClass(key, nodes)
    expect(attribute.getNumericalValue(2)).toStrictEqual(1)
  })

  it("returns properly for colors", () => {
    const attribute = new AttributeClass(key, nodes)
    expect(attribute.getColorValue(2)).toStrictEqual(d3.rgb(128, 128, 128))
  })
})

describe("BinaryAttribute object", () => {
  const AttributeClass = attributes.BinaryAttribute
  it("isType: true", () => {
    expect(AttributeClass.isType([true, 'false', 0])).toStrictEqual(true)
  })

  it("isType: false", () => {
    expect(AttributeClass.isType([true, 'untrue', 0])).toStrictEqual(false)
  })
})

describe("ScalarAttribute object", () => {
  const AttributeClass = attributes.ScalarAttribute
  const key = 'testKey'
  let nodes = {
    0: {},
    1: {},
    2: {},
  }
  nodes[0][key] = 1
  nodes[1][key] = 2
  nodes[2][key] = 3

  it("returns properly for numericals", () => {
    const attribute = new AttributeClass(key, nodes)
    expect(attribute.getNodeNumericalValue({'testKey' : 2})).toStrictEqual(1/2)
  })
})

describe("CategoricalAttribute object", () => {
  const AttributeClass = attributes.CategoricalAttribute
  const key = 'testKey'
  const nodes = {
    0: {'testKey': 0},
    1: {'testKey': 1},
    2: {'testKey': 2},
    3: {'testKey': 3},
    4: {'testKey': 4},
    5: {'testKey': 5},
    6: {'testKey': 6},
    7: {'testKey': 7},
    8: {'testKey': 8},
  }

  const attribute = new AttributeClass(key, nodes)
  it("extent check", () => {
    expect(attribute.extent).toStrictEqual([0, 8])
  })

  it("value size check", () => {
    expect(attribute.values.length).toStrictEqual(9)
  })

  it("tests the color palettes return for a restrictive size", () => {
    expect(attribute.colorPalettes.length).toStrictEqual(5)
  })
})
