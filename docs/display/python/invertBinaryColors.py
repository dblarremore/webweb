from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], display={
    'metadata' : {
        'isHappy' : {
            'values' : [True, False, False, True, True, False],
        }

    }
})

# use the 'isHappy' attribute to color nodes
web.display.colorBy = 'isHappy'

# invert the colors used for `False` and `True`
web.display.invertBinaryColors = True

# show the visualization
web.show()
