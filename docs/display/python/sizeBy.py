from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], display={
    'metadata' : {
        'happiness' : {
            'values' : [5, 10, 7, 8, 1, 3],
        }

    }
})

# use the 'happiness' attribute to size nodes
web.display.sizeBy = 'happiness'

# Launch webbrowser with result
web.draw()
