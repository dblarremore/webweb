import { Attribute } from '../attribute'

describe("Attribute object", () => {
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
    const attribute = new Attribute(key, nodes)
    expect(attribute.extent).toStrictEqual([1, 3])
  })

  it("tests construction when values is Object", () => {
    const attribute = new Attribute(key, nodes)
    expect(attribute.values).toStrictEqual([1, 2, 3])
  })

  it("tests construction when values is Array", () => {
    const attribute = new Attribute(key, values)
    expect(attribute.values).toStrictEqual([1, 2, 3])
  })
})
