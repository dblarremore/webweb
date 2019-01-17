from webweb import Web

# make a list of unweighted edges
# (nodes can be numbers or strings)
edge_list = [[0, 1], [1, 2], [2, 3]]

# create the web
web = Web(edge_list)

# open the browser with the result
web.draw()
