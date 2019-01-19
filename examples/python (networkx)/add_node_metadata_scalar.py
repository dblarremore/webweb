from webweb import Web
import networkx as nx

G = nx.Graph()
G.add_edges_from([[0, 1], [1, 2]])

G.nodes[0]['age'] = 10
G.nodes[0]['velocity'] = 42
G.nodes[1]['age'] = 20
G.nodes[1]['velocity'] = 100
G.nodes[2]['age'] = 30
G.nodes[2]['velocity'] = 7

web = Web(nx_G=G)

# we'll compute node size by the `age` metadata attribute
web.display.sizeBy = 'age'

# we'll compute node color by the `velocity` metadata attribute
web.display.colorBy = 'velocity'

# show the visualization
web.show()
