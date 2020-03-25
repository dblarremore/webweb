import { Attribute } from '../attribute'

describe("Attribute object", () => {
  const key = 'testKey'
  const displayType = 'color'
  let nodes = {
    0: {},
    1: {},
  }
  nodes[0][key] = 1
  nodes[1][key] = 2

  it("tests extent", () => {
    const attribute = new Attribute(key, nodes, displayType)
    expect(attribute.extent).toStrictEqual([1, 2])
  })
})
