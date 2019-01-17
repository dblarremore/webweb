from webweb import Web

web = Web(
    title='oroboros',
    adjacency=[[0, 1], [1, 2], [2, 3]],
    metadata={
        'isHead' : {
            'values' : [True, False, False, False],
        }
    }
)

# oroboros begins chompin'
web.networks.oroboros.add_layer(
    adjacency=[[0, 1], [1, 2], [2, 3], [3, 0]],
    metadata={
        'isHead' : {
            'values' : [True, False, False, False],
        }
    }
)

web.networks.oroboros.add_layer(
    adjacency=[[0, 1], [1, 2], [2, 0]],
    metadata={
        'isHead' : {
            'values' : [True, False, False],
        }
    }
)

web.networks.oroboros.add_layer(
    adjacency=[[0, 1], [1, 0]],
    metadata={
        'isHead' : {
            'values' : [True, False],
        }
    }
)

# lame symbol for infinity if you ask me.
web.networks.oroboros.add_layer(
    adjacency=[],
    metadata={
        'isHead' : {
            'values' : [True],
        }
    }
)

# display the first layer first (you could put, say, 1 here and it would display the second)
web.display.networkLayer = 0

# we'll compute node color by the `isHead` attribute
web.display.colorBy = 'isHead'

# we'll compute node size by the `isHead` attribute
web.display.sizeBy = 'isHead'

web.draw()
