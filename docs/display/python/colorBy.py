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

# Launch webbrowser with result
web.draw()
