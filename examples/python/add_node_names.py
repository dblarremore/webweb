from webweb import Web

web = Web(
    adjacency=[[0, 1], [1, 2]],
    display={
        'nodes' : {
            0 : {
                'name' : 'Huberg',
            },
            1 : {
                'name' : 'Pierot',
            },
            2 : {
                'name' : 'Slartibertfast',
            },
        },
    },
)

# show the visualization
web.show()
