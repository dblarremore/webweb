from webweb import Web
import networkx as nx

G = nx.Graph()
G.add_edges_from([["Dan", "Hunter"], ["Dan", "Tzu-Chi"], ["Hunter", "Steve"]])

# create the web
web = Web(nx_G=G)

# open the browser with the result
web.draw()
