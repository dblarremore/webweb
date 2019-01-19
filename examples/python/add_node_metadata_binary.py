from webweb import Web

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
            'Tzu-Chi' : {},
        },
        'metadata' : {
            'wearsContacts' : {
                'values' : [True, False, True, False, False],
            }
        }
    },
)

# use the 'wearsGlasses' to compute node sizes
web.display.sizeBy = 'wearsGlasses'

web.display.colorBy = 'wearsContacts'

# show the visualization
web.show()
