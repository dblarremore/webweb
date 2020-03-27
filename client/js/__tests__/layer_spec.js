import { Layer } from '../layer'
import { Attribute, NameAttribute, ScalarAttribute, BinaryAttribute, DegreeAttribute, CategoricalAttribute } from '../attribute'

describe("layer object metadata regularization", () => {
  const globalMetadata = {
    'test': {
      'categories': ["this", 'is', 'a', 'test'],
      'type': 'categorical'
    }
  }
  const globalNodes = {
    1: {
      'name': 1,
    },
    2: {
      'name': 2,
    },
  }
  let layer = new Layer([], {}, {}, {}, globalMetadata, {})

  it("tests that global metadata is defaulted", () => {
    let actual = layer.regularizeMetadata({}, globalMetadata)
    
    expect(actual).toStrictEqual(globalMetadata)
  })

  it("tests that layer metadata is applied", () => {
    let actual = layer.regularizeMetadata({
      'test': {
        'type': 'testtype',
      },
      'other_test': {
        'categories': ['A', 'B', 'C'],
        'values': [1,2,3],
      },
    }, globalMetadata)
    
    expect(actual).toStrictEqual({
      'test': {
        'categories': ["this", 'is', 'a', 'test'],
        'type': 'testtype'
      },
      'other_test': {
        'categories': ['A', 'B', 'C'],
        'values': [1,2,3],
      }
    })
  })
})

describe("tests layer object nodes regularization", () => {
  const globalMetadata = {}

  let nodes = {
    1: {
      'hi': 1,
    },
    2: {
      'hi': 2,
    },
    'non-int': {
      'hi': 3,
    }
  }

  it("tests that nodes are properly formed", () => {
    let layer = new Layer([], nodes, {}, {}, globalMetadata, {})
    let actual = layer.regularizeNodes(nodes, {})
    
    expect(actual).toStrictEqual({
      1: {
        "degree": 0,
        'hi': 1,
        "name": "1",
        "strength": 0,
      },
      2: {
        "degree": 0,
        'hi': 2,
        "name": "2",
        "strength": 0,
      },
      'non-int': {
        "degree": 0,
        'hi': 3,
        "name": "non-int",
        "strength": 0,
      }
    })
  })

  it("tests that global node metadata is added to nodes, but does not overwrite", () => {
    let globalNodes = {
      1: {
        'hi': 0,
        'name': 1,
      },
      2: {
        'hi': 0,
        'name': 2,
      },
    }

    let layer = new Layer([], nodes, {}, {}, globalMetadata, globalNodes)
    let actual = layer.regularizeNodes(nodes, globalNodes)
    
    expect(actual).toStrictEqual({
      1: {
        "degree": 0,
        "strength": 0,
        'hi': 1,
        'name': "1",
      },
      2: {
        "degree": 0,
        "strength": 0,
        'hi': 2,
        'name': "2",
      },
      'non-int': {
        "degree": 0,
        "strength": 0,
        'hi': 3,
        'name': 'non-int',
      }
    })
  })
})

describe("tests that nodes are pulled from their objects properly", () => {
  let layer = new Layer([], {}, {}, {}, {}, {})
  it("tests that edges come out as sorted when all numbers", () => {
    let edges = [[2, 1]]
    let nodes = {
      4: {},
      3: {},
    }
    let actual = layer.getNodesMentioned(edges, {}, nodes)
    expect(actual).toStrictEqual([1, 2, 3, 4])
  })

  it("tests that edges come out as sorted when all numbers", () => {
    let edges = [[2, 1]]
    let nodes = {
      4: {},
      3: {},
    }
    let results = layer.getNodesMentioned(edges, {}, nodes)
    expect(results).toStrictEqual([1, 2, 3, 4])
  })

  it("tests that when there are strings, things come out right", () => {
    let edges = [["hunter", "steven"]]
    let nodes = {
      4: {},
      3: {},
    }
    let results = layer.getNodesMentioned(edges, {}, nodes)
    expect(results).toStrictEqual(["hunter", "steven", 3, 4])
  })

  it("tests that when there is only metadata, things come out right", () => {
    let metadata = {
      'test': {
        'values': [1, 2]
      }
    }
    let results = layer.getNodesMentioned([], metadata, {})
    expect(results).toStrictEqual([null, null])
  })

  it("tests that when there is everything, and metadata, things come out right", () => {
    let edges = [["hunter", "steven"]]
    let nodes = {
      4: {},
      3: {},
    }
    let metadata = {
      'test': {
        'values': [1, 2, 3, 4, 5, 6]
      }
    }
    let results = layer.getNodesMentioned(edges, metadata, nodes)
    expect(results).toStrictEqual(["hunter", "steven", 3, 4, null, null])
  })
})

describe("tests that values lists are counted properly", () => {
  let layer = new Layer([], {}, {}, {}, {}, {})
  it("tests that no metadata --> 0", () => {
    let results = layer.maxMetadataValuesCount()
    expect(results).toStrictEqual(0)
  })

  it("tests that metadata are properly counted", () => {
    let results = layer.maxMetadataValuesCount({
      'key one': {
        'values': [1, 2],
      },
      'key two': {
        'type': 'test',
      },
      'key three': {
        'values': [1, 2, 3],
      },
    })
    expect(results).toStrictEqual(3)
  })
})

