from webweb.webweb import webweb

# Instantiate webweb object
web = webweb()

# we'll compute node color by the `alphabeticallity` attribute
web.display.colorBy = 'alphabeticallity'

# set the default color Palette for non-scalars
web.display.colorPalette = "Dark2"

# Build a few networks
web.networks.square.add_frame(
    # the adjacency
    [[0, 1], [1, 2], [2, 3], [3, 0]],
    # the labels
    {
        'alphabeticallity' : {
            'value' : [ 0, 1, 2, 3 ],
            # we have to put this if we want this to be displayed
            # categorically, as we used numbers above
            'categories' : ['A-Z', 'a-z', 'nope', 'yep']

        },
        'cooperativity' : {
            # we can omit categories here because we used strings
            'value' : [ 'high', 'low', 'medium', 'medium' ],
        },
    }
)

web.display.nodeNames = ['huberg', 'pierot', 'slartibartfast', 'cheese']

web.draw()
