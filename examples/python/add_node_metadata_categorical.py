from webweb import Web

web = Web(
    adjacency=[[0, 1], [1, 2]],
    display={
        'nodes' : {
            0 : {
                'cooperativity' : 'high',
                'alphabeticallity' : 0,
            },
            1 : {
                'cooperativity' : 'low',
                'alphabeticallity' : 1,
            },
            2 : {
                'cooperativity' : 'medium',
                'alphabeticallity' : 2,
            },
        },
        'metadata' : {
            'alphabeticallity' : {
                'categories' : ['A-Z', 'a-z', 'W+'],
            }
        },
    },
)

# we'll compute node color by the `alphabeticallity` metadata attribute
# (categorical metadata can't be used to compute node sizes)
web.display.colorBy = 'alphabeticallity'

# show the visualization
web.show()
