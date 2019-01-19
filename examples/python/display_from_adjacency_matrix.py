from webweb import Web

# make an unweighted adjacency matrix
adjacency_matrix = [
    [0, 1, 0, 0],
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [0, 0, 1, 0],
]

# if you give webweb a matrix with fewer than 4 nodes, it'll think it's an edge
# list unless you tell it what's what like so: 
# web = Web(adjacency_matrix, adjacency_type='matrix')
web = Web(adjacency_matrix)

# show the visualization
web.show()
