import { Layer, Edge } from '../layer'
import { Attribute, NameAttribute, ScalarAttribute, BinaryAttribute, DegreeAttribute, CategoricalAttribute } from '../attribute'

describe("regularizeEdge", () => {
  describe("edge regularization", () => {
    it("numerical edge without weight", () => {
      expect(Layer.regularizeEdge([0, 1])).toStrictEqual([0, 1, 1, {}])
    })

    it("numerical edge with integer weight", () => {
      expect(Layer.regularizeEdge([0, 1, 2])).toStrictEqual([0, 1, 2, {}])
    })

    it("numerical edge with float weight", () => {
      expect(Layer.regularizeEdge([0, 1, .5])).toStrictEqual([0, 1, .5, {}])
    })

    it("numerical edge with string float weight", () => {
      expect(Layer.regularizeEdge([0, 1, ".5"])).toStrictEqual([0, 1, .5, {}])
    })

    it("string edge without weight", () => {
      expect(Layer.regularizeEdge(["0", "1"])).toStrictEqual([0, 1, 1, {}])
    })

    it("string edge with weight and metadata", () => {
      const metadata = {'test': 'pass'}
      expect(Layer.regularizeEdge(["0", "1", 1, metadata])).toStrictEqual([0, 1, 1, metadata])
    })
  })
})

describe("addEdge", () => {
  it("creates a new edge when one does not exist", () => {
    expect(Layer.addEdge({}, 0, 1, 2)).toStrictEqual({0: {1: new Edge(0, 1, 2)}})
  })

  it("adds to an existing edge when it exists", () => {
    const edgeMap = {
      0: {
        1: new Edge(0, 1, 2)
      }
    }
    expect(Layer.addEdge(edgeMap, 0, 1, 3)).toStrictEqual({0: {1: new Edge(0, 1, 5)}})
  })

  it("applies edge metadata", () => {
    const edgeMap = {
      0: {
        1: new Edge(0, 1, 2, {'test': 'before', 'static': true})
      }
    }

    let actual = Layer.addEdge(edgeMap, 0, 1, 3, {'test': 'after'})
    let expected = {
      0: {
        1: new Edge(0, 1, 5, {'test': 'after', 'static': true})
      }
    }

    expect(actual).toStrictEqual(expected)
  })
})

describe("regularizeEdgeList", () => {
  it("combines duplicate edges", () => {
    let actual = Layer.regularizeEdgeList([[0, 1], [0, 1]])[0]
    let expected = [new Edge(0, 1, 2)]
    expect(actual).toStrictEqual(expected)
  })

  it("undirects properly", () => {
    let actual = Layer.regularizeEdgeList([[0, 1], [1, 0]])
    let expected = [
      [new Edge(0, 1, 1), new Edge(1, 0, 1)],
      [new Edge(0, 1, 2)],
    ]
    expect(actual).toStrictEqual(expected)
  })
})

describe("getNodeNames", () => {
  // edges, all numbers
  // edges, not all numbers
  it("tests edge node mentions, all numbers", () => {
    const edges = [new Edge(1, 2, 1), new Edge(0, 1, 1)]

    expect(Layer.getNodeNames(edges)).toStrictEqual([0, 1, 2])
  })

  it("tests edge node mentions, not all numbers", () => {
    const edges = [new Edge(1, 2, 1), new Edge('hunter', 2, 1)]

    expect(Layer.getNodeNames(edges)).toStrictEqual([1, 2, 'hunter'])
  })

  it("tests nodeDict node mentions", () => {
    const nodesDict = {
      1: {
        'test': 1,
      },
      'hunter': {
        'test': 2,
      },
    }

    expect(Layer.getNodeNames([], nodesDict)).toStrictEqual([1, 'hunter'])
  })

  it("tests counts of metadata with values", () => {
    const metadata = {
      'key1': {
        'values': [1, 2]
      },
      'key2': {
        'values': [1, 2, 3]
      },
      'key3': {},
    }

    expect(Layer.maxMetadataValuesCount(metadata)).toStrictEqual(3)
  })
  it("tests counts of metadata without values", () => {
    expect(Layer.maxMetadataValuesCount()).toStrictEqual(0)
  })


  
  it("tests metadata values mentions", () => {
    const metadata = {
      'key1': {
        'values': [1, 2]
      },
    }

    expect(Layer.getNodeNames([], {}, metadata)).toStrictEqual([0, 1])
  })


  it("tests edge dict, node dict, and metadata", () => {
    const edges = [new Edge(0, 1, 1)]

    const nodeDict = {
      'hunter': {},
    }

    const metadata = {
      'key1': {
        'values': [1, 2, 3, 4]
      },
    }

    expect(Layer.getNodeNames(edges, nodeDict, metadata)).toStrictEqual([0, 1, 'hunter', 2])
  })
})


