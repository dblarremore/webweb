from webweb import Web

# Instantiate webweb object
web = Web(
    adjacency=[[0, 1], [1, 2], [2, 3], [3, 0]],
    title='square',
    display={
        'nodes' : {
            0 : {
                'name' : 'huberg',
                'cooperativity' : 'high',
                'alphabeticallity' : 1,
                'age' : 10,
                'isSmelly' : True,
            },
            1 : {
                'name' : 'pierot',
                'cooperativity' : 'low',
                'alphabeticallity' : 2,
                'age' : 20,
                'isSmelly' : True,
            },
            2 : {
                'name' : 'slartibartfast',
                'cooperativity' : 'medium',
                'alphabeticallity' : 3,
                'age' : 30,
                'isSmelly' : False,
            },
            3 : {
                'name' : 'cheese',
                'cooperativity' : 'medium',
                'alphabeticallity' : 4,
                'age' : 40,
                'isSmelly' : False,
            },
        },
        'metadataInfo' : {
            'alphabeticallity' : {
                'categories' : ['A-Z', 'a-z', 'nope', 'yep'],
            }
        },
    },
)

# we'll compute node color by the `alphabeticallity` attribute
web.display.colorBy = 'alphabeticallity'

# set the default color Palette for non-scalars
web.display.colorPalette = "Dark2"

# # Build a few networks
# web.networks.square.add_layer(
#     # the labels
#     {
#         'alphabeticallity' : {
#             'value' : [ 0, 1, 2, 3 ],
#             # we have to put this if we want this to be displayed
#             # categorically, as we used numbers above
#             'categories' : ['A-Z', 'a-z', 'nope', 'yep']

#         },
#         'cooperativity' : {
#             # we can omit categories here because we used strings
#             'value' : [ 'high', 'low', 'medium', 'medium' ],
#         },
#     }
# )

# web.display.nodeNames = ['huberg', 'pierot', 'slartibartfast', 'cheese']

web.draw()

