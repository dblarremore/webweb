from webweb import Web
import random

web = Web(
    title='oroboros',
    adjacency=[[0, 1], [1, 2], [2, 3]],
    nodes={
        0 : { 'isHead' : True },
        1 : { 'isHead' : False },
        2 : { 'isHead' : False },
        3 : { 'isHead' : False },
    },
)

# oroboros begins chompin'
web.networks.oroboros.add_layer(
    adjacency=[[0, 1], [1, 2], [2, 3], [3, 0]],
    nodes={
        0 : { 'isHead' : True },
        1 : { 'isHead' : False },
        2 : { 'isHead' : False },
        3 : { 'isHead' : False },
    },
)

web.networks.oroboros.add_layer(
    adjacency=[[0, 1], [1, 2], [2, 0]],
    nodes={
        0 : { 'isHead' : True },
        1 : { 'isHead' : False },
        2 : { 'isHead' : False },
    },
)

web.networks.oroboros.add_layer(
    adjacency=[[0, 1], [1, 0]],
    nodes={
        0 : { 'isHead' : True },
        1 : { 'isHead' : False },
    },
)

# lame symbol for infinity if you ask me.
web.networks.oroboros.add_layer(
    adjacency=[],
    nodes={
        0 : { 'isHead' : True },
    },
)

# display the first layer first (you could put, say, 1 here and it would display the second)
web.display.networkLayer = 0

# we'll compute node color by the `isHead` attribute
web.display.colorBy = 'isHead'

# we'll compute node size by the `isHead` attribute
web.display.sizeBy = 'isHead'

web.draw()
