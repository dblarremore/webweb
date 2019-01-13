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
        },
    },
)

# use the 'wearsGlasses' to compute node sizes
web.display.sizeBy = 'wearsGlasses'

# open the browser with the result
web.draw()
