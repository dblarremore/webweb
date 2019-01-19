from webweb import Web

# Instantiate webweb object
web = Web(
    adjacency=[[0, 1]],
    display={
        'nodes' : {
            0 : {
                'x' : 100,
                'y' : 75,
            },
            1 : {
                'x' : 100,
                'y' : 150,
            },
        },
    }
)

web.display.freezeNodeMovement = True

# show the visualization
web.show()
