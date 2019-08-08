import { Legend, SizeSublegend, ColorSublegend } from '../legend'
import { Attribute, NameAttribute, ScalarAttribute, BinaryAttribute, DegreeAttribute, CategoricalAttribute } from '../attribute'

describe("size sublegend object", () => {
  it("tests construction", () => {
    let sizeKey = 'testSizeKey'
    let colorKey = 'testColorKey'

    let r = 5

    let nodes = [
      {
        '__scaledSize': 1,
        '__scaledColor': 2,
      }
    ]

    let sizeAttribute = new DegreeAttribute(sizeKey)

    let actual = new SizeSublegend(
      sizeKey,
      sizeAttribute,
      r,
      nodes
    )
    expect(actual.attributeKey).toStrictEqual(sizeKey)
    expect(actual.attribute).toStrictEqual(sizeAttribute)
    expect(actual.r).toStrictEqual(r)
    expect(actual.nodes).toStrictEqual(nodes)
    expect(actual.values).toStrictEqual([1])
    expect(actual.R).toBe(r * 1)
  })
})

describe("color sublegend object", () => {
  fit("tests construction", () => {
    let key = 'testColorKey'

    let r = 5

    let nodes = [
      {
        'testColorKey': 2,
        '__scaledSize': 1,
        '__scaledColor': 2,
      }
    ]

    let attribute = new CategoricalAttribute(key, [2])

    let actual = new ColorSublegend(
      key,
      attribute,
      r,
      nodes
    )
    expect(actual.attributeKey).toStrictEqual(key)
    expect(actual.attribute).toStrictEqual(attribute)
    expect(actual.r).toStrictEqual(r)
    expect(actual.nodes).toStrictEqual(nodes)
    expect(actual.values).toStrictEqual(["2"])
  })
})
