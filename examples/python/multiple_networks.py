from webweb import Web

# define the node names and a hunger metadata attribute to appear in all networks
web = Web(
    display={
        'nodes' : {
            0 : {
                'name' : 'dane',
                'hunger' : 4,
            },
            1 : {
                'name' : 'sebastian',
                'hunger' : 9,
            },
            2 : {
                'name' : 'manny',
                'hunger' : 2,
            },
            3 : {
                'name' : 'brock',
                'hunger' : 4,
            },
            4 : {
                'name' : 'ted',
                'hunger' : 12.1,
            },
            5 : {
                'name' : 'donnie',
                'hunger' : 5,
            },
        }
    },
)

# add a 'snake' network
web.networks.snake(
    adjacency=[[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    nodes={
        0 : {
            'isHead' : False,
        },
        1 : {
            'isHead' : False,
        },
        2 : {
            'isHead' : False,
        },
        3 : {
            'isHead' : False,
        },
        4 : {
            'isHead' : False,
        },
        5 : {
            'isHead' : True,
        },
    },
)

# add a 'starfish' network
web.networks.starfish(
    adjacency=[[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    nodes={
        0 : {
            'texture' : 'gooey',
            'power' : 1,
        },
        1 : {
            'texture' : 'fishy',
            'power' : 3,
        },
        2 : {
            'texture' : 'chewy',
            'power' : 3.8,
        },
        3 : {
            'texture' : 'crunchy',
            'power' : 0.2,
        },
        4 : {
            'texture' : 'chewy',
            'power' : 1,
        },
        5 : {
            'texture' : 'gooey',
            'power' : 3.1415,
        },
    }
)

# display the `starfish` network first
web.display.networkName = 'starfish'

# we'll compute node color by the `texture` attribute
web.display.colorBy = 'texture'

# we'll compute node size by the `isHead` attribute
web.display.sizeBy = 'isHead'

web.draw()
