from webweb import Web

adjacency_matrix = [
    [0, .1, 0, 0, 0],
    [.1, 0, .5, 0, 0],
    [0, .5, 0, 1, 0],
    [0, 0, 1, 0, 2],
    [0, 0, 0, 2, 0],
]

# create the web
web = Web(adjacency_matrix)

# we'll scale edge widths by weight to create a visual difference
web.display.scaleLinkWidth = True

# show the visualization
web.show()
