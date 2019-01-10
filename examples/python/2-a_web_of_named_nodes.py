from webweb import Web

# create the network
adjacency_list = [["Dan", "Hunter"], ["Dan", "Tzu-Chi"], ["Hunter", "Steve"]]

# create the web
web = Web(adjacency_list)

# open the browser with the result
web.draw()
