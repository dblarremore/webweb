from webweb import Web

# create the network: a list of unweighted edges
adjacency_list = [[0,1], [1, 2], [2, 3]]

# create the web
web = Web(adjacency_list)

# open the browser with the result
web.draw()
