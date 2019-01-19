from webweb import Web

web = Web(
    adjacency=[[0, 1], [1, 2]],
    display={
        'nodes' : {
            0 : {
                'age' : 10,
            },
            1 : {
                'age' : 20,
            },
            2 : {
                'age' : 30,
            },
        },
        'metadata' : {
            'velocity' : {
                'values' : [42, 100, 7]
            },
        },
    },
)

# we'll compute node size by the `age` metadata attribute
web.display.sizeBy = 'age'

# we'll compute node color by the `velocity` metadata attribute
web.display.colorBy = 'velocity'

# show the visualization
web.show()
