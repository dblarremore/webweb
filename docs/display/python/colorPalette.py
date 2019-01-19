from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], display={
    'metadata' : {
        'emotion' : {
            'values' : ['happy', 'sad', 'angry', 'sad', 'happy', 'sad']
        }

    }
})

# use the 'emotion' attribute to color nodes
web.display.colorBy = 'emotion'

# set the color palette to use
# this value will be used as when we are `display.colorBy` references a
# categorical or binary attribute
web.display.colorPalette = 'Set3'

# show the visualization
web.show()
