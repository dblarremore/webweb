from webweb import Web

# webweb'll display a metadata attribute as binary if every node's value for
# that attribute is either True or False.
web = Web(
    adjacency=[['Dan', 'Hunter'], ['Brian', 'Hunter'], ['Carl', 'Hunter'], ['Carl', 'Brian']],
    display={
        'nodes' : {
            'Dan' : {
                'wearsGlasses' : True,
            },
            'Hunter' : {
                'wearsGlasses' : True,
            },
            'Brian' : {
                'wearsGlasses' : True,
            },
            'Carl' : {
                'wearsGlasses' : False,
            },
        },
    },
)

# use the 'wearsGlasses' to compute node sizes
web.display.sizeBy = 'wearsGlasses'

# `True` values will be "big" and `False` values small, but if we wanted the
# opposite, we could do the following:
# web.display.invertBinarySizes = True

# open the browser with the result
web.draw()
