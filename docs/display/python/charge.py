from webweb import Web

# Instantiate webweb object
web = Web([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]])

# could also set web.display.c
web.display.charge = 150

# show the visualization
web.show()
