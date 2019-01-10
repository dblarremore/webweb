from webweb import Web

# if both edges between two nodes are non-zero in the adjacency matrix, the
# first edge's weight is used (webweb traverses adjacency matrixes row-wise).
# i.e.:
# if webweb's given adjacency matrix where
# - matrix[0][1] = .1 
# - matrix[1][0] = 1
# it'll make an edge between nodes 0 and 1 with a weight .1 -- NOT 1, or 1.1
adjacency_matrix = [
    [0, .1, 0, 0, 0],
    [.1, 0, .5, 0, 0],
    [0, .5, 0, 1, 0],
    [0, 0, 1, 0, 2],
    [0, 0, 0, 2, 0],
]

# create the web
web = Web(adjacency_matrix)

# scale edge widths by weight so we can see a visual difference
web.display.scaleLinkWidth = True

# open the browser with the result
web.draw()
