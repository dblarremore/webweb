from webweb.webweb import webweb
import networkx as nx
import random

# make a small graph
G = nx.Graph()
G.add_edge('hunter', 'brian', weight=1)
G.add_edge('steve', 'hunter', weight=150)
G.add_edge('brian', 'steve', weight=1)
# G.add_edge(2, 3, weight=10)
# G.add_edge(3, 4, weight=100)
# G.add_edge(4, 5, weight=70)
# G.add_edge(0, 3, weight=25)

# Instantiate webweb object
web = webweb()

# Assign adjaceny lists in network
web.networks.networkx.add_layer_from_networkx_graph(G)

# link widths will be scaled by their weight
web.display.scaleLinkWidth = True

# link opacity will be scaled by their weight
web.display.scaleLinkOpacity = True

# Launch webbrowser with result
web.draw()
