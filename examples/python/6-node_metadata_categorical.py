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

web.draw()

