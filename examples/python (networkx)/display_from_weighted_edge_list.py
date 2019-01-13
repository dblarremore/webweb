from webweb import Web
import networkx as nx

G = nx.Graph()
G.add_edges_from([[0, 1, {'weight' : .1}], [1, 2, {'weight' : .5}], [2, 3, {'weight' : 1}], [3, 4, {'weight' : 2}]])

# create the web
web = Web(nx_G=G)

# scale edge widths by weight so we can see a visual difference
web.display.scaleLinkWidth = True

# open the browser with the result
web.draw()
