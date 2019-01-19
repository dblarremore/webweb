from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]])

# make nodes really big
web.display.radius = 20

# show the visualization
web.show()
