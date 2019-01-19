from webweb import Web
import networkx as nx

G = nx.Graph()
G.add_edges_from([[0, 1], [1, 2]])

G.nodes[0]['name'] = 'Huberg'
G.nodes[1]['name'] = 'Pierot'
G.nodes[2]['name'] = 'Slartibertfast'

# create the web
web = Web(nx_G=G)

# show the visualization
web.show()
