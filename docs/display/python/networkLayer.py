from webweb import Web

# Instantiate webweb object
web = Web(title='webweb', adjacency=[[0, 1]])

web.networks.webweb.add_layer(adjacency=[[0, 1], [1, 2]])

web.display.networkLayer = 1

# show the visualization
web.show()
