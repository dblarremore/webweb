from webweb import Web

# if the set of a metadata attribute's values contains strings (like
# 'cooperativity' here), webweb'll display it as a categorical variable.

# if that set contains numbers (like 'alphabeticallity' here), you should tell
# webweb how to display it by adding that metadata attribute name to the
# `metadataInfo` key to the `display` attribute with an array under
# `categories`; a node's value for this metadata attribute should be an index
# into this array.
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
        'metadataInfo' : {
            'alphabeticallity' : {
                'categories' : ['A-Z', 'a-z', 'W+'],
            }
        },
    },
)

# we'll compute node color by the `alphabeticallity` metadata attribute
# (categorical metadata can't be used to compute node sizes)
web.display.colorBy = 'alphabeticallity'

web.draw()
