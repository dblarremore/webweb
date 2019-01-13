from webweb import Web
import networkx as nx

G = nx.Graph()
G.add_edges_from([[0,1], [1, 2], [2, 3]])

# create the web
web = Web(nx_G=G)

# open the browser with the result
web.draw()
