from webweb import Web
import networkx as nx
import random

# Instantiate webweb object
web = Web()

# make a simple gnp random graph
G = nx.fast_gnp_random_graph(100, .15)

# Assign adjaceny lists in network
web.networks.networkx.add_layer_from_networkx_graph(G)

# Launch webbrowser with result
web.draw()
