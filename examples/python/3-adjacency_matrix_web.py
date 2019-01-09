from webweb import Web

# make a network from an adjacency matrix
adjacency_matrix = [
    [0, 1, 0, 0],
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [0, 0, 1, 0],
]

# webweb'll guess whether the adjacency you've given it is a list or a matrix,
# but if you're pass it a matrix with fewer than 4 nodes, it'll think it's
# an adjacency list unless you put it in it's place like so: 
# web = Web(adjacency_matrix, adjacency_type='matrix')
web = Web(adjacency_matrix)

# create the web
web = Web(adjacency_matrix)

# open the browser with the result
web.draw()
