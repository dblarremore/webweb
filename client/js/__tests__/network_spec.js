import { Network } from '../network'

describe("network object metadata regularization", () => {
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
  let network = new Network('', {}, globalMetadata)

  it("tests that global metadata is defaulted", () => {
    let network_metadata = network.regularizeLayerMetadata({}, globalMetadata)
    
    expect(network_metadata).toStrictEqual(globalMetadata)
  })

  it("tests that layer metadata is applied", () => {
    let network_metadata = network.regularizeLayerMetadata({
      'test': {
        'type': 'testtype',
      },
      'other_test': {
        'categories': ['A', 'B', 'C'],
        'values': [1,2,3],
      },
    }, globalMetadata)
    
    expect(network_metadata).toStrictEqual({
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

describe("tests network object nodes regularization", () => {
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
    let network = new Network('', {'nodes': nodes}, globalMetadata, {})
    let network_metadata = network.regularizeLayerNodes(nodes, {})
    
    expect(network_metadata).toStrictEqual({
      1: {
        "degree": 0,
        'hi': 1,
        "name": "1",
      },
      2: {
        "degree": 0,
        'hi': 2,
        "name": "2",
      },
      '1': {
        "degree": 0,
        'hi': 1,
        "name": "1",
      },
      '2': {
        "degree": 0,
        'hi': 2,
        "name": "2",
      },
      'non-int': {
        "degree": 0,
        'hi': 3,
        "name": "non-int",
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

    let network = new Network('', {'nodes': nodes}, globalMetadata, globalNodes)
    let network_metadata = network.regularizeLayerNodes(nodes, {})
    
    expect(network_metadata).toStrictEqual({
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
  let network = new Network('', {}, {}, {})
  it("tests that edges come out as sorted when all numbers", () => {
    let edges = [[2, 1]]
    let nodes = {
      4: {},
      3: {},
    }
    let results = network.getNodesMentioned(edges, {}, nodes)
    expect(results).toStrictEqual([1, 2, 3, 4])
  })

  it("tests that edges come out as sorted when all numbers", () => {
    let edges = [[2, 1]]
    let nodes = {
      4: {},
      3: {},
    }
    let results = network.getNodesMentioned(edges, {}, nodes)
    expect(results).toStrictEqual([1, 2, 3, 4])
  })

  it("tests that when there are strings, things come out right", () => {
    let edges = [["hunter", "steven"]]
    let nodes = {
      4: {},
      3: {},
    }
    let results = network.getNodesMentioned(edges, {}, nodes)
    expect(results).toStrictEqual(["hunter", "steven", 3, 4])
  })

  it("tests that when there is only metadata, things come out right", () => {
    let metadata = {
      'test': {
        'values': [1, 2]
      }
    }
    let results = network.getNodesMentioned([], metadata, {})
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
    let results = network.getNodesMentioned(edges, metadata, nodes)
    expect(results).toStrictEqual(["hunter", "steven", 3, 4, null, null])
  })
})

describe("tests that values lists are counted properly", () => {
  let network = new Network('', {}, {}, {})
  it("tests that no metadata --> 0", () => {
    let results = network.maxMetadataValuesCount()
    expect(results).toStrictEqual(0)
  })

  it("tests that metadata are properly counted", () => {
    let results = network.maxMetadataValuesCount({
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
  let network = new Network('', {}, {}, {})
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

    let results = network.getNodeNameToIdMap(edges, metadata, nodes)

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
  let network = new Network('', {}, {}, {})

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

    let results = network.mergeMetadataWithNodes({}, metadata, nodeIdToNameMap)

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

    let results = network.mergeMetadataWithNodes(nodes, metadata, nodeIdToNameMap)

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
  let network = new Network('', {}, {})
  it("tests single link", () => {
    let edges = [[0, 1]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
    }
    let results = network.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([{
      "source": '0',
      "target": '1',
      "weight": 1,
    }])
  })

  it("tests multiple links", () => {
    let edges = [[0, 1], [2, 0]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = network.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([
      {
        "source": '0',
        "target": '1',
        "weight": 1,
      },
      {
        "source": '0',
        "target": '2',
        "weight": 1,
      },
    ])
  })

  it("tests multiple links and repetitions", () => {
    let edges = [[0, 1], [2, 0], [1, 0]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = network.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([
      {
        "source": '0',
        "target": '1',
        "weight": 2,
      },
      {
        "source": '0',
        "target": '2',
        "weight": 1,
      },
    ])
  })

  it("tests multiple links and repetitions and weights", () => {
    let edges = [[0, 1], [2, 0], [1, 0, 2]]
    let nodeNameToIdMap = {
      '0': 0,
      '1': 1,
      '2': 2,
    }
    let results = network.createLinks(edges, nodeNameToIdMap)

    expect(results).toStrictEqual([
      {
        "source": '0',
        "target": '1',
        "weight": 3,
      },
      {
        "source": '0',
        "target": '2',
        "weight": 1,
      },
    ])
  })
})

describe("weightedness test", () => {
  let network = new Network('', {}, {})
  it("tests that unweightnetworks are shown as so", () => {
    let nodes = {
      '0': {
        'strength': 1,
        'degree': 1,
      }
    }
    let results = network.isUnweighted(nodes)
    expect(results).toStrictEqual(true)
  })
  it("tests that weightnetworks are shown as so", () => {
    let nodes = {
      '0': {
        'strength': 2,
        'degree': 1,
      }
    }
    let results = network.isUnweighted(nodes)
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
    let results = network.isUnweighted(nodes)
    expect(results).toStrictEqual(false)
  })
})

describe("add edge metadata to nodes test", () => {
  let network = new Network('', {}, {}, {})


  it("adds single metadata, unweighted", () => {
    let edges = [
      {
        'source': 0,
        'target': 1,
        'weight': 1
      }
    ]
    let nodes = {
      '0': {},
      '1': {},
    }
    let results = network.addEdgeMetadataToNodes(edges, nodes, true)
    expect(results).toStrictEqual({
      '0': {
        'degree': 1
      },
      '1': {
        'degree': 1
      }

    })
  })

  it("adds single metadata, weighted", () => {
    let edges = [
      {
        'source': 0,
        'target': 1,
        'weight': 1
      }
    ]
    let nodes = {
      '0': {},
      '1': {},
    }
    let results = network.addEdgeMetadataToNodes(edges, nodes, false)
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
  it("adds multiple metadata, unweighted", () => {
    let edges = [
      {
        'source': 0,
        'target': 1,
        'weight': 1
      },
      {
        'source': 0,
        'target': 2,
        'weight': 1
      }
    ]
    let nodes = {
      '0': {},
      '1': {},
      '2': {},
    }
    let results = network.addEdgeMetadataToNodes(edges, nodes, true)
    expect(results).toStrictEqual({
      '0': {
        'degree': 2,
      },
      '1': {
        'degree': 1,
      },
      '2': {
        'degree': 1,
      },
    })
  })
})

describe("finding displayable metadata", () => {
  let network = new Network('', {}, {}, {})
  it("tests the base case", () => {
    let nodes = {
      0: {
        'hi': 1,
        'hue': 'yellow',
        'justtrue': true,
        'negative': false,
        'onezero': true,
        'catsize': 1,
      },
      1: {
        'hi': 2,
        'hue': 'orange',
        'negative': false,
        'justtrue': true,
        'onezero': false,
        'catsize': 2,
      }
    }

    let metadata = {
      'catsize': {
        'categories': ["small", "large"],
      }
    }

    let expected = {
      'hue': {
        'type': 'categorical',
        'categories': ['orange', 'yellow',],
      },
      'hi': {
        'type': 'scalar',
      },
      'none': {
        'type': 'none',
      },
      'onezero': {
        'type': 'binary'
      },
      'negative': {
        'type': 'binary',
      },
      'justtrue': {
        'type': 'binary',
      },
      'catsize': {
        'categories': [
          "small",
          "large"
        ],
        'type': 'categorical',
      },
      'degree': {
        'type': 'degree',
      },
      'strength': {
        'type': 'degree',
      },
    }

    let results = network.getDisplayableMetadata(nodes, metadata)
    expect(results).toStrictEqual(expected)
  })
})
