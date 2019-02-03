from webweb import Web

# Instantiate webweb object
web = Web(
    adjacency=[[0, 1]],
    display={
        'nodes' : {
            0 : {
                'x' : 125,
                'y' : 80,
            },
            1 : {
                'x' : 125,
                'y' : 160,
            },
        },
    }
)

web.display.freezeNodeMovement = True

# show the visualization
web.show()
