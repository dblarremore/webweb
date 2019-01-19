from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]])

# attach the visualization to a given element (no '#')
web.display.attachWebwebToElementWithId = 'myElement'

# show the visualization
web.show()