describe("tests that node id maps are formed properly", () => {
  let layer = new Layer([], {}, {}, {}, {}, {})
  it("tests that edges are properly attributed", () => {
    let edges = [["hunter", "steven"]]
    let nodes = {
      4: {},
      3: {},
    }
    let metadata = {
      'test': {
        'values': [1, 2, 3, 4, 5, 6]
      }
    }

    let results = layer.getNodeNameToIdMap(edges, metadata, nodes)

    expect(results).toStrictEqual({
      'hunter': 0,
      'steven': 1,
      3: 2,
      4: 3,
      '5': 4,
      '6': 5,
    })
  })
})

describe("metadata+node merging", () => {
  let layer = new Layer([], {}, {}, {}, {}, {})

  it("tests that metadata from metadata is properly added without nodes", () => {
    let nodeIdToNameMap = {
      0: "hunter",
      1: "steve",
      2: 2,
      3: 3,
    }
    let metadata = {
      'test': {
        'values': [1,2,'A','B']
      }
    }

    let results = layer.mergeMetadataWithNodes({}, metadata, nodeIdToNameMap)

    expect(results).toStrictEqual({
      "hunter": {
        'name': 'hunter',
        'test': 1,
      },
      "steve": {
        'name': 'steve',
        'test': 2,
      },
      2: {
        'test': 'A',
        'name': 2,
      },
      3: {
        'test': 'B',
        'name': 3,
      }
    })

  })

  it("tests that metadata from metadata is properly added with nodes", () => {
    let nodeIdToNameMap = {
      0: "hunter",
      1: "steve",
      2: 2,
      3: 3,
    }
    let metadata = {
      'test': {
        'values': [1,2,'A','B']
      }
    }

    let nodes = {
      "hunter": {
        'name': 'hunter',
      },
      "steve": {
        'name': 'steve',
      },
    }

    let results = layer.mergeMetadataWithNodes(nodes, metadata, nodeIdToNameMap)

    expect(results).toStrictEqual({
      "hunter": {
        'name': 'hunter',
        'test': 1,
      },
      "steve": {
        'name': 'steve',
        'test': 2,
      },
      2: {
        'test': 'A',
        'name': 2,
      },
      3: {
        'test': 'B',
        'name': 3,
      }
    })

  })
})

describe("link formation test", () => {
  let layer = new Layer([], {}, {}, {}, {}, {})
  it("tests single link", () => {
    let edges = [[0, 1]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
    }
    let results = layer.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([[
      '0',
      '1',
      1,
    ]])
  })

  it("tests multiple links", () => {
    let edges = [[0, 1], [2, 0]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = layer.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([
      [
        '0',
        '1',
        1,
      ],
      [
        '0',
        '2',
        1,
      ],
    ])
  })

  it("tests multiple links and repetitions", () => {
    let edges = [[0, 1], [2, 0], [1, 0]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = layer.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([
      [
        '0',
        '1',
        2,
      ],
      [
        '0',
        '2',
        1,
      ],
    ])
  })

  it("tests multiple links and repetitions and weights", () => {
    let edges = [[0, 1], [2, 0], [1, 0, 2]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = layer.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([
      [
        '0',
        '1',
        3,
      ],
      [
        '0',
        '2',
        1,
      ],
    ])
  })
})

describe("weightedness test", () => {
  let layer = new Layer([], {}, {}, {}, {}, {})
  it("tests that unweightnetworks are shown as so", () => {
    let nodes = {
      '0': {
        'strength': 1,
        'degree': 1,
      }
    }
    let results = layer.isUnweighted(nodes)
    expect(results).toStrictEqual(true)
  })
  it("tests that weightnetworks are shown as so", () => {
    let nodes = {
      '0': {
        'strength': 2,
        'degree': 1,
      }
    }
    let results = layer.isUnweighted(nodes)
    expect(results).toStrictEqual(false)
  })
  it("tests that nodes networks work too", () => {
    let nodes = {
      '0': {
        'strength': 2,
        'degree': 1,
      },
      '1': {
        'strength': 2,
        'degree': 2,
      }
    }
    let results = layer.isUnweighted(nodes)
    expect(results).toStrictEqual(false)
  })
})

describe("add edge metadata to nodes test", () => {
  let layer = new Layer([], {}, {}, {}, {}, {})

  it("adds single metadata", () => {
    let edges = [
      [
        0,
        1,
        1
      ]
    ]
    let nodes = {
      '0': {},
      '1': {},
    }
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = layer.addEdgeMetadataToNodes(edges, nodes, nodeNameToIdMap)
    expect(results).toStrictEqual({
      '0': {
        'degree': 1,
        'strength': 1,
      },
      '1': {
        'degree': 1,
        'strength': 1,
      }
    })
  })
  it("adds multiple metadata", () => {
    let edges = [
      [
        0,
        1,
        1
      ],
      [
        0,
        2,
        1
      ]
    ]
    let nodes = {
      '0': {},
      '1': {},
      '2': {},
    }
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = layer.addEdgeMetadataToNodes(edges, nodes, nodeNameToIdMap)
    expect(results).toStrictEqual({
      '0': {
        'degree': 2,
        'strength': 2,
      },
      '1': {
        'degree': 1,
        'strength': 1,
      },
      '2': {
        'degree': 1,
        'strength': 1,
      },
    })
  })
})

describe("finding displayable metadata", () => {})
