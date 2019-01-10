from webweb import Web

# edge weights are the third element in the edge
adjacency_list = [[0, 1, .1], [1, 2, .5], [2, 3, 1], [3, 4, 2]]

# when there are multiple edges between two nodes, the first edge's weight is
# used. i.e.:
# if webweb's given an adjacency list like [[0, 1, .1], [0, 1, 1]], it'll make
# an edge between nodes 0 and 1 with a weight .1 -- NOT 1, or 1.1
# (this would also be the case for the adjacency list [[0, 1, .1], [1, 0, 1]])

# create the web
web = Web(adjacency_list)

# scale edge widths by weight so we can see a visual difference
web.display.scaleLinkWidth = True

# open the browser with the result
web.draw()
