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
    },
)

# we'll compute node size by the `age` metadata attribute
web.display.sizeBy = 'age'

web.draw()
