import { Attribute, BinaryAttribute, CategoricalAttribute } from '../attribute'

describe("basic attribute", () => {
  it("tests that an attribute constructs its key", () => {
    let key = 'testKey'
    let actual = new Attribute(key)
    
    expect(actual.key).toStrictEqual(key)
  })

  it("tests node value extent", () => {
    let key = 'testKey'
    let nodes = [
      { 'testKey': 0, },
      { 'testKey': 1, },
      { 'testKey': 2, },
    ]


    let attribute = new Attribute(key)
    expect(attribute.extent(nodes)).toStrictEqual(["0", "1", "2"])
  })
  it("tests node transformations", () => {
    let key = 'testKey'
    let categories = ["test", "categories"]
    let nodes = {
      0: { 'testKey': 0, },
      1: { 'testKey': 1, },
      2: { 'testKey': 2, }, 
    }

    let attribute = new Attribute(key, categories)
    expect(attribute.transformNodeValues(nodes)).toStrictEqual(nodes)
  })
})

describe("binary attribute", () => {
  let key = 'testKey'
  it("tests node transformations", () => {
    let nodes = {
      0: { 'testKey': 0, },
      1: { 'testKey': 1, },
      2: { 'testKey': 2, }, 
    }

    let attribute = new BinaryAttribute(key)
    expect(attribute.transformNodeValues(nodes)).toStrictEqual({
      0: { 'testKey': false, },
      1: { 'testKey': true, },
      2: { 'testKey': true, }, 
    })
  })

  describe("isType tests", () => {
    let testCases = {
      positive: [
        [true, false],
        [false, undefined],
        [true, undefined],
        [0, 1],
        [0, undefined],
        [1, undefined],
        [true],
        [false],
        ['true'],
        ['false'],
        [0],
        [1],
      ],
      negative: [
        [undefined],
        [2],
        ['hunter'],
      ]
    }

    let attribute = new BinaryAttribute(key)

    Object.entries(testCases).forEach(([type, typeTestCases]) => {
      let expecting = type == 'positive' ? true : false

      typeTestCases.forEach((testCase) => {
        it("binary type detection: " + testCase, () => {
          let nodes = makeTestCaseNodes(testCase, key)
          let actual = attribute.isType(nodes)

          expect(actual).toStrictEqual(expecting)
        })
      })
    })
  })
})

describe("categorial attribute", () => {
  let key = 'testKey'
  it("tests that an attribute constructs its key", () => {
    let categories = ["test", "categories"]
    let actual = new CategoricalAttribute(key, categories)
    
    expect([actual.key, actual.categories]).toStrictEqual([key, categories])
  })

  describe("isType tests", () => {
    let testCases = {
      positive: [
        ['hunter', false],
        [0, 'hunter']
      ],
      negative: [
        [1, 0],
      ]
    }

    let attribute = new CategoricalAttribute(key)

    Object.entries(testCases).forEach(([type, typeTestCases]) => {
      let expecting = type == 'positive' ? true : false

      typeTestCases.forEach((testCase) => {
        it("categorical type detection: " + testCase, () => {
          let nodes = makeTestCaseNodes(testCase, key)
          let actual = attribute.isType(nodes)

          expect(actual).toStrictEqual(expecting)
        })
      })
    })
  })
})

function makeTestCaseNodes(testCase, key) {
  let nodes = {}
  for (let [i, val] of Object.entries(testCase)) {
    nodes[i] = {}
    nodes[i][key] = val
  }
  return nodes
}