describe("metadata regularization", () => {
  const layerMetadata = {
    'test': {
      'categories': ['a', 'test'],
    }
  }

  const globalMetadata = {
    'test': {
      'categories': ['another', 'test', 'again'],
    },
    'anotherTest': {
      'values': [1, 2, 3]
    },
  }

  it("layer metadata is used", () => {
    expect(Layer.regularizeMetadata(layerMetadata)).toStrictEqual({
      'test': {
        'categories': ['a', 'test'],
        'type': 'categorical',
      }
    })
  })

  it("global metadata is used", () => {
    expect(Layer.regularizeMetadata({}, globalMetadata)).toStrictEqual({
      'test': {
        'categories': ['another', 'test', 'again'],
        'type': 'categorical',
      },
      'anotherTest': {
        'values': [1, 2, 3]
      }
    })
  })

  it("layer metadata is overwrites global metadata", () => {
    expect(Layer.regularizeMetadata(layerMetadata, globalMetadata)).toStrictEqual({
      'test': {
        'categories': ['a', 'test'],
        'type': 'categorical',
      },
      'anotherTest': {
        'values': [1, 2, 3]
      }
    })
  })
})

describe("node regularization", () => {
  it("tests that layer nodes are used", () => {
    expect(Layer.regularizeNodeDictionary({'string': {'test': 'hello'}})).toStrictEqual({
      'string': {
        'test': 'hello'
      }
    })
  })

  it("tests that global nodes are used", () => {
    expect(Layer.regularizeNodeDictionary({}, {'string': {'test': 'hello'}})).toStrictEqual({
      'string': {
        'test': 'hello'
      }
    })
  })

  it("tests that numerical strings become strings", () => {
    expect(Layer.regularizeNodeDictionary({'1': {'test': 'hello'}})).toStrictEqual({
      1: {
        'test': 'hello'
      }
    })
  })

  it("tests that layer nodes overwrite global nodes", () => {
    const layerNodes = {
      '1': {
        'name': 1,
      },
    }

    const globalNodes = {
      '1': {
        'name': 2,
      },
      '2': {
        'name': 2,
      },
    }
    expect(Layer.regularizeNodeDictionary(layerNodes, globalNodes)).toStrictEqual({
      '1': {
        'name': 1,
      },
      '2': {
        'name': 2,
      },
    })
  })
})

describe("init tests", () => {
  const inEdges = [[0, 1]]
  const outEdges = [new Edge(0, 1, 1)]
  const inNodes = {
    0: {
      'name': 'hunter'
    },
  }
  const outNodes = [
    {
      'name': 'hunter',
    },
    {
      'name': 1
    },
  ]

  describe("empty", () => {
    let layer = new Layer()

    it("tests that we don't die", () => {
      expect(layer.isWeighted).toStrictEqual(false)
      expect(layer.isDirected).toStrictEqual(false)
    })
  })

  describe("edge input", () => {
    let layer = new Layer(inEdges)

    it("tests that edges work", () => {
      expect(layer.edges).toStrictEqual(outEdges)
    })
  })

  describe("node input", () => {
    let layer = new Layer(inEdges, inNodes)

    it("tests that nodes work", () => {
      expect(layer.nodes).toStrictEqual(outNodes)
    })
  })
  describe("metadata input", () => {
    const inMetadata = {
      'key': {
        'type': 'values'
      }
    }
    let layer = new Layer(inEdges, inNodes, inMetadata)

    it("tests that nodes work", () => {
      expect(layer.nodes).toStrictEqual(outNodes)
    })
  })
})
