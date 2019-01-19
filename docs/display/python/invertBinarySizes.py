from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], display={
    'metadata' : {
        'isHappy' : {
            'values' : [True, False, False, True, True, False],
        }

    }
})

# use the 'isHappy' attribute to size nodes
web.display.sizeBy = 'isHappy'

# invert the sizes used for `False` and `True` (make `False` big and `True` small)
web.display.invertBinarySizes = True

# show the visualization
web.show()
